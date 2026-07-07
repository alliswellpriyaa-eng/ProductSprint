/**
 * Google Sheets / Excel tracker template generator.
 *
 * Builds a styled .xlsx workbook (via exceljs) for tracker-type digital
 * products (Expense Tracker, Marketing Tracker, Income Tracker, Budget
 * Tracker, and generic Trackers). The workbook is later uploaded to Google
 * Drive and converted to a native Google Sheet by lib/google-drive.ts.
 *
 * Tabs: Dashboard → Entries → Categories → Settings
 */

import ExcelJS from "exceljs";

// ─── Brand palette (matches Tailwind classes used across the app UI) ─────────
const BRAND_PURPLE = "FF9333EA"; // tailwind purple-600
const BRAND_PURPLE_DARK = "FF7E22CE"; // tailwind purple-700
const BRAND_ORANGE = "FFF97316"; // tailwind orange-500
const HEADER_TEXT = "FFFFFFFF";
const ROW_BAND = "FFF9FAFB"; // tailwind gray-50
const BORDER_GRAY = "FFE5E7EB"; // tailwind gray-200
const TEXT_DARK = "FF111827"; // tailwind gray-900
const TEXT_MUTED = "FF6B7280"; // tailwind gray-500

const SAMPLE_ROWS = 40; // rows of banding/dropdown pre-applied for a nice out-of-the-box feel
const FORMULA_ROWS = 500; // range covered by SUM/COUNTA/SUMIF formulas so buyers can keep adding rows

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrackerType =
  | "Expense Tracker"
  | "Income Tracker"
  | "Marketing Tracker"
  | "Budget Tracker"
  | "Goal Tracker"
  | "Tracker";

interface ColumnDef {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

interface TrackerConfig {
  type: TrackerType;
  subtitle: string;
  entryColumns: ColumnDef[];
  categories: string[];
  categoryKey: string; // entry column key that the Categories dropdown applies to
  amountKey: string; // entry column key used for SUM / SUMIF dashboard formulas
  secondaryAmountKey?: string; // e.g. "Actual Amount" for Budget Tracker variance formulas
  statusKey?: string; // entry column key that gets an inline dropdown (e.g. "status")
  statusOptions?: string[]; // options for the inline status dropdown
}

export interface BuildTrackerOptions {
  productTitle: string;
  niche?: string;
  /** Raw product type / idea string — used to auto-detect the tracker flavor if not passed explicitly. */
  trackerType?: string;
}

export interface BuiltTracker {
  workbook: ExcelJS.Workbook;
  trackerType: TrackerType;
  fileName: string;
}

// ─── Tracker configs ──────────────────────────────────────────────────────────

const TRACKER_CONFIGS: Record<TrackerType, TrackerConfig> = {
  "Expense Tracker": {
    type: "Expense Tracker",
    subtitle: "Track every dollar out — see where your money actually goes.",
    entryColumns: [
      { header: "Date", key: "date", width: 14, numFmt: "yyyy-mm-dd" },
      { header: "Description", key: "description", width: 28 },
      { header: "Category", key: "category", width: 20 },
      { header: "Amount", key: "amount", width: 14, numFmt: '"$"#,##0.00' },
      { header: "Payment Method", key: "paymentMethod", width: 18 },
      { header: "Notes", key: "notes", width: 26 },
    ],
    categories: [
      "Housing", "Food & Groceries", "Transportation", "Utilities",
      "Entertainment", "Health & Fitness", "Shopping", "Subscriptions",
      "Travel", "Other",
    ],
    categoryKey: "category",
    amountKey: "amount",
  },
  "Income Tracker": {
    type: "Income Tracker",
    subtitle: "Track every dollar in — from every source.",
    entryColumns: [
      { header: "Date", key: "date", width: 14, numFmt: "yyyy-mm-dd" },
      { header: "Source", key: "source", width: 26 },
      { header: "Category", key: "category", width: 20 },
      { header: "Amount", key: "amount", width: 14, numFmt: '"$"#,##0.00' },
      { header: "Payment Method", key: "paymentMethod", width: 18 },
      { header: "Notes", key: "notes", width: 26 },
    ],
    categories: [
      "Salary", "Freelance", "Business", "Investments",
      "Gifts", "Refunds", "Side Hustle", "Other",
    ],
    categoryKey: "category",
    amountKey: "amount",
  },
  "Marketing Tracker": {
    type: "Marketing Tracker",
    subtitle: "Track campaign spend and performance across every channel.",
    entryColumns: [
      { header: "Date", key: "date", width: 14, numFmt: "yyyy-mm-dd" },
      { header: "Campaign", key: "campaign", width: 26 },
      { header: "Channel", key: "category", width: 20 },
      { header: "Spend", key: "amount", width: 14, numFmt: '"$"#,##0.00' },
      { header: "Impressions", key: "impressions", width: 14, numFmt: "#,##0" },
      { header: "Clicks", key: "clicks", width: 12, numFmt: "#,##0" },
      { header: "Conversions", key: "conversions", width: 14, numFmt: "#,##0" },
      { header: "Notes", key: "notes", width: 26 },
    ],
    categories: [
      "Social Media", "Email", "Paid Ads", "SEO",
      "Content Marketing", "Influencer", "Affiliate", "Referral", "Other",
    ],
    categoryKey: "category",
    amountKey: "amount",
  },
  "Budget Tracker": {
    type: "Budget Tracker",
    subtitle: "Plan a budget per category and track actual spend against it.",
    entryColumns: [
      { header: "Month", key: "month", width: 14 },
      { header: "Category", key: "category", width: 20 },
      { header: "Budgeted Amount", key: "budgeted", width: 18, numFmt: '"$"#,##0.00' },
      { header: "Actual Amount", key: "actual", width: 16, numFmt: '"$"#,##0.00' },
      { header: "Difference", key: "difference", width: 14, numFmt: '"$"#,##0.00' },
      { header: "Notes", key: "notes", width: 26 },
    ],
    categories: [
      "Housing", "Food", "Transportation", "Utilities", "Savings",
      "Debt Payments", "Entertainment", "Personal", "Other",
    ],
    categoryKey: "category",
    amountKey: "budgeted",
    secondaryAmountKey: "actual",
  },
  "Goal Tracker": {
    type: "Goal Tracker",
    subtitle: "Set targets, log progress, and see what's on track at a glance.",
    entryColumns: [
      { header: "Goal", key: "goal", width: 28 },
      { header: "Category", key: "category", width: 18 },
      { header: "Target Value", key: "targetValue", width: 14, numFmt: "#,##0.00" },
      { header: "Current Value", key: "currentValue", width: 14, numFmt: "#,##0.00" },
      { header: "Progress %", key: "progress", width: 12, numFmt: "0%" },
      { header: "Target Date", key: "targetDate", width: 14, numFmt: "yyyy-mm-dd" },
      { header: "Status", key: "status", width: 16 },
      { header: "Notes", key: "notes", width: 26 },
    ],
    categories: [
      "Financial", "Health & Fitness", "Career", "Personal Growth",
      "Business", "Relationships", "Other",
    ],
    categoryKey: "category",
    amountKey: "currentValue",
    statusKey: "status",
    statusOptions: ["Not Started", "In Progress", "Complete"],
  },
  "Tracker": {
    type: "Tracker",
    subtitle: "A flexible tracker template — customize the categories to fit your goal.",
    entryColumns: [
      { header: "Date", key: "date", width: 14, numFmt: "yyyy-mm-dd" },
      { header: "Item", key: "item", width: 28 },
      { header: "Category", key: "category", width: 20 },
      { header: "Value", key: "amount", width: 14, numFmt: "#,##0.00" },
      { header: "Status", key: "status", width: 16 },
      { header: "Notes", key: "notes", width: 26 },
    ],
    categories: ["General", "Priority", "Completed", "In Progress", "Other"],
    categoryKey: "category",
    amountKey: "amount",
    statusKey: "status",
    statusOptions: ["Not Started", "In Progress", "Complete"],
  },
};

// ─── Sample seed data ──────────────────────────────────────────────────────────
// Real example rows so a buyer opening the sheet sees a filled-in product,
// not an empty grid with $0 dashboard totals.
const SAMPLE_DATA: Record<TrackerType, Record<string, string | number>[]> = {
  "Expense Tracker": [
    { date: "2026-01-05", description: "Grocery run", category: "Food & Groceries", amount: 84.32, paymentMethod: "Credit Card", notes: "Weekly shop" },
    { date: "2026-01-08", description: "Netflix subscription", category: "Subscriptions", amount: 15.99, paymentMethod: "Credit Card", notes: "Monthly" },
    { date: "2026-01-12", description: "Gas fill-up", category: "Transportation", amount: 42.1, paymentMethod: "Debit Card", notes: "" },
  ],
  "Income Tracker": [
    { date: "2026-01-03", source: "Acme Corp", category: "Salary", amount: 3200, paymentMethod: "Direct Deposit", notes: "Biweekly paycheck" },
    { date: "2026-01-10", source: "Etsy Shop", category: "Side Hustle", amount: 220.5, paymentMethod: "PayPal", notes: "5 orders" },
    { date: "2026-01-15", source: "Client project", category: "Freelance", amount: 600, paymentMethod: "Bank Transfer", notes: "Logo design" },
  ],
  "Marketing Tracker": [
    { date: "2026-01-04", campaign: "New Year Sale", category: "Paid Ads", amount: 50, impressions: 12500, clicks: 340, conversions: 18, notes: "Facebook ads" },
    { date: "2026-01-11", campaign: "Spring Launch Teaser", category: "Social Media", amount: 0, impressions: 4200, clicks: 190, conversions: 6, notes: "Organic Instagram" },
  ],
  "Budget Tracker": [
    { month: "January", category: "Housing", budgeted: 1200, actual: 1200, notes: "Rent" },
    { month: "January", category: "Food", budgeted: 400, actual: 365.2, notes: "Under budget" },
    { month: "January", category: "Entertainment", budgeted: 100, actual: 142.5, notes: "Over — concert tickets" },
  ],
  "Goal Tracker": [
    { goal: "Save for emergency fund", category: "Financial", targetValue: 5000, currentValue: 1800, targetDate: "2026-12-31", status: "In Progress", notes: "" },
    { goal: "Run a 5K", category: "Health & Fitness", targetValue: 5, currentValue: 2, targetDate: "2026-09-01", status: "In Progress", notes: "Training 3x/week" },
    { goal: "Launch Etsy shop", category: "Business", targetValue: 1, currentValue: 1, targetDate: "2026-03-01", status: "Complete", notes: "Done!" },
  ],
  "Tracker": [
    { date: "2026-01-05", item: "Sample item one", category: "General", amount: 10, status: "In Progress", notes: "Replace with your own data" },
    { date: "2026-01-08", item: "Sample item two", category: "Priority", amount: 25, status: "Not Started", notes: "" },
  ],
};

// ─── Detection ────────────────────────────────────────────────────────────────

/** Best-effort match of a free-text tracker type against a known TrackerType key. */
function normaliseTrackerType(raw?: string): TrackerType | null {
  if (!raw) return null;
  const match = (Object.keys(TRACKER_CONFIGS) as TrackerType[]).find(
    (t) => t.toLowerCase() === raw.trim().toLowerCase()
  );
  return match ?? null;
}

/** Detects the tracker flavor from an idea title / product type string. */
export function detectTrackerType(input: string): TrackerType {
  const s = input.toLowerCase();
  if (s.includes("expense")) return "Expense Tracker";
  if (s.includes("income")) return "Income Tracker";
  if (s.includes("marketing")) return "Marketing Tracker";
  if (s.includes("budget")) return "Budget Tracker";
  if (s.includes("goal")) return "Goal Tracker";
  return "Tracker";
}

/** True if the given idea title / product type looks like a tracker-type product. */
export function isTrackerProduct(input: string): boolean {
  return input.toLowerCase().includes("tracker");
}

// ─── Column letter helper ─────────────────────────────────────────────────────

function columnLetter(index1Based: number): string {
  let n = index1Based;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function letterForKey(config: TrackerConfig, key: string): string {
  const idx = config.entryColumns.findIndex((c) => c.key === key);
  return columnLetter(idx + 1);
}

// ─── Sheet builders ───────────────────────────────────────────────────────────

function styleHeaderRow(row: ExcelJS.Row, fillColor = BRAND_PURPLE) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: BORDER_GRAY } } };
  });
  row.height = 22;
}

function bandRows(sheet: ExcelJS.Worksheet, startRow: number, endRow: number, colCount: number) {
  for (let r = startRow; r <= endRow; r++) {
    if ((r - startRow) % 2 === 1) {
      for (let c = 1; c <= colCount; c++) {
        sheet.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: ROW_BAND } };
      }
    }
    for (let c = 1; c <= colCount; c++) {
      sheet.getCell(r, c).border = { bottom: { style: "hair", color: { argb: BORDER_GRAY } } };
    }
  }
}

function addEntriesSheet(workbook: ExcelJS.Workbook, config: TrackerConfig) {
  const sheet = workbook.addWorksheet("Entries", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = config.entryColumns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  styleHeaderRow(sheet.getRow(1));

  // Apply number formats down the formula range so pasted/typed values inherit them
  config.entryColumns.forEach((c, i) => {
    if (c.numFmt) {
      const col = sheet.getColumn(i + 1);
      col.numFmt = c.numFmt;
    }
  });

  bandRows(sheet, 2, SAMPLE_ROWS + 1, config.entryColumns.length);

  // Category dropdown validation on the category column
  const catLetter = letterForKey(config, config.categoryKey);
  for (let r = 2; r <= FORMULA_ROWS; r++) {
    sheet.getCell(`${catLetter}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`Categories!$A$2:$A$${config.categories.length + 1}`],
      showErrorMessage: true,
      errorTitle: "Invalid category",
      error: "Please choose a category from the dropdown list.",
    };
  }

  // Budget Tracker: Difference = Budgeted − Actual, formula down every row
  if (config.type === "Budget Tracker" && config.secondaryAmountKey) {
    const budgetedLetter = letterForKey(config, config.amountKey);
    const actualLetter = letterForKey(config, config.secondaryAmountKey);
    const diffLetter = letterForKey(config, "difference");
    for (let r = 2; r <= FORMULA_ROWS; r++) {
      sheet.getCell(`${diffLetter}${r}`).value = {
        formula: `IF(AND(${budgetedLetter}${r}="",${actualLetter}${r}=""),"",${budgetedLetter}${r}-${actualLetter}${r})`,
      };
      sheet.getCell(`${diffLetter}${r}`).numFmt = '"$"#,##0.00';
    }
  }

  // Goal Tracker: Progress % = Current / Target, formula down every row
  if (config.type === "Goal Tracker") {
    const targetLetter = letterForKey(config, "targetValue");
    const currentLetter = letterForKey(config, "currentValue");
    const progressLetter = letterForKey(config, "progress");
    for (let r = 2; r <= FORMULA_ROWS; r++) {
      sheet.getCell(`${progressLetter}${r}`).value = {
        formula: `IF(OR(${targetLetter}${r}="",${targetLetter}${r}=0),"",${currentLetter}${r}/${targetLetter}${r})`,
      };
      sheet.getCell(`${progressLetter}${r}`).numFmt = "0%";
    }
  }

  // Inline status dropdown (e.g. Not Started / In Progress / Complete) — no separate
  // sheet needed since the option list is fixed rather than user-editable like Categories.
  if (config.statusKey && config.statusOptions) {
    const statusLetter = letterForKey(config, config.statusKey);
    for (let r = 2; r <= FORMULA_ROWS; r++) {
      sheet.getCell(`${statusLetter}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${config.statusOptions.join(",")}"`],
        showErrorMessage: true,
        errorTitle: "Invalid status",
        error: "Please choose a status from the dropdown list.",
      };
    }
  }

  // Real seed rows — a buyer opening this sheet sees a filled-in example, and the
  // Dashboard KPIs/breakdown show real numbers instead of $0 on the first open.
  const sampleRows = SAMPLE_DATA[config.type] ?? [];
  sampleRows.forEach((rowData, i) => {
    const r = sheet.getRow(i + 2);
    config.entryColumns.forEach((col) => {
      const val = rowData[col.key];
      if (val !== undefined) r.getCell(col.key).value = val;
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: config.entryColumns.length } };
}

function addCategoriesSheet(workbook: ExcelJS.Workbook, config: TrackerConfig) {
  const sheet = workbook.addWorksheet("Categories", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Category", key: "category", width: 26 },
    { header: "In Use For", key: "usage", width: 30 },
  ];
  styleHeaderRow(sheet.getRow(1), BRAND_ORANGE);

  config.categories.forEach((cat, i) => {
    sheet.getRow(i + 2).values = [cat, `Entries → ${config.categoryKey === "category" ? "Category" : config.categoryKey} column`];
  });
  bandRows(sheet, 2, config.categories.length + 1, 2);

  sheet.getColumn(2).font = { color: { argb: TEXT_MUTED }, italic: true, size: 10 };
  sheet.addRow([]);
  const tipRow = sheet.addRow(["✏️ Add or edit categories above — the Entries tab dropdown updates automatically."]);
  tipRow.getCell(1).font = { italic: true, color: { argb: TEXT_MUTED }, size: 10 };
}

function addDashboardSheet(workbook: ExcelJS.Workbook, config: TrackerConfig, productTitle: string) {
  const sheet = workbook.addWorksheet("Dashboard", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  sheet.columns = [
    { key: "a", width: 26 },
    { key: "b", width: 20 },
    { key: "c", width: 20 },
    { key: "d", width: 20 },
  ];

  // Title band
  sheet.mergeCells("A1:D1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `📊 ${productTitle}`;
  titleCell.font = { bold: true, size: 16, color: { argb: HEADER_TEXT } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PURPLE_DARK } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 30;

  sheet.mergeCells("A2:D2");
  const subtitleCell = sheet.getCell("A2");
  subtitleCell.value = config.subtitle;
  subtitleCell.font = { italic: true, color: { argb: TEXT_MUTED }, size: 10 };
  sheet.getRow(2).height = 20;

  sheet.getRow(3).values = [];

  const amountLetter = letterForKey(config, config.amountKey);
  const firstColLetter = columnLetter(1);
  const catLetter = letterForKey(config, config.categoryKey);

  let row = 4;

  // ── KPI cards ────────────────────────────────────────────────────────────
  const kpiHeaderRow = sheet.getRow(row);
  kpiHeaderRow.getCell(1).value = "KEY METRICS";
  kpiHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: TEXT_DARK } };
  row++;

  const kpis: Array<{ label: string; formula: string; fmt: string }> = [];

  if (config.type === "Budget Tracker" && config.secondaryAmountKey) {
    const actualLetter = letterForKey(config, config.secondaryAmountKey);
    kpis.push(
      { label: "Total Budgeted", formula: `SUM(Entries!${amountLetter}2:${amountLetter}${FORMULA_ROWS})`, fmt: '"$"#,##0.00' },
      { label: "Total Actual Spend", formula: `SUM(Entries!${actualLetter}2:${actualLetter}${FORMULA_ROWS})`, fmt: '"$"#,##0.00' },
      { label: "Remaining Budget", formula: `SUM(Entries!${amountLetter}2:${amountLetter}${FORMULA_ROWS})-SUM(Entries!${actualLetter}2:${actualLetter}${FORMULA_ROWS})`, fmt: '"$"#,##0.00' },
      { label: "Entries Logged", formula: `COUNTA(Entries!${firstColLetter}2:${firstColLetter}${FORMULA_ROWS})`, fmt: "#,##0" }
    );
  } else if (config.type === "Marketing Tracker") {
    const clicksLetter = letterForKey(config, "clicks");
    const impressionsLetter = letterForKey(config, "impressions");
    const conversionsLetter = letterForKey(config, "conversions");
    kpis.push(
      { label: "Total Spend", formula: `SUM(Entries!${amountLetter}2:${amountLetter}${FORMULA_ROWS})`, fmt: '"$"#,##0.00' },
      { label: "Total Impressions", formula: `SUM(Entries!${impressionsLetter}2:${impressionsLetter}${FORMULA_ROWS})`, fmt: "#,##0" },
      { label: "Total Clicks", formula: `SUM(Entries!${clicksLetter}2:${clicksLetter}${FORMULA_ROWS})`, fmt: "#,##0" },
      { label: "Total Conversions", formula: `SUM(Entries!${conversionsLetter}2:${conversionsLetter}${FORMULA_ROWS})`, fmt: "#,##0" }
    );
  } else if (config.type === "Goal Tracker") {
    const statusLetter = letterForKey(config, "status");
    const progressLetter = letterForKey(config, "progress");
    kpis.push(
      { label: "Total Goals", formula: `COUNTA(Entries!${firstColLetter}2:${firstColLetter}${FORMULA_ROWS})`, fmt: "#,##0" },
      { label: "Goals Completed", formula: `COUNTIF(Entries!${statusLetter}2:${statusLetter}${FORMULA_ROWS},"Complete")`, fmt: "#,##0" },
      { label: "Average Progress", formula: `IFERROR(AVERAGE(Entries!${progressLetter}2:${progressLetter}${FORMULA_ROWS}),0)`, fmt: "0%" }
    );
  } else {
    kpis.push(
      { label: `Total ${config.entryColumns.find((c) => c.key === config.amountKey)?.header ?? "Amount"}`, formula: `SUM(Entries!${amountLetter}2:${amountLetter}${FORMULA_ROWS})`, fmt: '"$"#,##0.00' },
      { label: "Entries Logged", formula: `COUNTA(Entries!${firstColLetter}2:${firstColLetter}${FORMULA_ROWS})`, fmt: "#,##0" },
      { label: "Average per Entry", formula: `IFERROR(SUM(Entries!${amountLetter}2:${amountLetter}${FORMULA_ROWS})/COUNTA(Entries!${firstColLetter}2:${firstColLetter}${FORMULA_ROWS}),0)`, fmt: '"$"#,##0.00' }
    );
  }

  kpis.forEach((kpi) => {
    const r = sheet.getRow(row);
    r.getCell(1).value = kpi.label;
    r.getCell(1).font = { color: { argb: TEXT_MUTED }, size: 10 };
    r.getCell(2).value = { formula: kpi.formula };
    r.getCell(2).font = { bold: true, size: 13, color: { argb: TEXT_DARK } };
    r.getCell(2).numFmt = kpi.fmt;
    r.getCell(1).border = { bottom: { style: "hair", color: { argb: BORDER_GRAY } } };
    r.getCell(2).border = { bottom: { style: "hair", color: { argb: BORDER_GRAY } } };
    row++;
  });

  row += 1;

  // ── Category breakdown table ────────────────────────────────────────────
  const breakdownHeaderRow = sheet.getRow(row);
  breakdownHeaderRow.getCell(1).value = "BREAKDOWN BY CATEGORY";
  breakdownHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: TEXT_DARK } };
  row++;

  const tableHeaderRow = sheet.getRow(row);
  tableHeaderRow.getCell(1).value = "Category";
  tableHeaderRow.getCell(2).value = "Total";
  styleHeaderRow(tableHeaderRow, BRAND_ORANGE);
  row++;

  const breakdownStart = row;
  config.categories.forEach((cat) => {
    const r = sheet.getRow(row);
    r.getCell(1).value = cat;
    r.getCell(2).value = { formula: `SUMIF(Entries!${catLetter}:${catLetter},"${cat}",Entries!${amountLetter}:${amountLetter})` };
    r.getCell(2).numFmt = '"$"#,##0.00';
    row++;
  });
  bandRows(sheet, breakdownStart, row - 1, 2);
}

function addSettingsSheet(workbook: ExcelJS.Workbook, config: TrackerConfig, options: BuildTrackerOptions) {
  const sheet = workbook.addWorksheet("Settings");
  sheet.columns = [
    { key: "label", width: 22 },
    { key: "value", width: 40 },
  ];

  sheet.mergeCells("A1:B1");
  const title = sheet.getCell("A1");
  title.value = "⚙️ Template Settings";
  title.font = { bold: true, size: 14, color: { argb: HEADER_TEXT } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PURPLE } };
  title.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 26;

  const rows: Array<[string, string]> = [
    ["Product Title", options.productTitle],
    ["Tracker Type", config.type],
    ["Niche", options.niche ?? "—"],
    ["Currency", "USD ($)"],
    ["Date Format", "YYYY-MM-DD"],
    ["Generated By", "ProductSprint"],
    ["Generated On", new Date().toISOString().slice(0, 10)],
  ];

  rows.forEach(([label, value], i) => {
    const r = sheet.getRow(i + 2);
    r.getCell(1).value = label;
    r.getCell(1).font = { bold: true, color: { argb: TEXT_DARK }, size: 10 };
    r.getCell(2).value = value;
    r.getCell(2).font = { color: { argb: TEXT_MUTED }, size: 10 };
    r.getCell(1).border = { bottom: { style: "hair", color: { argb: BORDER_GRAY } } };
    r.getCell(2).border = { bottom: { style: "hair", color: { argb: BORDER_GRAY } } };
  });

  const noteRow = sheet.getRow(rows.length + 4);
  noteRow.getCell(1).value =
    "Tip: edit the Categories tab to customize your dropdown list — the Entries tab updates automatically.";
  noteRow.getCell(1).font = { italic: true, color: { argb: TEXT_MUTED }, size: 10 };
  sheet.mergeCells(`A${rows.length + 4}:B${rows.length + 4}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function buildTrackerWorkbook(options: BuildTrackerOptions): Promise<BuiltTracker> {
  const type = normaliseTrackerType(options.trackerType) ?? detectTrackerType(options.trackerType || options.productTitle);
  const config = TRACKER_CONFIGS[type];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ProductSprint";
  workbook.lastModifiedBy = "ProductSprint";
  workbook.created = new Date();
  workbook.title = options.productTitle;

  // Tab order: Dashboard, Entries, Categories, Settings
  addDashboardSheet(workbook, config, options.productTitle);
  addEntriesSheet(workbook, config);
  addCategoriesSheet(workbook, config);
  addSettingsSheet(workbook, config, options);

  const fileName = `${options.productTitle.replace(/[^\w\s-]/g, "").trim().slice(0, 80) || "Tracker"}.xlsx`;

  return { workbook, trackerType: type, fileName };
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
