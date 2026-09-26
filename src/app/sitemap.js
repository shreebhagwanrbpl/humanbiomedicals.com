import { fetchFullCatalogData, getDistrictsList } from "@/lib/db-server";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const baseUrl = "https://humanbiomedicals.com";
  const urls = [];

  // Static Pages
  urls.push(
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/services`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
    { url: `${baseUrl}/items`, lastModified: new Date() }
  );

  try {
    const [catalogData, districtsList] = await Promise.all([
      fetchFullCatalogData().catch(() => ({ categoryProducts: [] })),
      getDistrictsList().catch(() => []),
    ]);

    const districts = Array.isArray(districtsList) ? districtsList : [];
    const products = Array.isArray(catalogData?.categoryProducts) ? catalogData.categoryProducts : [];

    // District Pages
    districts.forEach((districtSlug) => {
      if (!districtSlug) return;

      urls.push(
        { url: `${baseUrl}/${districtSlug}`, lastModified: new Date() },
        { url: `${baseUrl}/${districtSlug}/about`, lastModified: new Date() },
        { url: `${baseUrl}/${districtSlug}/services`, lastModified: new Date() },
        { url: `${baseUrl}/${districtSlug}/contact`, lastModified: new Date() },
        { url: `${baseUrl}/${districtSlug}/items`, lastModified: new Date() }
      );
    });

    // Products Pages
    products.forEach((product) => {
      if (!product.slug) return;

      urls.push({
        url: `${baseUrl}/items/${product.slug}`,
        lastModified: new Date(),
      });

      // District Product URLs
      districts.forEach((districtSlug) => {
        if (!districtSlug) return;
        urls.push({
          url: `${baseUrl}/${districtSlug}/items/${product.slug}`,
          lastModified: new Date(),
        });
      });
    });
  } catch (error) {
    console.error("[sitemap] Error generating sitemap:", error);
  }

  return urls;
}