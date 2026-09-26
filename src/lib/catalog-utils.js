/**
 * Pure Client-Safe Catalog Utilities for Human Biomedicals
 * NO Node.js built-ins (node:fs, node:sqlite) are imported here.
 */

export const WEBSITE_ID = "humanbiomedicalscom";
export const PRIMARY_COMPANY = "human";
export const ALL_COMPANIES = ["human", "global", "rajbiosis"];

/**
 * Strips http://, https://, www., dots, dashes, underscores, and spaces to produce normalized domain ID.
 * Example: "https://www.humanbiomedicals.com/" -> "humanbiomedicalscom"
 */
export function normalizeDomainId(domain = "") {
  return String(domain || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[^a-z0-9]/g, "");
}

export const normalizeSiteId = normalizeDomainId;

/**
 * Detect primary company ID from website domain / ID
 */
export function detectCompanyId(domain = WEBSITE_ID) {
  const norm = normalizeDomainId(domain);
  if (norm.includes("global")) return "global";
  if (norm.includes("rajbiosis")) return "rajbiosis";
  return "human";
}

/**
 * Standard slug generator
 */
export const makeSlug = (text = "") =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

function safeDecode(str = "") {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Standard slug normalizer with URI decoding
 */
export const normalizeSlug = (s = "") =>
  safeDecode(String(s || ""))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Strict Cascading Visibility Check:
 * - isPublished === false -> false
 * - status === 'inactive' | 'draft' -> false
 * - websiteIds === [] (empty array) -> false
 * - websiteIds contains 'all' or normalized websiteId -> true
 * - websiteIds missing/null -> default true
 */
export function isItemVisibleOnWebsite(item, websiteId = WEBSITE_ID) {
  if (!item) return false;
  if (item.isPublished === false) return false;

  const status = String(item.status || "").toLowerCase().trim();
  if (status === "inactive" || status === "draft") {
    return false;
  }

  const targetNorm = normalizeDomainId(websiteId) || normalizeDomainId(WEBSITE_ID);

  // If websiteIds is undefined or null -> default to visible
  if (item.websiteIds === undefined || item.websiteIds === null) {
    return true;
  }

  if (Array.isArray(item.websiteIds)) {
    // If explicitly empty array [] -> 0 websites selected -> HIDDEN
    if (item.websiteIds.length === 0) {
      return false;
    }
    // If includes "all" -> visible on all websites
    if (item.websiteIds.includes("all")) {
      return true;
    }
    // Check if target website matches any in websiteIds strictly
    return item.websiteIds.some((site) => {
      const siteNorm = normalizeDomainId(site);
      return siteNorm === "all" || siteNorm === targetNorm;
    });
  }

  return true;
}

export const isVisibleOnWebsite = isItemVisibleOnWebsite;

/**
 * Normalize raw product data into a standardized structure
 */
export function normalizeProduct(raw = {}, defaultCategory = "", defaultSubCategory = "", uidPrefix = "") {
  const title = (raw.title || raw.name || raw.productName || raw.itemName || "").trim();
  if (!title) return null;

  const slug = raw.slug || makeSlug(title);

  // Extract images array safely
  let images = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.filter((img) => typeof img === "string" && img.trim() !== "");
  } else if (raw.image && typeof raw.image === "string" && raw.image.trim() !== "") {
    images = [raw.image.trim()];
  } else if (Array.isArray(raw.originalImages) && raw.originalImages.length > 0) {
    images = raw.originalImages.filter((img) => typeof img === "string" && img.trim() !== "");
  }

  const category = (raw.category || defaultCategory || "Diagnostic Equipment").trim();
  const subCategory = (raw.subCategory || raw.subcategory || raw["sub category"] || defaultSubCategory || "").trim();

  let features = Array.isArray(raw.features)
    ? raw.features.filter(Boolean)
    : typeof raw.features === "string"
      ? raw.features.split(",").map((f) => f.trim()).filter(Boolean)
      : [];

  return {
    ...raw,
    id: raw.id || raw.uid || raw.categoryProductId || raw.productId || slug,
    uid: raw.uid || `${uidPrefix}-${slug}`,
    categoryProductId: raw.categoryProductId || raw.productId || raw.id || "",
    title,
    name: title,
    slug,
    price: raw.price || "",
    desc: raw.desc || raw.description || raw.detail || raw.summary || "",
    description: raw.desc || raw.description || raw.detail || raw.summary || "",
    capacity: raw.capacity || "",
    throughput: raw.throughput || "",
    instrument: raw.instrument || "",
    model: raw.model || "",
    usage: raw.usage || "",
    brand: raw.brand || "Human Biomedicals",
    parameters: raw.parameters || "",
    automation: raw.automation || "",
    availability: raw.availability || raw.status || "In Stock",
    status: raw.status || raw.availability || "active",
    size: raw.size || "",
    badge: raw.badge || raw.tag || "",
    features,
    specs: raw.specs && typeof raw.specs === "object" ? raw.specs : null,
    category,
    subCategory,
    categoryId: raw.categoryId || makeSlug(category),
    subcategoryId: raw.subcategoryId || makeSlug(subCategory),
    companyId: raw.companyId || PRIMARY_COMPANY,
    images,
    image: images[0] || "",
    video: raw.video || "",
    pdf: raw.pdf || "",
    isPublished: raw.isPublished !== false,
    websiteIds: Array.isArray(raw.websiteIds) ? raw.websiteIds : ["all"],
    type: raw.type || "category",
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}
