// Mock API responses for all 9 endpoints
// These match the exact shape returned by the real API routes.

export const MOCK_IDEAS = {
  ideas: [
    { title: "Kids Summer Activity Book (Ages 6–10)", description: "A printable summer workbook packed with puzzles, coloring, and learning activities for kids." },
    { title: "Kids Coloring Book – Ocean Adventure", description: "Fun ocean-themed coloring pages featuring sea animals and underwater scenes." },
    { title: "Kids Alphabet Tracing Workbook", description: "Printable A-Z tracing sheets to help young learners practice handwriting." },
    { title: "Kids Emotions & Feelings Journal", description: "A guided journal to help children identify and express their emotions." },
    { title: "Kids Math Practice Sheets (Grades 1–3)", description: "Daily math drills covering addition, subtraction, and number recognition." },
    { title: "Kids Reading Comprehension Pack", description: "Short stories with comprehension questions designed for early readers." },
    { title: "Kids Behavior Reward Chart", description: "Printable weekly reward chart to encourage positive behavior at home or school." },
    { title: "Kids Science Experiment Workbook", description: "Simple at-home science experiments with step-by-step worksheets." },
    { title: "Kids Mindfulness Activity Book", description: "Breathing exercises, gratitude prompts, and calm-down coloring pages for children." },
    { title: "Kids Goal-Setting Planner", description: "A fun printable planner to help kids set weekly goals and celebrate wins." },
  ],
};

export const MOCK_SEO_TITLES = {
  titles: [
    "Kids Summer Activity Book Printable | Fun Worksheets Ages 6–10 | Homeschool Workbook PDF",
    "Printable Kids Activity Book | Summer Learning Workbook | Educational Worksheets for Children",
    "Kids Printable Workbook | Summer Activity Pages | Digital Download for Homeschoolers Ages 6–10",
  ],
};

export const MOCK_TAGS = {
  tags: [
    "kids activity book",
    "summer worksheets",
    "homeschool printable",
    "kids workbook pdf",
    "printable for kids",
    "summer learning",
    "educational printable",
    "kids coloring pages",
    "activity pages",
    "digital download kids",
    "classroom printable",
    "kids planner",
    "learning worksheets",
  ],
};

export const MOCK_ANALYSIS = {
  demand: "High" as const,
  competition: "Medium" as const,
  potential: "High" as const,
  audience: "Parents & Teachers",
  difficulty: "Easy" as const,
};

export const MOCK_PLANNER_DAYS = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  phase: i < 5 ? ("Setup" as const) : i < 20 ? ("Build" as const) : ("Launch" as const),
  title: `Day ${i + 1} Product Idea`,
  goal: `Complete the day ${i + 1} goal`,
  tasks: ["Research keywords", "Design in Canva", "Export as PDF"],
  design: { size: "8.5x11", orientation: "Portrait", style: "Minimalist", tool: "Canva" },
  keywords: ["printable", "digital download"],
  pricing: "$7.99",
  time: "2–3 hours",
  effort: (i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Hard") as "Easy" | "Medium" | "Hard",
}));

export const MOCK_PRODUCT = {
  pages: [
    "Page 1: Cover Page with product title",
    "Page 2: Introduction and instructions",
    "Page 3: Main activity section",
    "Page 4: Practice exercises",
    "Page 5: Answer key or notes",
  ],
  size: "8.5x11 inches (US Letter)",
  orientation: "Portrait",
  style: "Clean & Minimalist",
  tips: [
    "Use bright, child-friendly colors to grab attention",
    "Keep fonts large and easy to read for kids",
    "Include a cover page with your brand logo",
    "Add a 'Thank You' page with a link to your Etsy shop",
  ],
};

export const MOCK_EXAMPLES = {
  titles: [
    '"Summer Activity Book for Kids – 50 Pages of Fun | Printable PDF"',
    '"Kids Printable Workbook Ages 6-10 | Summer Learning Bundle | Instant Download"',
  ],
  priceRange: "$4.99 – $9.99",
  includes: [
    "50+ activity pages",
    "Instant PDF download",
    "Compatible with home printer",
    "A4 and US Letter sizes included",
  ],
  sellerTip: "Bundle 3 activity books together and sell for $14.99 to boost your average order value.",
};

export const MOCK_GUMROAD = {
  platform: "gumroad",
  productName: "Kids Summer Activity Book",
  tagline: "Keep kids learning and having fun all summer long!",
  description: "A beautifully designed printable activity book perfect for keeping kids engaged during summer break. Packed with 50+ pages of puzzles, coloring, and learning activities.",
  salesBullets: [
    "50+ fun activity pages for kids aged 6–10",
    "Instant PDF download — print at home",
    "Perfect for homeschool, travel, or rainy days",
    "Designed in vibrant, kid-friendly colors",
  ],
  suggestedPrice: "$7.99",
  tags: ["kids", "printable", "activity book", "summer", "homeschool"],
};

export const MOCK_SHOPIFY = {
  platform: "shopify",
  productTitle: "Kids Summer Activity Book | Printable PDF | Ages 6-10",
  metaDescription: "Printable kids activity book for summer. 50+ pages of puzzles, coloring, and learning activities. Instant download. Perfect for homeschool.",
  description: "Keep your kids entertained and learning this summer with our beautifully designed activity book.",
  bulletPoints: [
    "50+ activity pages",
    "Instant digital download",
    "Print at home — US Letter & A4 sizes",
    "Great for ages 6–10",
  ],
  tags: ["kids", "printable", "activity", "summer", "education"],
  suggestedPrice: "$7.99",
  productType: "Digital Download",
};

export const MOCK_FALLBACK_IDEAS = {
  fallback: true,
  errorCode: "RATE_LIMIT",
  ideas: MOCK_IDEAS.ideas,
};

export const MOCK_FALLBACK_PLANNER = {
  fallback: true,
  errorCode: "RATE_LIMIT",
  days: MOCK_PLANNER_DAYS,
};
