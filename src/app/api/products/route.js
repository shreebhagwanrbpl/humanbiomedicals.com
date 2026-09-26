import { NextResponse } from "next/server";
import { fetchFullCatalog } from "@/lib/db-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

export async function GET() {
  try {
    const products = await fetchFullCatalog();
    return NextResponse.json(
      {
        success: true,
        products: products || [],
        total: products?.length || 0,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("[api/products] Error fetching products:", error);
    return NextResponse.json(
      { success: false, products: [], total: 0, error: "Failed to fetch products" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
