/**
 * buildSpreadsheet — turns a structured JSON spec into a real, downloadable
 * .xlsx workbook (multi-tab, formatted, with live formulas) using exceljs.
 *
 * This is the piece ProductSprint was missing: every other generate-* route
 * produces marketing copy ABOUT a product. This produces the product itself
 * for spreadsheet-type digital goods (trackers, planners with calculations,
 * budget sheets, etc.) — the same category as the manually-built
 * Freelance Income Tracker.
 */
import ExcelJS from "exceljs";

// ─── Spec types (this is what Gemini is prompted to return) ──────────────────

export interface ColumnSpec {
  header: string;
  key: string;
  width?: number;
  /** Excel number format, e.g. "$#,##0.00", "0.0%", "mm/dd/yyyy" */
  format?: string;
}

export interface SheetSpec {
  name: string; // tab name, max 31 chars (Excel hard limit)
  /** Optional big title banner drawn across row 1 above the header row */
  title?: string;
  /** Optional subtitle/instructions banner in row 2 */
  subtitle?: string;
  columns: ColumnSpec[];
  /** Sample/seed rows. Values may be plain data OR formula strings prefixed with "=" */
  rows: Record<string, string | number>[];
  /** Optional totals row appended after all data rows. Keys map to column keys. */
  totalsRow?: Record<string, string | number>;
  /** Freeze the header row(s) so they stay visible on scroll */
  freezeHeader?: boolean;
}

export interface SpreadsheetSpec {
  productName: string;
  sheets: SheetSpec[];
}

// ─── Brand styling (matches the navy/gold palette used across the shop) ──────

const BRAND = {
  headerFill: "1B2A4A", // navy
  bannerFill: "1B2A4A",
  accentFill: "C9A227", // gold
  totalsFill: "E8D48A", // gold-light
  headerFont: "FFFFFF",
  bodyFont: "22262E",
};

function excelSafeSheetName(name: string, used: Set<string>): string {
  let safe = name.replace(/[\\/*?:[\]]/g, "").slice(0, 31) || "Sheet";
  let candidate = safe;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${safe.slice(0, 28)} ${i}`;
    i++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function buildSpreadsheetBuffer(spec: SpreadsheetSpec): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ProductSprint";
  wb.created = new Date();

  const usedNames = new Set<string>();

  for (const sheetSpec of spec.sheets) {
    const ws = wb.addWorksheet(excelSafeSheetName(sheetSpec.name, usedNames), {
      views: sheetSpec.freezeHeader !== false ? [{ state: "frozen", ySplit: sheetSpec.title ? 3 : 1 }] : [],
    });

    let currentRow = 1;

    // ── Title banner ──────────────────────────────────────────────────────
    if (sheetSpec.title) {
      const lastCol = sheetSpec.columns.length;
      ws.mergeCells(currentRow, 1, currentRow, Math.max(lastCol, 2));
      const titleCell = ws.getCell(currentRow, 1);
      titleCell.value = sheetSpec.title;
      titleCell.font = { bold: true, size: 14, color: { argb: `FF${BRAND.headerFont}` } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.bannerFill}` } };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };
      ws.getRow(currentRow).height = 26;
      currentRow++;

      if (sheetSpec.subtitle) {
        ws.mergeCells(currentRow, 1, currentRow, Math.max(lastCol, 2));
        const subCell = ws.getCell(currentRow, 1);
        subCell.value = sheetSpec.subtitle;
        subCell.font = { italic: true, size: 9.5, color: { argb: "FF5A5F68" } };
        subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF2D8" } };
        subCell.alignment = { vertical: "middle", horizontal: "left" };
        currentRow++;
      }
    }

    // ── Header row ─────────────────────────────────────────────────────────
    const headerRowIdx = currentRow;
    sheetSpec.columns.forEach((col, i) => {
      const cell = ws.getCell(headerRowIdx, i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: `FF${BRAND.headerFont}` } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.headerFill}` } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      ws.getColumn(i + 1).width = col.width ?? 18;
    });
    currentRow++;

    // ── Data rows ───────────────────────────────────────────────────────────
    for (const row of sheetSpec.rows) {
      sheetSpec.columns.forEach((col, i) => {
        const raw = row[col.key];
        const cell = ws.getCell(currentRow, i + 1);
        if (typeof raw === "string" && raw.startsWith("=")) {
          cell.value = { formula: raw.slice(1) };
        } else {
          cell.value = raw ?? "";
        }
        if (col.format) cell.numFmt = col.format;
      });
      currentRow++;
    }

    // ── Totals row ──────────────────────────────────────────────────────────
    if (sheetSpec.totalsRow) {
      sheetSpec.columns.forEach((col, i) => {
        const raw = sheetSpec.totalsRow![col.key];
        const cell = ws.getCell(currentRow, i + 1);
        if (typeof raw === "string" && raw.startsWith("=")) {
          cell.value = { formula: raw.slice(1) };
        } else if (raw !== undefined) {
          cell.value = raw;
        }
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.totalsFill}` } };
        if (col.format) cell.numFmt = col.format;
      });
    }

    // Thin borders on the table region for a finished look
    const firstDataRow = headerRowIdx;
    const lastRow = currentRow;
    for (let r = firstDataRow; r <= lastRow; r++) {
      for (let c = 1; c <= sheetSpec.columns.length; c++) {
        ws.getCell(r, c).border = {
          bottom: { style: "thin", color: { argb: "FFE4E0D4" } },
        };
      }
    }
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
