# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: idea-generator.spec.ts >> Tags button >> clicking Tags button again hides the results (toggle)
- Location: tests/e2e/idea-generator.spec.ts:175:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('upgrade-button')
Expected substring: "Premium"
Received string:    "⚡ Sprint Pro"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByTestId('upgrade-button')
    9 × locator resolved to <button data-testid="upgrade-button" class="text-xs font-semibold px-3 py-1.5 rounded-full transition-all bg-purple-100 text-purple-700">⚡ Sprint Pro</button>
      - unexpected value "⚡ Sprint Pro"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]: PS
          - generic [ref=e7]:
            - heading "ProductSprint" [level=1] [ref=e8]
            - paragraph [ref=e9]: Find → Build → Launch → Earn
        - button "⚡ Sprint Pro" [ref=e11] [cursor=pointer]
    - main [ref=e12]:
      - generic [ref=e13]:
        - button "⚡ Sprint Starter" [ref=e14] [cursor=pointer]
        - button "🗓 30-Day Sprint Plan" [ref=e15] [cursor=pointer]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - heading "Start Your Product Sprint" [level=2] [ref=e18]
          - paragraph [ref=e19]: Get 10 income-ready ideas with market scores, competition analysis, creation guides, and listing content — ready to launch.
          - generic [ref=e20]:
            - generic [ref=e21]: Platform
            - generic [ref=e22]:
              - button "🏷️ Etsy" [ref=e23] [cursor=pointer]:
                - generic [ref=e24]: 🏷️
                - generic [ref=e25]: Etsy
              - button "🛒 Gumroad" [ref=e26] [cursor=pointer]:
                - generic [ref=e27]: 🛒
                - generic [ref=e28]: Gumroad
              - button "🏪 Shopify" [ref=e29] [cursor=pointer]:
                - generic [ref=e30]: 🏪
                - generic [ref=e31]: Shopify
          - generic [ref=e32]:
            - generic [ref=e33]:
              - generic [ref=e34]: Niche
              - combobox [ref=e35]:
                - option "Kids" [selected]
                - option "Wedding"
                - option "Productivity"
                - option "Fitness"
                - option "Budgeting"
                - option "Teachers"
                - option "Seasonal – Summer"
                - option "Seasonal – Christmas"
                - option "Seasonal – Halloween"
                - option "Self Care"
                - option "Small Business"
                - option "Travel"
              - generic [ref=e36]:
                - generic [ref=e37]: 🔥 High demand
                - generic [ref=e38]: 💵 $3.99–$8.99
            - generic [ref=e39]:
              - generic [ref=e40]: Product Type
              - combobox [ref=e41]:
                - option "Planner" [selected]
                - option "Coloring Book"
                - option "Journal"
                - option "Checklist"
                - option "Tracker"
                - option "Workbook"
                - option "Template"
                - option "Sticker Sheet"
                - option "Wall Art Printable"
                - option "Activity Book"
              - paragraph [ref=e42]: "Trending: Activity Books, Coloring Pages"
          - button "⚡ Start Product Sprint" [ref=e44] [cursor=pointer]
        - generic [ref=e45]:
          - generic [ref=e46]: 💡
          - generic [ref=e47]:
            - strong [ref=e48]: "Sprint tip:"
            - text: Seasonal variations (back-to-school, summer) sell especially well.
        - generic [ref=e49]:
          - generic [ref=e50]: ⚡
          - paragraph [ref=e51]: Ready to launch your next digital product?
          - paragraph [ref=e52]: Pick a niche and product type, then hit Sprint to get 10 income-ready ideas.
          - generic [ref=e53]:
            - paragraph [ref=e54]: Kids — Top sprint opportunities
            - generic [ref=e55]:
              - generic [ref=e56]: Activity Books
              - generic [ref=e57]: Coloring Pages
              - generic [ref=e58]: Learning Worksheets
              - generic [ref=e59]: Reward Charts
    - contentinfo [ref=e60]: ProductSprint · Built for digital sellers · Powered by AI
  - alert [ref=e61]
```

# Test source

```ts
  1   | // Scenario 2: User can generate product ideas
  2   | // Scenario 3: SEO button works
  3   | // Scenario 4: Tags button works
  4   | // Scenario 5: Examples button works
  5   | // Scenario 6: Create This Product works
  6   | import { test, expect } from "@playwright/test";
  7   | import {
  8   |   MOCK_IDEAS,
  9   |   MOCK_SEO_TITLES,
  10  |   MOCK_TAGS,
  11  |   MOCK_EXAMPLES,
  12  |   MOCK_ANALYSIS,
  13  |   MOCK_PRODUCT,
  14  | } from "./fixtures/mockData";
  15  | 
  16  | // Helper: mock all required API endpoints
  17  | async function mockAllApis(page: import("@playwright/test").Page) {
  18  |   await page.route("/api/generate-ideas", (route) =>
  19  |     route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_IDEAS) })
  20  |   );
  21  |   await page.route("/api/analyze-idea", (route) =>
  22  |     route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_ANALYSIS) })
  23  |   );
  24  |   await page.route("/api/generate-seo", (route) =>
  25  |     route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SEO_TITLES) })
  26  |   );
  27  |   await page.route("/api/generate-tags", (route) =>
  28  |     route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_TAGS) })
  29  |   );
  30  |   await page.route("/api/examples", (route) =>
  31  |     route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EXAMPLES) })
  32  |   );
  33  |   await page.route("/api/create-product", (route) =>
  34  |     route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCT) })
  35  |   );
  36  | }
  37  | 
  38  | // Helper: generate ideas and wait for cards to appear
  39  | async function generateIdeas(page: import("@playwright/test").Page) {
  40  |   await page.getByTestId("generate-button").click();
  41  |   await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 10_000 });
  42  |   await expect(page.getByTestId("idea-card").first()).toBeVisible();
  43  | }
  44  | 
  45  | // Helper: unlock premium via localStorage
  46  | async function unlockPremium(page: import("@playwright/test").Page) {
  47  |   await page.evaluate(() => localStorage.setItem("etsy_premium", "true"));
  48  |   await page.reload();
> 49  |   await expect(page.getByTestId("upgrade-button")).toContainText("Premium");
      |                                                    ^ Error: expect(locator).toContainText(expected) failed
  50  | }
  51  | 
  52  | test.describe("Idea Generator — generate ideas", () => {
  53  |   test.beforeEach(async ({ page }) => {
  54  |     await mockAllApis(page);
  55  |     await page.goto("/");
  56  |   });
  57  | 
  58  |   test("clicking Generate button shows skeleton loading state", async ({ page }) => {
  59  |     // Override with a slow mock so we can catch the skeleton
  60  |     await page.route("/api/generate-ideas", (route) => {
  61  |       return new Promise((resolve) => {
  62  |         setTimeout(() => resolve(
  63  |           route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_IDEAS) })
  64  |         ), 600);
  65  |       });
  66  |     });
  67  | 
  68  |     await page.getByTestId("generate-button").click();
  69  |     await expect(page.getByTestId("skeleton-loading")).toBeVisible();
  70  |     // Wait for ideas to load
  71  |     await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 5_000 });
  72  |   });
  73  | 
  74  |   test("ideas grid renders 10 idea cards after generation", async ({ page }) => {
  75  |     await generateIdeas(page);
  76  |     const cards = page.getByTestId("idea-card");
  77  |     await expect(cards).toHaveCount(10);
  78  |   });
  79  | 
  80  |   test("each idea card shows a title and description", async ({ page }) => {
  81  |     await generateIdeas(page);
  82  |     const firstCard = page.getByTestId("idea-card").first();
  83  |     await expect(firstCard).toContainText("Kids Summer Activity Book");
  84  |   });
  85  | 
  86  |   test("each card has SEO, Tags, and Examples buttons", async ({ page }) => {
  87  |     await generateIdeas(page);
  88  |     const firstCard = page.getByTestId("idea-card").first();
  89  |     await expect(firstCard.getByTestId("seo-button")).toBeVisible();
  90  |     await expect(firstCard.getByTestId("tags-button")).toBeVisible();
  91  |     await expect(firstCard.getByTestId("examples-button")).toBeVisible();
  92  |   });
  93  | 
  94  |   test("can change niche to Wedding and generate ideas", async ({ page }) => {
  95  |     await page.getByTestId("niche-select").selectOption("Wedding");
  96  |     await expect(page.getByTestId("niche-select")).toHaveValue("Wedding");
  97  |     await generateIdeas(page);
  98  |     await expect(page.getByTestId("ideas-grid")).toBeVisible();
  99  |   });
  100 | 
  101 |   test("can change product type to Journal and generate ideas", async ({ page }) => {
  102 |     await page.getByTestId("product-type-select").selectOption("Journal");
  103 |     await expect(page.getByTestId("product-type-select")).toHaveValue("Journal");
  104 |     await generateIdeas(page);
  105 |     await expect(page.getByTestId("ideas-grid")).toBeVisible();
  106 |   });
  107 | 
  108 |   test("results heading shows selected niche and product type", async ({ page }) => {
  109 |     await page.getByTestId("niche-select").selectOption("Fitness");
  110 |     await page.getByTestId("product-type-select").selectOption("Tracker");
  111 |     await generateIdeas(page);
  112 |     const heading = page.locator("h2").filter({ hasText: "10 ideas" });
  113 |     await expect(heading).toContainText("Fitness");
  114 |     await expect(heading).toContainText("Tracker");
  115 |   });
  116 | });
  117 | 
  118 | test.describe("SEO button", () => {
  119 |   test.beforeEach(async ({ page }) => {
  120 |     await mockAllApis(page);
  121 |     await page.goto("/");
  122 |     await unlockPremium(page);
  123 |     await mockAllApis(page);
  124 |     await generateIdeas(page);
  125 |   });
  126 | 
  127 |   test("clicking SEO button shows SEO results", async ({ page }) => {
  128 |     const firstCard = page.getByTestId("idea-card").first();
  129 |     await firstCard.getByTestId("seo-button").click();
  130 |     await expect(firstCard.getByTestId("seo-results")).toBeVisible({ timeout: 8_000 });
  131 |   });
  132 | 
  133 |   test("SEO results contain 3 titles", async ({ page }) => {
  134 |     const firstCard = page.getByTestId("idea-card").first();
  135 |     await firstCard.getByTestId("seo-button").click();
  136 |     const seoResults = firstCard.getByTestId("seo-results");
  137 |     await expect(seoResults).toBeVisible({ timeout: 8_000 });
  138 |     // Three SEO title items rendered
  139 |     await expect(seoResults.locator(".bg-purple-50")).toHaveCount(3);
  140 |   });
  141 | 
  142 |   test("clicking SEO button again hides the results (toggle)", async ({ page }) => {
  143 |     const firstCard = page.getByTestId("idea-card").first();
  144 |     await firstCard.getByTestId("seo-button").click();
  145 |     await expect(firstCard.getByTestId("seo-results")).toBeVisible({ timeout: 8_000 });
  146 |     await firstCard.getByTestId("seo-button").click();
  147 |     await expect(firstCard.getByTestId("seo-results")).toBeHidden();
  148 |   });
  149 | });
```