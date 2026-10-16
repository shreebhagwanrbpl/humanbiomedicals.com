import { fetchFullCatalogData, getDistrictsList } from "@/lib/db-server";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const baseUrl = "https://humanbiomedicals.com";
  const now = new Date();
  const urls = [];

  // Core Static Pages
  urls.push(
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/items`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }
  );

  try {
    const [catalogData, districtsList] = await Promise.all([
      fetchFullCatalogData().catch(() => ({ categoryProducts: [] })),
      getDistrictsList().catch(() => []),
    ]);

    const districts = Array.isArray(districtsList) ? districtsList : [];
    const products = Array.isArray(catalogData?.categoryProducts) ? catalogData.categoryProducts : [];

    // Products Pages (High Priority)
    products.forEach((product) => {
      if (!product.slug) return;

      urls.push({
        url: `${baseUrl}/items/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
        changeFrequency: "daily",
        priority: 0.9,
      });

      // District Product URLs
      districts.forEach((districtSlug) => {
        if (!districtSlug) return;
        urls.push({
          url: `${baseUrl}/${districtSlug}/items/${product.slug}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    });

    // District Pages
    districts.forEach((districtSlug) => {
      if (!districtSlug) return;

      urls.push(
        { url: `${baseUrl}/${districtSlug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
        { url: `${baseUrl}/${districtSlug}/items`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
        { url: `${baseUrl}/${districtSlug}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
        { url: `${baseUrl}/${districtSlug}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
        { url: `${baseUrl}/${districtSlug}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 }
      );
    });
  } catch (error) {
    console.error("[sitemap] Error generating sitemap:", error);
  }

  return urls;
}