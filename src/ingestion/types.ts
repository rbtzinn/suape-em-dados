import type { CanonicalSheetName } from "@/infra/google-sheets/schema";
import type { CanonicalWriteRow } from "@/infra/google-sheets/repository";

export type ImportModule = "REMESSA" | "LAI";
export type ImportModuleSelection = ImportModule | "AUTO";

export interface SourceRow {
  sheetName: string;
  rowNumber: number;
  values: Record<string, unknown>;
  display: Record<string, string>;
}

export interface SourceSheet {
  title: string;
  headerRow: number;
  headers: string[];
  rows: SourceRow[];
}

export interface WorkbookExtraction {
  module: ImportModule;
  sheets: SourceSheet[];
}

export interface ParseContext {
  batchId: string;
  competence: string;
  importedAt: string;
  sourceFile: string;
  sourceFileHash: string;
}

export interface NormalizedResult {
  target: CanonicalSheetName;
  rows: CanonicalWriteRow[];
  issues: CanonicalWriteRow[];
}

export interface ImportRequest {
  actorEmail: string;
  actorRole: "ADMIN" | "ANALYST";
  bytes: Buffer;
  competence: string;
  driveUrl?: string;
  fileName: string;
  mimeType: string;
  module: ImportModuleSelection;
}

export interface ImportSummary {
  batchId: string;
  module: ImportModule;
  normalizedRecords: number;
  qualityIssues: number;
  rawRecords: number;
  sourceHash: string;
  sourceSheets: string[];
  reconciliation?: {
    runId: string;
    rows: number;
    skipped: boolean;
    warning?: string;
  };
}
