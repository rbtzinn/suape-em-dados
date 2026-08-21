import "server-only";

import { sheetsRepository, type SheetRow } from "@/infra/google-sheets/repository";
import {
  createReconciliationRun,
  reconcileContracts,
} from "./reconcile-contracts";

function latest(rows: SheetRow[]): SheetRow[] {
  const competence = rows.map((row) => row.competence).filter(Boolean).sort().at(-1);
  return competence ? rows.filter((row) => row.competence === competence) : [];
}

export async function refreshContractReviews(): Promise<{
  runId: string;
  rows: number;
  skipped: boolean;
}> {
  const workbook = await sheetsRepository.readSelected(
    ["import_batches", "remessa_instruments", "lai_contracts", "contract_reviews"],
    true,
  );
  const published = new Set(
    (workbook.import_batches ?? [])
      .filter((row) => row.status === "PUBLISHED")
      .map((row) => row.batch_id),
  );
  const remessa = latest(
    (workbook.remessa_instruments ?? []).filter((row) => published.has(row.import_batch_id)),
  );
  const lai = latest(
    (workbook.lai_contracts ?? []).filter((row) => published.has(row.import_batch_id)),
  );
  if (!remessa.length || !lai.length) {
    return { runId: "", rows: 0, skipped: true };
  }

  const run = createReconciliationRun(
    lai[0].competence,
    remessa[0].import_batch_id,
    lai[0].import_batch_id,
  );
  if ((workbook.contract_reviews ?? []).some((row) => row.reconciliation_run_id === run.runId)) {
    return { runId: run.runId, rows: 0, skipped: true };
  }

  const reviews = reconcileContracts(lai, remessa, run);
  for (let index = 0; index < reviews.length; index += 400) {
    await sheetsRepository.appendCanonicalRows(
      "contract_reviews",
      reviews.slice(index, index + 400),
    );
  }
  return { runId: run.runId, rows: reviews.length, skipped: false };
}
