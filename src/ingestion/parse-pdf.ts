import "server-only";

import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export interface PdfTextPage {
  pageNumber: number;
  text: string;
}

export interface PdfTextExtraction {
  pages: PdfTextPage[];
  text: string;
}

const MAX_PAGES = 50;
const MAX_TEXT_CHARACTERS = 1_000_000;

export async function extractPdfText(bytes: Buffer): Promise<PdfTextExtraction> {
  const parser = new PDFParse({ data: bytes });
  try {
    const result = await parser.getText();
    if (result.pages.length === 0) {
      throw new Error("O PDF não contém páginas legíveis.");
    }
    if (result.pages.length > MAX_PAGES) {
      throw new Error(`O PDF excede o limite de ${MAX_PAGES} páginas por carga.`);
    }
    if (result.text.length > MAX_TEXT_CHARACTERS) {
      throw new Error("O texto extraído do PDF excede o limite seguro da carga.");
    }
    return {
      pages: result.pages.map((page) => ({
        pageNumber: page.num,
        text: page.text.trim(),
      })),
      text: result.text.trim(),
    };
  } finally {
    await parser.destroy();
  }
}
