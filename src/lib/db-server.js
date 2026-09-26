import { cache } from "react";
import {
  fetchMasterCatalogFromSqlite,
  fetchRawCatalogData,
  fetchCatalogFromAdmin,
  fetchSiteDataFromAdmin,
  WEBSITE_ID,
  PRIMARY_COMPANY,
  ALL_COMPANIES,
  makeSlug,
  normalizeSlug,
  normalizeSiteId,
  normalizeDomainId,
  isItemVisibleOnWebsite,
  isVisibleOnWebsite,
  normalizeProduct,
} from "./admin-api.js";

export {
  WEBSITE_ID,
  PRIMARY_COMPANY,
  ALL_COMPANIES,
  makeSlug,
  normalizeSlug,
  normalizeSiteId,
  normalizeDomainId,
  isItemVisibleOnWebsite,
  isVisibleOnWebsite,
  normalizeProduct,
};

/**
 * React request-scoped cache for fast server-side rendering
 */
export const fetchFullCatalog = cache(async () => {
  const result = await fetchRawCatalogData(WEBSITE_ID);
  return result?.categoryProducts || result?.products || [];
});

export const fetchFullCatalogData = cache(async () => {
  const result = await fetchRawCatalogData(WEBSITE_ID);
  return {
    categoryProducts: result?.categoryProducts || result?.products || [],
    categoryList: result?.categoryList || [],
  };
});

export async function getCategoriesData() {
  const data = await fetchFullCatalogData();
  return {
    categoryList: data.categoryList,
    categoryProducts: data.categoryProducts,
  };
}

export async function getProductBySlug(slug) {
  if (!slug) return null;
  const products = await fetchFullCatalog();
  const target = normalizeSlug(slug);
  return (
    products.find((p) => {
      if (!p) return false;
      if (normalizeSlug(p.slug) === target) return true;
      if (normalizeSlug(p.title) === target) return true;
      if (p.slug === slug || p.id === slug || p.uid === slug) return true;
      return false;
    }) || null
  );
}

export const findProductBySlug = getProductBySlug;

export async function getHomeData() {
  try {
    const res = await fetchSiteDataFromAdmin(WEBSITE_ID, "home");
    return res?.data || null;
  } catch (e) {
    console.error("[db-server] Error in getHomeData:", e);
    return null;
  }
}

export async function getServicesData() {
  try {
    const res = await fetchSiteDataFromAdmin(WEBSITE_ID, "services");
    return res?.data?.services || res?.data || [];
  } catch (e) {
    console.error("[db-server] Error in getServicesData:", e);
    return [];
  }
}

export async function getContactData() {
  try {
    const res = await fetchSiteDataFromAdmin(WEBSITE_ID, "contact");
    return res?.data?.contactInfo || res?.data || [];
  } catch (e) {
    console.error("[db-server] Error in getContactData:", e);
    return [];
  }
}

export async function getDistrictData(districtSlug) {
  if (!districtSlug || districtSlug.toLowerCase() === "jaipur") {
    return null;
  }
  try {
    const res = await fetchSiteDataFromAdmin(WEBSITE_ID, "districts");
    const districts = res?.districts || res?.data || [];
    const targetSlug = districtSlug.toLowerCase().trim();
    if (Array.isArray(districts)) {
      return districts.find((d) => (d.slug || d.id || "").toLowerCase() === targetSlug) || null;
    }
    return null;
  } catch (e) {
    console.error("[db-server] Error in getDistrictData:", e);
    return null;
  }
}

export async function getDistrictsList() {
  try {
    const res = await fetchSiteDataFromAdmin(WEBSITE_ID, "districts");
    const districts = res?.districts || res?.data || [];
    if (Array.isArray(districts)) {
      return districts.map((d) => (typeof d === "string" ? d : d.slug || d.id || "")).filter(Boolean);
    }
    return [];
  } catch (e) {
    console.error("[db-server] Error in getDistrictsList:", e);
    return [];
  }
}
