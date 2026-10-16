import { MongoClient } from "mongodb";
import {
  isItemVisibleOnWebsite,
  normalizeProduct,
  makeSlug,
  normalizeSlug,
  WEBSITE_ID,
  detectCompanyId,
} from "./catalog-utils.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rajbiosis15_db_user:R7jmlgZ3RfeB0MEz@superadminrbpl.aneatej.mongodb.net/company_master_cms?retryWrites=true&w=majority";

const MONGODB_DB = process.env.MONGODB_DB || "company_master_cms";

let cachedClient = global._mongoClient || null;
let cachedDb = global._mongoDb || null;
let cachedClientPromise = global._mongoClientPromise || null;

// High-speed persistent in-memory cache to guarantee sub-millisecond responses
if (!global._mongoMasterCatalogMap) {
  global._mongoMasterCatalogMap = new Map();
}
const memoryCache = global._mongoMasterCatalogMap;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function getCached(key) {
  const item = memoryCache.get(key);
  if (item && Date.now() - item.time < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCached(key, data) {
  memoryCache.set(key, { data, time: Date.now() });
}

export function invalidateCache(keyPrefix = "") {
  if (!keyPrefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
}

/**
 * Connect to MongoDB Atlas with connection pooling
 */
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!cachedClientPromise) {
    const options = {
      maxPoolSize: 25,
      minPoolSize: 2,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    };

    cachedClientPromise = MongoClient.connect(MONGODB_URI, options)
      .then((client) => {
        global._mongoClient = client;
        global._mongoDb = client.db(MONGODB_DB);
        cachedClient = client;
        cachedDb = client.db(MONGODB_DB);
        return { client, db: cachedDb };
      })
      .catch((err) => {
        cachedClientPromise = null;
        console.error("[MongoDB] Connection error:", err.message);
        throw err;
      });
  }

  return cachedClientPromise;
}

export async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Fetch complete dynamic catalog directly from MongoDB with cascading visibility
 */
export async function getMasterCatalogFromMongo(websiteId = WEBSITE_ID) {
  const cacheKey = `catalog:${websiteId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const productsMap = new Map();
  const categoryTree = new Map();

  try {
    const db = await getDb();
    const primaryCompany = detectCompanyId(websiteId);
    const primaryCol = `${primaryCompany}_products`;

    let catDocs = [];
    try {
      catDocs = await db.collection(primaryCol).find({}).maxTimeMS(6000).toArray();
    } catch (err) {
      console.warn(`[MongoDB] Primary col ${primaryCol} error:`, err.message);
    }

    // Parallel check across company collections if needed
    const collectionsToScan = [
      primaryCol,
      "human_products",
      "rbpl_products",
      "global_products",
    ].filter((val, idx, self) => self.indexOf(val) === idx);

    if (!catDocs || catDocs.length === 0) {
      for (const colName of collectionsToScan) {
        if (colName === primaryCol) continue;
        try {
          const docs = await db.collection(colName).find({}).maxTimeMS(4000).toArray();
          if (Array.isArray(docs) && docs.length > 0) {
            catDocs.push(...docs);
          }
        } catch {
          // ignore error for fallback collections
        }
      }
    }

    // Process category trees and products
    for (const catData of catDocs) {
      if (!isItemVisibleOnWebsite(catData, websiteId)) continue;

      const catName = catData.name || catData.category || catData.id || "Medical Products";
      const catSlug = catData.slug || catData.id || makeSlug(catName);

      if (!categoryTree.has(catSlug)) {
        categoryTree.set(catSlug, {
          id: catData.id || catSlug,
          name: catName,
          category: catName,
          slug: catSlug,
          subcategories: new Map(),
        });
      }

      const catObj = categoryTree.get(catSlug);
      const subcategories = Array.isArray(catData.subcategories) ? catData.subcategories : [];

      for (const subData of subcategories) {
        if (!isItemVisibleOnWebsite(subData, websiteId)) continue;

        const subName = subData.name || subData.subCategory || subData.id || catName;
        const subSlug = subData.slug || subData.id || makeSlug(subName);

        if (!catObj.subcategories.has(subSlug)) {
          catObj.subcategories.set(subSlug, {
            id: subData.id || subSlug,
            name: subName,
            subCategory: subName,
            slug: subSlug,
            products: [],
          });
        }

        const subObj = catObj.subcategories.get(subSlug);
        const prods = Array.isArray(subData.products) ? subData.products : [];

        prods.forEach((p, idx) => {
          if (!isItemVisibleOnWebsite(p, websiteId)) return;

          const norm = normalizeProduct(
            {
              ...p,
              category: catName,
              subCategory: subName,
              categoryId: catSlug,
              subcategoryId: subSlug,
            },
            catName,
            subName,
            idx
          );

          if (norm && norm.slug && !productsMap.has(norm.slug)) {
            productsMap.set(norm.slug, norm);
            subObj.products.push(norm);
          }
        });
      }
    }

    const allProducts = Array.from(productsMap.values());
    const categoryList = Array.from(categoryTree.values())
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        category: cat.name,
        slug: cat.slug,
        subcategories: Array.from(cat.subcategories.values()),
      }))
      .filter((cat) => cat.subcategories.some((s) => (s.products || []).length > 0));

    const categoryProducts = allProducts.filter((p) => p.type === "category" || p.category);
    const normalProducts = allProducts.filter((p) => p.type !== "category" && !p.category);

    // Ultra-fast O(1) lookup Map by slug, decoded slug, id, uid, productId, categoryProductId
    const bySlug = new Map();
    allProducts.forEach((p) => {
      const s = (p.slug || "").toLowerCase().trim();
      const titleSlug = makeSlug(p.title || p.name);
      if (s) bySlug.set(s, p);
      if (titleSlug) bySlug.set(titleSlug, p);
      if (p.id) bySlug.set(String(p.id).toLowerCase().trim(), p);
      if (p.uid) bySlug.set(String(p.uid).toLowerCase().trim(), p);
      if (p.productId) bySlug.set(String(p.productId).toLowerCase().trim(), p);
      if (p.categoryProductId) bySlug.set(String(p.categoryProductId).toLowerCase().trim(), p);
    });

    const result = {
      products: allProducts,
      categories: categoryList,
      categoryList,
      categoryProducts: allProducts,
      normalProducts,
      total: allProducts.length,
      totalCount: allProducts.length,
      bySlug,
    };

    setCached(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[MongoDB] getMasterCatalogFromMongo error:", err.message);
    return {
      products: [],
      categories: [],
      categoryList: [],
      categoryProducts: [],
      normalProducts: [],
      total: 0,
      totalCount: 0,
      bySlug: new Map(),
    };
  }
}

/**
 * Fetch a single product by slug or id directly from MongoDB in O(1) time
 */
export async function getProductBySlugFromMongo(slug, websiteId = WEBSITE_ID) {
  if (!slug) return null;
  const raw = String(slug).trim();
  const target = raw.toLowerCase();
  let decoded = target;
  try {
    decoded = decodeURIComponent(raw).toLowerCase().trim();
  } catch {}
  const targetTitleSlug = makeSlug(decoded);

  const catalog = await getMasterCatalogFromMongo(websiteId);
  if (catalog?.bySlug) {
    const found =
      catalog.bySlug.get(target) ||
      catalog.bySlug.get(decoded) ||
      catalog.bySlug.get(targetTitleSlug);
    if (found) return found;
  }

  // Fallback scan across products
  return (
    catalog?.products?.find((p) => {
      const pSlug = (p.slug || "").toLowerCase().trim();
      const pTitleSlug = makeSlug(p.title || p.name);
      return (
        pSlug === target ||
        pSlug === decoded ||
        pTitleSlug === target ||
        pTitleSlug === targetTitleSlug ||
        String(p.id).toLowerCase() === target ||
        String(p.productId).toLowerCase() === target ||
        String(p.categoryProductId).toLowerCase() === target ||
        String(p.uid).toLowerCase() === target
      );
    }) || null
  );
}

/**
 * Save user enquiry directly into MongoDB queries collection for SuperAdmin
 */
export async function insertQueryToMongo({
  type = "contact",
  name,
  email,
  phone,
  message = "",
  subject = "",
  productName = "",
  productSlug = "",
  brand = "",
  model = "",
  district = "",
  websiteId = WEBSITE_ID,
}) {
  try {
    const db = await getDb();
    const queryId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const docId = `${websiteId}_${queryId}`;
    const now = new Date().toISOString();

    const doc = {
      _id: docId,
      queryId,
      websiteId,
      type,
      status: "unread",
      name: (name || "").trim(),
      email: (email || "").trim(),
      phone: (phone || "").trim(),
      message: (message || "").trim(),
      subject: (subject || (productName ? `Enquiry for ${productName}` : "General Inquiry")).trim(),
      createdAt: now,
      data: {
        id: queryId,
        queryId,
        websiteId,
        type,
        name: (name || "").trim(),
        email: (email || "").trim(),
        phone: (phone || "").trim(),
        subject: (subject || (productName ? `Enquiry for ${productName}` : "General Inquiry")).trim(),
        message: (message || "").trim(),
        productName: (productName || "").trim(),
        productSlug: (productSlug || "").trim(),
        brand: (brand || "").trim(),
        model: (model || "").trim(),
        district: (district || "").trim(),
        createdAt: now,
        source: "website",
      },
    };

    await db.collection("queries").insertOne(doc);
    return { success: true, queryId, docId };
  } catch (err) {
    console.error("[MongoDB] insertQueryToMongo error:", err.message);
    throw err;
  }
}

/**
 * Fetch dynamic site data from MongoDB
 */
export async function getSiteDataFromMongo({
  type = "page",
  page = "home",
  district = "",
  websiteId = WEBSITE_ID,
}) {
  const cacheKey = `sitedata:${websiteId}:${type}:${page}:${district}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const db = await getDb();
    let data = null;

    if (type === "home" || page === "home") {
      data = await db.collection("home").findOne({
        $or: [{ websiteId }, { id: websiteId }, { website: websiteId }],
      });
    } else if (type === "services" || page === "services") {
      data = await db.collection("services").findOne({
        $or: [{ websiteId }, { id: websiteId }],
      });
    } else if (type === "contact" || page === "contact") {
      data = await db.collection("contact").findOne({
        $or: [{ websiteId }, { id: websiteId }],
      });
    } else if (type === "districts") {
      const districtsDoc = await db.collection("websites").findOne({
        $or: [{ websiteId }, { id: websiteId }, { domain: websiteId }],
      });
      data = districtsDoc?.districts || [];
    } else {
      data = await db.collection("pages").findOne({
        $or: [
          { websiteId, page },
          { id: `${websiteId}_${page}` },
          { slug: page },
        ],
      });
    }

    if (data) {
      const result = { success: true, data };
      setCached(cacheKey, result);
      return result;
    }
    return null;
  } catch (err) {
    console.warn(`[MongoDB] getSiteDataFromMongo (${type}/${page}) error:`, err.message);
    return null;
  }
}

// Background pre-warm catalog into memory on server start
if (typeof window === "undefined") {
  setTimeout(() => {
    getMasterCatalogFromMongo().catch(() => {});
  }, 100);
}
