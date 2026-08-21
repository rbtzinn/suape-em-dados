import { NextResponse } from "next/server";

import { getSession, hasRole } from "@/auth/session";
import { importCplPdf } from "@/ingestion/import-cpl";
import { importWorkbook } from "@/ingestion/import-service";
import type { ImportModuleSelection } from "@/ingestion/types";
import { sheetsRepository } from "@/infra/google-sheets/repository";

export const runtime = "nodejs";
export const maxDuration = 300;

function originIsValid(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function selectedModule(value: FormDataEntryValue | null): ImportModuleSelection | null {
  const sourceModule = String(value ?? "AUTO").toUpperCase();
  return ["AUTO", "LAI", "REMESSA", "OUTSOURCED", "PAYROLL", "TRAVEL", "CPL"].includes(sourceModule)
    ? (sourceModule as ImportModuleSelection)
    : null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!hasRole(session, ["ADMIN", "ANALYST"])) {
    return NextResponse.json({ message: "Ação permitida para ADMIN ou ANALYST." }, { status: 403 });
  }
  if (!originIsValid(request)) {
    return NextResponse.json({ message: "Origem da requisição não autorizada." }, { status: 403 });
  }
  if (!sheetsRepository.isConfigured()) {
    return NextResponse.json({ message: "Configure a ponte do Apps Script e a planilha canônica." }, { status: 409 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const sourceModule = selectedModule(form.get("module"));
    const competence = String(form.get("competence") ?? "").trim();
    const driveUrl = String(form.get("driveUrl") ?? "").trim();
    if (!(file instanceof File) || !sourceModule) {
      return NextResponse.json({ message: "Arquivo ou tipo de fonte inválido." }, { status: 400 });
    }

    const isPdf = file.name.toLocaleLowerCase("pt-BR").endsWith(".pdf");
    const requestData = {
      actorEmail: session.email,
      actorRole: session.role === "ADMIN" ? "ADMIN" : "ANALYST",
      bytes: Buffer.from(await file.arrayBuffer()),
      competence,
      driveUrl: driveUrl || undefined,
      fileName: file.name,
      mimeType: file.type || (isPdf
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      module: sourceModule,
    } as const;
    const summary = isPdf
      ? await importCplPdf(requestData)
      : await importWorkbook(requestData);
    return NextResponse.json({
      message: `${summary.normalizedRecords} registro(s) normalizado(s) e ${summary.rawRecords} unidade(s) bruta(s) preservada(s).`,
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao importar a fonte.";
    const status = /já foi importado|Informe|Envie|limite|reconhecer|encontrada|contêm/.test(message)
      ? 400
      : 502;
    return NextResponse.json({ message: message.slice(0, 420) }, { status });
  }
}
