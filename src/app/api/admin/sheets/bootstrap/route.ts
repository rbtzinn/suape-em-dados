import { NextResponse } from "next/server";

import { getSession, hasRole } from "@/auth/session";
import { sheetsRepository } from "@/infra/google-sheets/repository";

function requestOriginIsValid(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  return new URL(origin).host === new URL(request.url).host;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!hasRole(session, ["ADMIN"])) {
    return NextResponse.json({ message: "Ação permitida apenas para ADMIN." }, { status: 403 });
  }
  if (!requestOriginIsValid(request)) {
    return NextResponse.json({ message: "Origem da requisição não autorizada." }, { status: 403 });
  }
  if (!sheetsRepository.isConfigured()) {
    return NextResponse.json(
      { message: "Configure a ponte privada do Apps Script antes de preparar as abas." },
      { status: 409 },
    );
  }

  try {
    const result = await sheetsRepository.ensureCanonicalSchema();
    await sheetsRepository.appendAuditEvent({
      actorEmail: session.email,
      actorRole: session.role,
      action: "SHEETS_SCHEMA_BOOTSTRAP",
      entityType: "spreadsheet",
      entityId: process.env.GOOGLE_SHEETS_ID,
      details: result,
    });
    return NextResponse.json({
      message:
        result.created.length > 0
          ? `${result.created.length} aba(s) criada(s); cabeçalhos canônicos atualizados.`
          : "As abas já existiam; cabeçalhos canônicos verificados.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao preparar a planilha." },
      { status: 502 },
    );
  }
}
