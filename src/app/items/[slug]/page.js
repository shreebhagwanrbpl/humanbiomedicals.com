import ProductDetails from "./ProductDetails";
import { getProductBySlug } from "@/lib/db-server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const productName =
    product?.title ||
    product?.name ||
    slug
      ?.replace(/-/g, " ")
      ?.replace(/\b\w/g, (c) => c.toUpperCase());

  const brand = product?.brand || "Human Biomedicals";
  const category = product?.category || "Biomedical Equipment";
  const modelText = product?.model ? ` (${product.model})` : "";

  const title = `${productName}${modelText} - Price, Dealer & Supplier in India`;

  const description =
    product?.desc ||
    product?.description ||
    `Buy authentic ${productName} at the best price in India from Human Biomedicals. Trusted supplier, dealer and distributor for hospitals, laboratories, and healthcare facilities. Certified quality with warranty and PAN India service support.`;

  const url = `https://humanbiomedicals.com/items/${slug}`;
  const imageUrl =
    product?.image ||
    (Array.isArray(product?.images) && product.images[0]) ||
    "https://humanbiomedicals.com/logo.png";

  return {
    title,
    description,
    keywords: [
      productName,
      `${productName} Supplier`,
      `${productName} Dealer`,
      `${productName} Distributor`,
      `${productName} Price`,
      `${productName} Price in India`,
      `${productName} Manufacturer`,
      brand,
      category,
      product?.model ? `${product.model} Biomedical` : null,
      "Human Biomedicals",
      "Medical Laboratory Equipment",
      "Diagnostic Equipment India",
    ].filter(Boolean),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Human Biomedicals",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: productName,
        },
      ],
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    metadataBase: new URL("https://humanbiomedicals.com"),
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const productName =
    product?.title ||
    product?.name ||
    slug?.replace(/-/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase());

  const brand = product?.brand || "Human Biomedicals";
  const category = product?.category || "Diagnostic Equipment";
  const url = `https://humanbiomedicals.com/items/${slug}`;
  const imageUrl =
    product?.image ||
    (Array.isArray(product?.images) && product.images[0]) ||
    "https://humanbiomedicals.com/logo.png";

  // Google Rich Product Snippet JSON-LD
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: productName,
    image: [imageUrl],
    description:
      product?.description ||
      product?.desc ||
      `Premium ${productName} supplied by Human Biomedicals India.`,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    category: category,
    sku: product?.categoryProductId || product?.id || slug,
    mpn: product?.model || product?.id || slug,
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "INR",
      price: product?.price ? String(product.price).replace(/[^0-9.]/g, "") || "1" : "1",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Human Biomedicals",
      },
    },
  };

  // Google BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://humanbiomedicals.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: "https://humanbiomedicals.com/items",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productName,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetails slug={slug} initialProduct={product} />
    </>
  );
}