import type { SpreadsheetSpec } from "@/lib/buildSpreadsheet";

/**
 * getFallbackSpreadsheet — never show a blank state. Mirrors the pattern
 * used in lib/fallback-planners.ts. Ships one solid, real example
 * (a bookkeeping/income tracker) since that's the proven-selling category;
 * extend this map as more niches are validated.
 */
export function getFallbackSpreadsheet(productName: string): SpreadsheetSpec {
  return {
    productName,
    sheets: [
      {
        name: "Setup",
        title: `${productName} | Setup & Instructions`,
        columns: [
          { header: "Step", key: "step", width: 14 },
          { header: "Instructions", key: "instructions", width: 70 },
        ],
        rows: [
          { step: "STEP 1", instructions: "Open the Dashboard tab. It will be empty until you enter data — that's normal!" },
          { step: "STEP 2", instructions: "Go to 'Income Log'. Delete sample rows and enter your real entries." },
          { step: "STEP 3", instructions: "Go to 'Expenses'. Replace sample data with your actual expenses." },
          { step: "STEP 4", instructions: "Dashboard and Monthly Summary update automatically." },
        ],
      },
      {
        name: "Income Log",
        title: `${productName} | Income Log`,
        columns: [
          { header: "Date", key: "date", width: 14, format: "mm/dd/yyyy" },
          { header: "Source", key: "source", width: 22 },
          { header: "Description", key: "description", width: 28 },
          { header: "Amount", key: "amount", width: 14, format: "$#,##0.00" },
          { header: "Notes", key: "notes", width: 30 },
        ],
        rows: [
          { date: "2026-01-15", source: "Client A", description: "Project deposit", amount: 500, notes: "50% upfront" },
          { date: "2026-02-01", source: "Client B", description: "Monthly retainer", amount: 1200, notes: "" },
        ],
        totalsRow: { source: "TOTAL", amount: "=SUM(D3:D4)" },
      },
      {
        name: "Expenses",
        title: `${productName} | Expenses Log`,
        columns: [
          { header: "Date", key: "date", width: 14, format: "mm/dd/yyyy" },
          { header: "Vendor", key: "vendor", width: 22 },
          { header: "Category", key: "category", width: 22 },
          { header: "Amount", key: "amount", width: 14, format: "$#,##0.00" },
          { header: "Tax Deductible", key: "deductible", width: 16 },
        ],
        rows: [
          { date: "2026-01-10", vendor: "Adobe", category: "Software", amount: 54.99, deductible: "Y" },
          { date: "2026-02-01", vendor: "WeWork", category: "Office/Co-working", amount: 450, deductible: "Y" },
        ],
        totalsRow: { vendor: "TOTAL", amount: "=SUM(D3:D4)" },
      },
      {
        name: "Dashboard",
        title: `${productName} | Dashboard`,
        subtitle: "Auto-updating summary — edit your logs and this updates automatically",
        columns: [
          { header: "Metric", key: "metric", width: 26 },
          { header: "Value", key: "value", width: 20, format: "$#,##0.00" },
        ],
        rows: [
          { metric: "Total Income", value: "='Income Log'!D5" },
          { metric: "Total Expenses", value: "='Expenses'!D5" },
          { metric: "Net Profit", value: "=B3-B4" },
        ],
      },
    ],
  };
}
