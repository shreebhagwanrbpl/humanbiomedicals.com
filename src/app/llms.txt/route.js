import { fetchFullCatalog, getHomeData, getServicesData, getContactData } from "@/lib/db-server";
import { parseContactInfo } from "@/lib/contact-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [products, homeData, services, contactInfoRaw] = await Promise.all([
      fetchFullCatalog().catch(() => []),
      getHomeData().catch(() => null),
      getServicesData().catch(() => []),
      getContactData().catch(() => []),
    ]);

    const { phones, emails, address } = parseContactInfo(contactInfoRaw);

    let content = `# Human Biomedicals - Biomedical & Diagnostic Equipment Supplier\n\n`;
    content += `> Official information and catalog for AI assistants, researchers, and healthcare professionals.\n\n`;

    if (homeData?.title || homeData?.description) {
      content += `## About Human Biomedicals\n`;
      if (homeData.title) content += `**Title:** ${homeData.title}\n\n`;
      if (homeData.description) content += `${homeData.description}\n\n`;
    }

    if (phones.length > 0 || emails.length > 0 || address) {
      content += `## Contact Information\n`;
      if (phones.length > 0) content += `- **Phone Numbers:** ${phones.join(", ")}\n`;
      if (emails.length > 0) content += `- **Email Addresses:** ${emails.join(", ")}\n`;
      if (address) content += `- **Location/Address:** ${address}\n`;
      content += `\n`;
    }

    if (Array.isArray(services) && services.length > 0) {
      content += `## Core Services\n`;
      services.forEach((s) => {
        content += `### ${s.title}\n${s.desc}\n\n`;
      });
    }

    if (Array.isArray(products) && products.length > 0) {
      content += `## Product Catalog (${products.length} Products)\n\n`;
      products.forEach((p) => {
        content += `### ${p.title}\n`;
        content += `- **Category:** ${p.category || "Diagnostic Equipment"}\n`;
        if (p.subCategory) content += `- **Sub-Category:** ${p.subCategory}\n`;
        if (p.brand) content += `- **Brand:** ${p.brand}\n`;
        if (p.model) content += `- **Model:** ${p.model}\n`;
        if (p.price) content += `- **Price:** ₹${p.price}\n`;
        if (p.desc || p.description) content += `- **Description:** ${p.desc || p.description}\n`;
        content += `- **URL:** https://humanbiomedicals.com/items/${p.slug}\n\n`;
      });
    }

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[llms.txt] Error generating llms.txt:", error);
    return new Response("# Human Biomedicals\nBiomedical Equipment Supplier", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
