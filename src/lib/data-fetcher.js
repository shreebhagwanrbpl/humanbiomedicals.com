import {
  makeSlug,
  normalizeSlug,
  normalizeSiteId,
  normalizeDomainId,
  isVisibleOnWebsite,
  isItemVisibleOnWebsite,
  normalizeProduct,
} from "./catalog-utils.js";

export {
  makeSlug,
  normalizeSlug,
  normalizeSiteId,
  normalizeDomainId,
  isVisibleOnWebsite,
  isItemVisibleOnWebsite,
  normalizeProduct,
};

let clientCatalogPromise = null;

/**
 * Fetch full catalog for client or server components
 */
export async function fetchFullCatalog() {
  const data = await fetchFullCatalogData();
  return data?.categoryProducts || [];
}

/**
 * Fetch catalog data with categories hierarchy (Instant zero-delay fetch)
 */
export async function fetchFullCatalogData() {
  if (typeof window === "undefined") {
    const { fetchFullCatalogData: fetchServerCatalog } = await import("./db-server.js");
    return await fetchServerCatalog();
  }

  if (clientCatalogPromise) {
    return clientCatalogPromise;
  }

  clientCatalogPromise = (async () => {
    try {
      const res = await fetch(`/api/catalog?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch catalog: ${res.status}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("[data-fetcher] Error in fetchFullCatalogData:", err);
      return { categoryProducts: [], categoryList: [] };
    } finally {
      clientCatalogPromise = null;
    }
  })();

  return clientCatalogPromise;
}

export async function getCategoriesData() {
  const data = await fetchFullCatalogData();
  return {
    categoryList: data?.categoryList || [],
    categoryProducts: data?.categoryProducts || [],
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

/**
 * Client/Server helper for site data
 */
async function fetchSiteDataType(type) {
  if (typeof window === "undefined") {
    const dbServer = await import("./db-server.js");
    switch (type) {
      case "home":
        return await dbServer.getHomeData();
      case "contact":
        return await dbServer.getContactData();
      case "services":
        return await dbServer.getServicesData();
      default:
        return null;
    }
  }

  try {
    const res = await fetch(`/api/site-data?type=${encodeURIComponent(type)}&_t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.error(`[data-fetcher] Error fetching site-data (${type}):`, err);
    return null;
  }
}

export async function fetchHomeData() {
  return fetchSiteDataType("home");
}

export async function fetchContactData() {
  const data = await fetchSiteDataType("contact");
  return Array.isArray(data) ? data : data?.contactInfo || [];
}

export async function fetchServicesData() {
  const data = await fetchSiteDataType("services");
  return Array.isArray(data) ? data : data?.services || [];
}

export async function fetchDistrictData(district) {
  if (!district || district.toLowerCase() === "jaipur") return null;

  if (typeof window === "undefined") {
    const { getDistrictData } = await import("./db-server.js");
    return await getDistrictData(district);
  }

  try {
    const res = await fetch(`/api/site-data?type=districts&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const districts = json?.districts || json?.data || [];
    const targetSlug = district.toLowerCase().trim();
    if (Array.isArray(districts)) {
      return districts.find((d) => (d.slug || d.id || "").toLowerCase() === targetSlug) || null;
    }
    return null;
  } catch (err) {
    console.error("[data-fetcher] Error fetching district data:", err);
    return null;
  }
}

export async function fetchDistrictsList() {
  if (typeof window === "undefined") {
    const { getDistrictsList } = await import("./db-server.js");
    return await getDistrictsList();
  }

  try {
    const res = await fetch(`/api/site-data?type=districts&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const districts = json?.districts || json?.data || [];
    if (Array.isArray(districts)) {
      return districts.map((d) => (typeof d === "string" ? d : d.slug || d.id || "")).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.error("[data-fetcher] Error fetching districts list:", err);
    return [];
  }
}

/**
 * Subscribe to catalog updates in real-time.
 * Instant polling (1.5s) + Window Focus & Visibility Change triggers
 * Ensures any Admin assignment/removal reflects instantly on UI.
 */
export function subscribeToCatalog(onUpdate) {
  let active = true;

  const checkUpdates = async () => {
    if (!active || typeof onUpdate !== "function") return;
    try {
      const res = await fetch(`/api/catalog?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        const prods = data?.categoryProducts || [];
        if (active && typeof onUpdate === "function") {
          onUpdate(prods);
        }
      }
    } catch (err) {
      console.warn("[data-fetcher] subscribeToCatalog polling error:", err);
    }
  };

  // Initial immediate fetch
  checkUpdates();

  // Polling every 1.5 seconds
  const interval = setInterval(checkUpdates, 1500);

  // Focus & Visibility change listeners for instant refresh when switching from Admin tab
  const handleFocus = () => {
    checkUpdates();
  };

  const handleVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      checkUpdates();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibility);
  }

  return () => {
    active = false;
    clearInterval(interval);
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibility);
    }
  };
}

/**
 * Subscribe to site data (e.g. home, contact, services) in real-time
 */
export function subscribeToSiteData(type = "home", onUpdate) {
  let active = true;

  const checkUpdates = async () => {
    if (!active || typeof onUpdate !== "function") return;
    try {
      const res = await fetch(`/api/site-data?type=${encodeURIComponent(type)}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const json = await res.json();
        const siteData = json?.data || null;
        if (active && typeof onUpdate === "function") {
          onUpdate(siteData);
        }
      }
    } catch (err) {
      // quiet catch
    }
  };

  const interval = setInterval(checkUpdates, 2000);

  const handleFocus = () => {
    checkUpdates();
  };

  const handleVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      checkUpdates();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibility);
  }

  return () => {
    active = false;
    clearInterval(interval);
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibility);
    }
  };
}
