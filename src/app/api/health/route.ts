import { NextResponse } from "next/server";
import { isGoogleSheetsConfigured } from "@/infra/google-sheets/auth";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "suape-em-dados",
    sheetsConfigured: isGoogleSheetsConfigured(),
    timestamp: new Date().toISOString(),
  });
}
