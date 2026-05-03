/**
 * Fallback (demo) data returned when the Gemini API is unavailable.
 * Shapes must match the real API response shapes exactly.
 */

// ─── generate-ideas ───────────────────────────────────────────────────────────
export const FALLBACK_IDEAS = [
  { title: "Kids Daily Routine Chart Printable", description: "Visual morning and bedtime routine tracker for children ages 4–8, perfect for building habits." },
  { title: "Teacher Weekly Lesson Planner", description: "Editable 5-day classroom planning template for K–12 teachers with notes and objective sections." },
  { title: "Monthly Budget Tracker Sheet", description: "Simple income and expense tracker for households, with savings goal and category breakdown." },
  { title: "Wedding Guest List & RSVP Manager", description: "Printable spreadsheet to track guests, RSVPs, meal preferences, and gift records." },
  { title: "30-Day Fitness Challenge Tracker", description: "Daily workout and progress log for beginners starting a new fitness routine." },
  { title: "Self-Care Weekly Habit Checklist", description: "Wellness and habit tracker with daily reflection prompts, designed for busy moms." },
  { title: "Gratitude Journal Template Pages", description: "Daily gratitude pages with morning prompts, mood tracker, and evening reflection." },
  { title: "Kids Chore Chart Reward System", description: "Weekly task and responsibility chart with star stickers system for ages 5–12." },
  { title: "Small Business Income Log", description: "Monthly revenue and expense tracker for Etsy sellers and freelancers." },
  { title: "Seasonal Activity Bucket List", description: "Fun printable activity checklist for families and friends across all four seasons." },
];

// ─── generate-seo ─────────────────────────────────────────────────────────────
export const FALLBACK_SEO_TITLES = [
  "Kids Daily Routine Chart Printable | Morning & Bedtime Schedule | Instant Download PDF",
  "Printable Daily Routine Chart for Kids | Visual Schedule Planner | Homeschool Organizer",
  "Kids Routine Checklist Printable | Daily Schedule for Children | Editable PDF Template",
];

// ─── generate-tags ────────────────────────────────────────────────────────────
export const FALLBACK_TAGS = [
  "kids routine chart",
  "daily schedule kids",
  "printable planner",
  "kids chore chart",
  "morning routine pdf",
  "routine printable",
  "kids organizer",
  "digital download",
  "instant download",
  "homeschool printable",
  "kids activity",
  "toddler schedule",
  "routine tracker",
];

// ─── analyze-idea ─────────────────────────────────────────────────────────────
export const FALLBACK_ANALYSIS = {
  demand: "High" as const,
  competition: "Medium" as const,
  potential: "High" as const,
  audience: "Parents & Teachers",
  difficulty: "Easy" as const,
};

// ─── generate-planner ─────────────────────────────────────────────────────────
export const FALLBACK_PLANNER_DAYS = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const phase = day <= 5 ? "Setup" : day <= 20 ? "Build" : "Launch";

  const products = [
    { title: "Daily Routine Chart", type: "Checklist" },
    { title: "Weekly Habit Tracker", type: "Tracker" },
    { title: "Monthly Budget Sheet", type: "Planner" },
    { title: "Gratitude Journal Pages", type: "Journal" },
    { title: "Kids Activity Book", type: "Activity Book" },
    { title: "Goal Setting Workbook", type: "Workbook" },
    { title: "Meal Planning Template", type: "Template" },
    { title: "Reading Log Printable", type: "Tracker" },
    { title: "Birthday Party Planner", type: "Planner" },
    { title: "Fitness Challenge Sheet", type: "Tracker" },
    { title: "Morning Routine Poster", type: "Wall Art" },
    { title: "Self-Care Checklist", type: "Checklist" },
    { title: "Vision Board Template", type: "Template" },
    { title: "Kids Coloring Pages Pack", type: "Coloring Book" },
    { title: "Class Schedule Template", type: "Template" },
  ];

  const pick = products[day % products.length];

  return {
    day,
    phase,
    title: pick.title,
    goal: `Create and publish your ${pick.title}`,
    tasks: [
      `Open Canva and choose US Letter template`,
      `Design the ${pick.title} layout`,
      `Add your fonts, colors, and branding`,
      `Export as PDF Print and upload to Etsy`,
    ],
    design: {
      size: "US Letter (8.5×11 in)",
      orientation: "Portrait",
      style: "Minimal & Clean",
      tool: "Canva",
    },
    keywords: [`${pick.title.toLowerCase()} printable`, `digital ${pick.type.toLowerCase()}`, "instant download"],
    pricing: "$3.99–$6.99",
    time: "2–3 hours",
    effort: day <= 5 ? "Easy" : day <= 20 ? "Medium" : ("Easy" as "Easy" | "Medium" | "Hard"),
  };
});

// ─── create-product ───────────────────────────────────────────────────────────
export const FALLBACK_PRODUCT = {
  pages: [
    "Cover Page — title, your shop name, and a simple illustration",
    "Instructions Page — brief how-to-use guide for the buyer",
    "Main Content Page 1 — primary template (daily grid, chart, or tracker)",
    "Main Content Page 2 — secondary template or variation",
    "Notes & Extras Page — blank notes section or bonus checklist",
  ],
  size: "US Letter (8.5×11 in)",
  orientation: "Portrait",
  style: "Minimal & Clean",
  tips: [
    "Use a free font like Poppins or Nunito — both are beginner-friendly and look professional",
    "Stick to 2–3 colors maximum to keep the design cohesive",
    "Add plenty of white space — it makes the product feel premium",
    "Export as PDF Print for the highest quality; avoid PNG for multi-page products",
    "Add a small footer with your shop name on every page for brand recognition",
  ],
};

// ─── examples ─────────────────────────────────────────────────────────────────
export const FALLBACK_EXAMPLES = {
  titles: [
    "Kids Daily Routine Chart Printable | Morning & Bedtime Schedule | Instant Download PDF",
    "Daily Routine Printable for Kids | Visual Schedule Chart | Homeschool Planner PDF",
  ],
  priceRange: "$3.99–$7.99",
  includes: [
    "Printable PDF file (US Letter, 8.5×11 in)",
    "Editable Canva template link",
    "Both color and black-and-white versions",
    "Instant download — no waiting",
  ],
  sellerTip: "Add a color AND a black-and-white version to your listing — buyers love the option to save on ink.",
};

// ─── generate-platform (Gumroad) ──────────────────────────────────────────────
export const FALLBACK_GUMROAD = {
  platform: "gumroad",
  productName: "Kids Daily Routine Chart Printable",
  tagline: "A simple printable that turns chaotic mornings into calm routines.",
  description:
    "Tired of the morning rush? This printable routine chart helps your kids know exactly what to do — no reminders needed.\n\nDesigned for ages 4–10, it covers morning, afternoon, and bedtime routines with simple checkboxes your child can actually use. Print it once, laminate it, and use it forever.\n\nDownload instantly and start tomorrow.",
  salesBullets: [
    "Printable PDF — download and print at home in minutes",
    "Designed for ages 4–10, easy for kids to follow independently",
    "Covers morning, after school, and bedtime routines",
    "Works with dry-erase markers when laminated",
    "Instant download — no account or subscription needed",
  ],
  suggestedPrice: "$4.99",
  tags: ["kids routine", "printable chart", "parenting", "homeschool", "daily schedule"],
};

// ─── generate-platform (Shopify) ─────────────────────────────────────────────
export const FALLBACK_SHOPIFY = {
  platform: "shopify",
  productTitle: "Kids Daily Routine Chart Printable PDF",
  metaDescription: "Printable routine chart for kids ages 4–10. Covers morning, afternoon & bedtime. Instant PDF download.",
  description:
    "Help your child build independence with this beautifully designed routine chart. Perfect for ages 4–10, it visually maps out morning, after-school, and bedtime tasks in a format kids can actually follow.\n\nSimply download, print, and hang it up. Works beautifully when laminated with a dry-erase marker. Designed by a mom, tested by real kids.\n\nEvery purchase includes an instant digital download — no shipping, no waiting.",
  bulletPoints: [
    "Instant PDF download — ready to print in minutes",
    "Designed for kids ages 4–10",
    "Covers morning, after-school, and bedtime routines",
    "Compatible with lamination + dry-erase markers",
    "US Letter and A4 sizes included",
  ],
  tags: ["kids", "routine chart", "printable", "digital download", "parenting", "homeschool"],
  suggestedPrice: "$4.99",
  productType: "Digital Download",
};
