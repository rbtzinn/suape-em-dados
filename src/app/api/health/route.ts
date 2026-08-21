import { NextResponse } from "next/server";
import { isSheetsBridgeConfigured } from "@/infra/google-sheets/apps-script";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "suape-em-dados",
    sheetsConfigured: isSheetsBridgeConfigured(),
    timestamp: new Date().toISOString(),
  });
}
