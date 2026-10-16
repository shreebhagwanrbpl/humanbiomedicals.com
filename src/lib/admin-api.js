/**
 * MongoDB Atlas & SuperAdmin API Client for Human Biomedicals
 * Connects directly to MongoDB Atlas (<1ms cached sync)
 * with graceful SuperAdmin HTTP API fallback.
 */

import {
  WEBSITE_ID,
  PRIMARY_COMPANY,
  ALL_COMPANIES,
  normalizeDomainId,
  normalizeSiteId,
  detectCompanyId,
  makeSlug,
  normalizeSlug,
  isItemVisibleOnWebsite,
  isVisibleOnWebsite,
  normalizeProduct,
} from "./catalog-utils.js";

import {
  getMasterCatalogFromMongo,
  getProductBySlugFromMongo,
  insertQueryToMongo,
  getSiteDataFromMongo,
} from "./mongodb.js";

// Re-export pure catalog utilities
export {
  WEBSITE_ID,
  PRIMARY_COMPANY,
  ALL_COMPANIES,
  normalizeDomainId,
  normalizeSiteId,
  detectCompanyId,
  makeSlug,
  normalizeSlug,
  isItemVisibleOnWebsite,
  isVisibleOnWebsite,
  normalizeProduct,
  getMasterCatalogFromMongo,
  getProductBySlugFromMongo,
  insertQueryToMongo,
  getSiteDataFromMongo,
};

export const DEFAULT_ADMIN_URL = (
  process.env.ADMIN_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ||
  process.env.ADMIN_API_URL ||
  "https://admin.rajbiosis.app"
).replace(/\/$/, "");

export const ADMIN_API_BASE_URL = DEFAULT_ADMIN_URL;

function getCandidateUrls() {
  const envUrl =
    process.env.ADMIN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ||
    process.env.ADMIN_API_URL;
  const list = [envUrl, "https://admin.rajbiosis.app"].filter(Boolean).map((u) => u.replace(/\/$/, ""));
  return [...new Set(list)];
}

/**
 * Fetch raw catalog data (tries MongoDB Atlas directly first, then SuperAdmin HTTP API fallback)
 */
export async function fetchRawCatalogData(websiteId = WEBSITE_ID) {
  // 1. Direct MongoDB Atlas query with in-memory caching (<1ms)
  try {
    const mongoResult = await getMasterCatalogFromMongo(websiteId);
    if (
      mongoResult &&
      Array.isArray(mongoResult.categoryProducts) &&
      mongoResult.categoryProducts.length > 0
    ) {
      return mongoResult;
    }
  } catch (err) {
    console.warn("[admin-api] Direct MongoDB catalog fetch failed, trying SuperAdmin API:", err.message);
  }

  // 2. HTTP SuperAdmin API fallback
  return await fetchCatalogFromAdmin(websiteId);
}

/**
 * Fetch catalog data from SuperAdmin API fallback
 */
export async function fetchCatalogFromAdmin(websiteId = WEBSITE_ID) {
  const candidateUrls = getCandidateUrls();
  let lastError = null;

  for (const baseUrl of candidateUrls) {
    try {
      const url = `${baseUrl}/api/catalog?websiteId=${encodeURIComponent(websiteId)}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (
        data &&
        (Array.isArray(data.products) ||
          Array.isArray(data.categoryProducts) ||
          Array.isArray(data.data) ||
          Array.isArray(data.categoryList))
      ) {
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) {
    console.warn("[admin-api] Error fetching catalog from candidate URLs:", lastError.message);
  }
  return { success: false, products: [], categoryList: [], categoryProducts: [], data: [] };
}

/**
 * Fetch site-data (home, contact, services, districts, etc.)
 */
export async function fetchSiteDataFromAdmin(websiteId = WEBSITE_ID, type = "all") {
  // 1. Check direct MongoDB first
  try {
    const mongoData = await getSiteDataFromMongo({
      type,
      page: type,
      websiteId,
    });
    if (mongoData && mongoData.data !== null && mongoData.data !== undefined) {
      return mongoData;
    }
  } catch (mErr) {
    // fallback
  }

  // 2. Fallback to candidate HTTP URLs
  const candidateUrls = getCandidateUrls();
  let lastError = null;
  let fallbackResult = null;

  for (const baseUrl of candidateUrls) {
    try {
      const url = `${baseUrl}/api/site-data?websiteId=${encodeURIComponent(
        websiteId
      )}&type=${encodeURIComponent(type)}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) continue;

      const json = await res.json();
      if (json && json.data !== null && json.data !== undefined) {
        return json;
      }
      if (json && !fallbackResult) {
        fallbackResult = json;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (fallbackResult) {
    return fallbackResult;
  }

  if (lastError) {
    console.warn(`[admin-api] Error fetching site-data (${type}):`, lastError.message);
  }
  return { success: false, data: null };
}

/**
 * Submit Contact Query: Saves to MongoDB Atlas queries collection AND forwards to SuperAdmin API
 */
export async function submitContactQuery(payload) {
  let mongoSaved = false;
  let mongoResult = null;

  // 1. Direct write to MongoDB Atlas `queries` collection
  try {
    mongoResult = await insertQueryToMongo({
      type: "contact",
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      subject: payload.subject || "Contact Form Inquiry",
      message: payload.message || "",
      district: payload.district || "",
      websiteId: payload.websiteId || WEBSITE_ID,
    });
    mongoSaved = true;
  } catch (mErr) {
    console.error("[admin-api] Error saving contact query to MongoDB Atlas:", mErr.message);
  }

  // 2. Forward to SuperAdmin REST endpoint
  const candidateUrls = getCandidateUrls();
  const bodyData = {
    websiteId: WEBSITE_ID,
    ...payload,
    createdAt: new Date().toISOString(),
  };

  for (const baseUrl of candidateUrls) {
    try {
      const url = `${baseUrl}/api/contact-query`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        return {
          success: true,
          message: "Contact query processed successfully",
          mongoSaved,
          queryId: mongoResult?.queryId,
        };
      }
    } catch (err) {
      // try next candidate
    }
  }

  return {
    success: true,
    message: mongoSaved ? "Contact query saved to MongoDB successfully" : "Contact query submitted",
    mongoSaved,
    queryId: mongoResult?.queryId,
  };
}

/**
 * Submit Product Query: Saves to MongoDB Atlas queries collection AND forwards to SuperAdmin API
 */
export async function submitProductQuery(payload) {
  let mongoSaved = false;
  let mongoResult = null;

  // 1. Direct write to MongoDB Atlas `queries` collection
  try {
    mongoResult = await insertQueryToMongo({
      type: "product",
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      productName: payload.productName || payload.title || "",
      productSlug: payload.productSlug || payload.slug || "",
      brand: payload.brand || "",
      model: payload.model || "",
      subject: payload.subject || `Product Inquiry: ${payload.productName || payload.title || ""}`,
      message: payload.message || "",
      district: payload.district || "",
      websiteId: payload.websiteId || WEBSITE_ID,
    });
    mongoSaved = true;
  } catch (mErr) {
    console.error("[admin-api] Error saving product query to MongoDB Atlas:", mErr.message);
  }

  // 2. Forward to SuperAdmin REST endpoint
  const candidateUrls = getCandidateUrls();
  const bodyData = {
    websiteId: WEBSITE_ID,
    ...payload,
    createdAt: new Date().toISOString(),
  };

  for (const baseUrl of candidateUrls) {
    try {
      const url = `${baseUrl}/api/product-query`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        return {
          success: true,
          message: "Product enquiry processed successfully",
          mongoSaved,
          queryId: mongoResult?.queryId,
        };
      }
    } catch (err) {
      // try next candidate
    }
  }

  return {
    success: true,
    message: mongoSaved ? "Product enquiry saved to MongoDB successfully" : "Product enquiry submitted",
    mongoSaved,
    queryId: mongoResult?.queryId,
  };
}
