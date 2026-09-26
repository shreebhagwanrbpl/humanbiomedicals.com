import { NextResponse } from "next/server";
import { submitProductQuery } from "@/lib/admin-api";

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body || !body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (name, phone)" },
        { status: 400 }
      );
    }

    const result = await submitProductQuery({
      name: body.name.trim(),
      email: (body.email || "").trim(),
      phone: body.phone.trim(),
      productName: body.productName || body.title || "",
      productSlug: body.productSlug || body.slug || "",
      brand: body.brand || "",
      model: body.model || "",
      message: body.message || "",
    });

    return NextResponse.json({
      success: true,
      message: "Product enquiry processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("[api/product-query] Error processing product query:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error processing enquiry" },
      { status: 500 }
    );
  }
}
