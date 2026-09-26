import { NextResponse } from "next/server";
import { fetchFullCatalogData } from "@/lib/db-server";

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
    const data = await fetchFullCatalogData();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/catalog] Error fetching catalog:", error);
    return NextResponse.json(
      { categoryProducts: [], categoryList: [], error: String(error?.message || error) },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
