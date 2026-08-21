import "server-only";

import { cache } from "react";

import { demoSnapshot } from "./demo";
import {
  buildFromWorkbook,
  emptySnapshot,
  SNAPSHOT_SHEETS,
} from "./snapshot-builder";
import type { SystemSnapshot } from "@/domain/types";
import { sheetsRepository } from "@/infra/google-sheets/repository";

async function loadSystemSnapshot(): Promise<SystemSnapshot> {
  if (!sheetsRepository.isConfigured()) {
    if (process.env.DEMO_MODE === "true") return demoSnapshot;
    return emptySnapshot({
      mode: "degraded",
      updatedAt: "Google Sheets não configurado",
      notice: "O portal não exibirá dados de demonstração. Configure a integração oficial.",
    });
  }

  try {
    const workbook = await sheetsRepository.readSelected(SNAPSHOT_SHEETS);
    const totalRows = Object.values(workbook).reduce(
      (total, rows) => total + (rows?.length ?? 0),
      0,
    );
    if (totalRows === 0) {
      return emptySnapshot({
        mode: "degraded",
        updatedAt: "Google Sheets conectado, mas sem lotes publicados",
        notice: "A base canônica está vazia. Importe uma fonte antes de publicar o portal.",
      });
    }
    return buildFromWorkbook(workbook);
  } catch (error) {
    return emptySnapshot({
      mode: "degraded",
      updatedAt: "Falha ao consultar o Google Sheets",
      notice:
        error instanceof Error
          ? error.message
          : "Erro de integração não identificado.",
    });
  }
}

export const getSystemSnapshot = cache(loadSystemSnapshot);
