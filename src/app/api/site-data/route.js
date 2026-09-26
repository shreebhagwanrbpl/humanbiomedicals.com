import { NextResponse } from "next/server";
import { fetchSiteDataFromAdmin, WEBSITE_ID } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get("websiteId") || WEBSITE_ID;
    const type = searchParams.get("type") || "all";

    const data = await fetchSiteDataFromAdmin(websiteId, type);
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/site-data] Error fetching site data:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch site data" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
