export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://humanbiomedicals.com/sitemap.xml",
    host: "https://humanbiomedicals.com",
  };
}