import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import { buildSpreadsheetBuffer, type SpreadsheetSpec } from "@/lib/buildSpreadsheet";
import { getFallbackSpreadsheet } from "@/lib/fallback-spreadsheets";

export const maxDuration = 60;

const TTL_24H = 24 * 60 * 60 * 1000;
const MODELS = ["gemini-2.5-flash"] as const; // structured multi-sheet spec needs the stronger model

function buildSpecPrompt(idea: string): string {
  return `You are an expert spreadsheet product designer for Etsy digital-download sellers. Design the ACTUAL spreadsheet product (not marketing copy) for this idea:

Product: "${idea}"

CRITICAL: Return ONLY valid JSON, no markdown fences, directly parseable by JSON.parse().

Return exactly this structure:
{
  "productName": "Clean product name",
  "sheets": [
    {
      "name": "Tab name, max 31 characters",
      "title": "Banner title shown in row 1, e.g. 'PRODUCT NAME | Tab Purpose'",
      "subtitle": "Optional one-line instruction shown under the title, or omit",
      "columns": [
        { "header": "Column Header", "key": "camelCaseKey", "width": 18, "format": "$#,##0.00 or 0.0% or mm/dd/yyyy or omit" }
      ],
      "rows": [
        { "camelCaseKey": "sample value or a formula string starting with =, e.g. =SUM(D3:D4)" }
      ],
      "totalsRow": { "camelCaseKey": "=SUM(D3:D4) or a label like TOTAL" },
      "freezeHeader": true
    }
  ]
}

RULES:
- 4 to 8 sheets. Always include a "Dashboard" sheet LAST that references other sheets with real cross-sheet formulas, e.g. "='Income Log'!D5".
- Every data-entry sheet needs a totalsRow with a real SUM formula referencing the correct column letter and row range.
- Formulas MUST use correct Excel A1 cell references consistent with the row/column layout you generate (title row = 1, subtitle row = 2 if present, header row next, then data rows in order, totals row last).
- Include 2-3 realistic sample rows per data sheet — never leave rows empty.
- Column "format" should be a valid Excel number format string when the column holds currency, percentages, or dates; omit for plain text.
- Keep this genuinely useful and sellable — the kind of structure a real freelancer/small-business buyer would pay $15-30 for on Etsy.`;
}

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_template", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("template_spec", idea);
    let spec = getServerCache<SpreadsheetSpec>(key);
    let modelUsed = "cache";
    let fellBack = false;

    if (!spec) {
      if (!process.env.GEMINI_API_KEY) {
        spec = getFallbackSpreadsheet(idea);
        fellBack = true;
      } else {
        try {
          const call = await geminiCall(
            process.env.GEMINI_API_KEY,
            buildSpecPrompt(idea),
            { responseMimeType: "application/json", maxOutputTokens: 8192, temperature: 0.5 },
            { models: MODELS, timeoutMs: 40_000 }
          );
          spec = extractJson<SpreadsheetSpec>(call.rawText);
          modelUsed = call.modelUsed;
          if (!spec?.sheets?.length) throw new Error("Empty spec returned");
          setServerCache(key, spec, TTL_24H);
        } catch (error: unknown) {
          const { message, code } = parseGeminiError(error);
          console.error(`[generate-template][${code}]`, error instanceof Error ? error.message : message);
          spec = getFallbackSpreadsheet(idea);
          fellBack = true;
        }
      }
    }

    // ── Build the actual .xlsx file from the spec ────────────────────────────
    try {
      const buffer = await buildSpreadsheetBuffer(spec);
      const base64 = buffer.toString("base64");

      console.log({
        route: "generate-template",
        model: modelUsed,
        fallback: fellBack,
        sheetCount: spec.sheets.length,
      });

      return NextResponse.json({
        productName: spec.productName,
        spec,
        fileBase64: base64,
        fileName: `${spec.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}.xlsx`,
        fallback: fellBack,
        modelUsed,
      });
    } catch (buildError: unknown) {
      console.error("[generate-template] xlsx build failed:", buildError);
      return NextResponse.json(
        { error: "SPREADSHEET_BUILD_FAILED", message: "Could not build the spreadsheet file from the generated spec." },
        { status: 500 }
      );
    }
  });
}
