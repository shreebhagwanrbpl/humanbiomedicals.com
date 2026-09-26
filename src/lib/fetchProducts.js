import { fetchFullCatalog, normalizeProduct, makeSlug } from "./data-fetcher.js";

export { normalizeProduct, makeSlug };

/**
 * Fetches dynamic products from SQLite Admin API
 * Returns empty array if no products exist (zero static text/product fallback).
 */
export async function fetchAllDynamicProducts() {
  try {
    const fullCatalog = await fetchFullCatalog();
    if (Array.isArray(fullCatalog) && fullCatalog.length > 0) {
      return fullCatalog;
    }
  } catch (err) {
    console.error("[fetchProducts] Error fetching dynamic products:", err);
  }

  return [];
}
