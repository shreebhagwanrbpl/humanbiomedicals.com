import { NextResponse } from "next/server";
import { submitContactQuery } from "@/lib/admin-api";

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body || !body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (name, phone)" },
        { status: 400 }
      );
    }

    const result = await submitContactQuery({
      name: body.name.trim(),
      email: (body.email || "").trim(),
      phone: body.phone.trim(),
      message: (body.message || "").trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Contact query processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("[api/contact-query] Error processing contact query:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error processing query" },
      { status: 500 }
    );
  }
}
