# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: idea-generator.spec.ts >> Idea Generator — generate ideas >> results heading shows selected niche and product type
- Location: tests/e2e/idea-generator.spec.ts:108:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h2').filter({ hasText: '10 ideas' })
Expected substring: "Fitness"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h2').filter({ hasText: '10 ideas' })

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
        - generic [ref=e10]:
          - generic [ref=e11]: 2 free sprints left today
          - button "Go Pro →" [ref=e12] [cursor=pointer]
    - main [ref=e13]:
      - generic [ref=e14]:
        - button "⚡ Sprint Starter" [ref=e15] [cursor=pointer]
        - button "🗓 30-Day Sprint Plan 🔒" [ref=e16] [cursor=pointer]:
          - text: 🗓 30-Day Sprint Plan
          - generic [ref=e17]: 🔒
      - generic [ref=e18]:
        - generic [ref=e19]:
          - heading "Start Your Product Sprint" [level=2] [ref=e20]
          - paragraph [ref=e21]: Get 10 income-ready ideas with market scores, competition analysis, creation guides, and listing content — ready to launch.
          - generic [ref=e22]:
            - generic [ref=e23]: Platform
            - generic [ref=e24]:
              - button "🏷️ Etsy SEO titles + tags" [ref=e25] [cursor=pointer]:
                - generic [ref=e26]: 🏷️
                - generic [ref=e27]: Etsy
                - generic [ref=e28]: SEO titles + tags
              - button "🛒 Gumroad Sales copy" [ref=e29] [cursor=pointer]:
                - generic [ref=e30]: 🛒
                - generic [ref=e31]: Gumroad
                - generic [ref=e32]: Sales copy
              - button "🏪 Shopify Product pages" [ref=e33] [cursor=pointer]:
                - generic [ref=e34]: 🏪
                - generic [ref=e35]: Shopify
                - generic [ref=e36]: Product pages
          - generic [ref=e37]:
            - generic [ref=e38]:
              - generic [ref=e39]: Niche
              - combobox [ref=e40]:
                - option "Kids"
                - option "Wedding"
                - option "Productivity"
                - option "Fitness" [selected]
                - option "Budgeting"
                - option "Teachers"
                - option "Seasonal – Summer"
                - option "Seasonal – Christmas"
                - option "Seasonal – Halloween"
                - option "Self Care"
                - option "Small Business"
                - option "Travel"
              - generic [ref=e41]:
                - generic [ref=e42]: 🔥 Medium demand
                - generic [ref=e43]: 💵 $3.99–$7.99
            - generic [ref=e44]:
              - generic [ref=e45]: Product Type
              - combobox [ref=e46]:
                - option "Planner"
                - option "Coloring Book"
                - option "Journal"
                - option "Checklist"
                - option "Tracker" [selected]
                - option "Workbook"
                - option "Template"
                - option "Sticker Sheet"
                - option "Wall Art Printable"
                - option "Activity Book"
              - paragraph [ref=e47]: "Trending: Workout Planner, Macro Tracker"
          - generic [ref=e48]:
            - button "⚡ Start Product Sprint" [ref=e49] [cursor=pointer]
            - generic [ref=e50]: 2 free sprints remaining today
        - generic [ref=e51]:
          - generic [ref=e52]:
            - generic [ref=e53]:
              - heading "10 sprint ideas · Fitness · Tracker" [level=2] [ref=e54]
              - paragraph [ref=e55]: Market scores auto-loading · Click 🛠 for your creation blueprint
            - button "↺ Regenerate" [ref=e56] [cursor=pointer]
          - generic [ref=e57]:
            - generic [ref=e58]:
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - generic [ref=e61]: "1"
                  - generic [ref=e62]:
                    - heading "Kids Summer Activity Book (Ages 6–10)" [level=3] [ref=e63]
                    - paragraph [ref=e64]: A printable summer workbook packed with puzzles, coloring, and learning activities for kids.
                - button "🤍" [ref=e65] [cursor=pointer]
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - paragraph [ref=e68]: Market Analysis
                  - button "Should I make this? →" [ref=e69] [cursor=pointer]
                - generic [ref=e70]:
                  - generic [ref=e71]: 🔥 Medium Demand
                  - generic [ref=e72]: ⚠️ Medium Competition
                  - generic [ref=e73]: 💰 High Potential
                - generic [ref=e74]:
                  - generic [ref=e75]:
                    - text: 👥
                    - generic [ref=e76]: Fitness Beginners & Gym-goers
                  - generic [ref=e77]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e78] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e79]: Upgrade to unlock
              - generic [ref=e80]:
                - button "🔒 SEO" [ref=e81] [cursor=pointer]
                - button "🔒 Tags" [ref=e82] [cursor=pointer]
                - button "👀 Examples" [ref=e83] [cursor=pointer]
            - generic [ref=e84]:
              - generic [ref=e85]:
                - generic [ref=e86]:
                  - generic [ref=e87]: "2"
                  - generic [ref=e88]:
                    - heading "Kids Coloring Book – Ocean Adventure" [level=3] [ref=e89]
                    - paragraph [ref=e90]: Fun ocean-themed coloring pages featuring sea animals and underwater scenes.
                - button "🤍" [ref=e91] [cursor=pointer]
              - generic [ref=e92]:
                - generic [ref=e93]:
                  - paragraph [ref=e94]: Market Analysis
                  - button "Should I make this? →" [ref=e95] [cursor=pointer]
                - generic [ref=e96]:
                  - generic [ref=e97]: 🔥 Medium Demand
                  - generic [ref=e98]: ⚠️ Medium Competition
                  - generic [ref=e99]: 💰 High Potential
                - generic [ref=e100]:
                  - generic [ref=e101]:
                    - text: 👥
                    - generic [ref=e102]: Fitness Beginners & Gym-goers
                  - generic [ref=e103]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e104] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e105]: Upgrade to unlock
              - generic [ref=e106]:
                - button "🔒 SEO" [ref=e107] [cursor=pointer]
                - button "🔒 Tags" [ref=e108] [cursor=pointer]
                - button "👀 Examples" [ref=e109] [cursor=pointer]
            - generic [ref=e110]:
              - generic [ref=e111]:
                - generic [ref=e112]:
                  - generic [ref=e113]: "3"
                  - generic [ref=e114]:
                    - heading "Kids Alphabet Tracing Workbook" [level=3] [ref=e115]
                    - paragraph [ref=e116]: Printable A-Z tracing sheets to help young learners practice handwriting.
                - button "🤍" [ref=e117] [cursor=pointer]
              - generic [ref=e118]:
                - generic [ref=e119]:
                  - paragraph [ref=e120]: Market Analysis
                  - button "Should I make this? →" [ref=e121] [cursor=pointer]
                - generic [ref=e122]:
                  - generic [ref=e123]: 🔥 Medium Demand
                  - generic [ref=e124]: ⚠️ Medium Competition
                  - generic [ref=e125]: 💰 High Potential
                - generic [ref=e126]:
                  - generic [ref=e127]:
                    - text: 👥
                    - generic [ref=e128]: Fitness Beginners & Gym-goers
                  - generic [ref=e129]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e130] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e131]: Upgrade to unlock
              - generic [ref=e132]:
                - button "🔒 SEO" [ref=e133] [cursor=pointer]
                - button "🔒 Tags" [ref=e134] [cursor=pointer]
                - button "👀 Examples" [ref=e135] [cursor=pointer]
            - generic [ref=e136]:
              - generic [ref=e137]:
                - generic [ref=e138]:
                  - generic [ref=e139]: "4"
                  - generic [ref=e140]:
                    - heading "Kids Emotions & Feelings Journal" [level=3] [ref=e141]
                    - paragraph [ref=e142]: A guided journal to help children identify and express their emotions.
                - button "🤍" [ref=e143] [cursor=pointer]
              - generic [ref=e144]:
                - generic [ref=e145]:
                  - paragraph [ref=e146]: Market Analysis
                  - button "Should I make this? →" [ref=e147] [cursor=pointer]
                - generic [ref=e148]:
                  - generic [ref=e149]: 🔥 Medium Demand
                  - generic [ref=e150]: ⚠️ Medium Competition
                  - generic [ref=e151]: 💰 High Potential
                - generic [ref=e152]:
                  - generic [ref=e153]:
                    - text: 👥
                    - generic [ref=e154]: Fitness Beginners & Gym-goers
                  - generic [ref=e155]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e156] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e157]: Upgrade to unlock
              - generic [ref=e158]:
                - button "🔒 SEO" [ref=e159] [cursor=pointer]
                - button "🔒 Tags" [ref=e160] [cursor=pointer]
                - button "👀 Examples" [ref=e161] [cursor=pointer]
            - generic [ref=e162]:
              - generic [ref=e163]:
                - generic [ref=e164]:
                  - generic [ref=e165]: "5"
                  - generic [ref=e166]:
                    - heading "Kids Math Practice Sheets (Grades 1–3)" [level=3] [ref=e167]
                    - paragraph [ref=e168]: Daily math drills covering addition, subtraction, and number recognition.
                - button "🤍" [ref=e169] [cursor=pointer]
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - paragraph [ref=e172]: Market Analysis
                  - button "Should I make this? →" [ref=e173] [cursor=pointer]
                - generic [ref=e174]:
                  - generic [ref=e175]: 🔥 Medium Demand
                  - generic [ref=e176]: ⚠️ Medium Competition
                  - generic [ref=e177]: 💰 High Potential
                - generic [ref=e178]:
                  - generic [ref=e179]:
                    - text: 👥
                    - generic [ref=e180]: Fitness Beginners & Gym-goers
                  - generic [ref=e181]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e182] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e183]: Upgrade to unlock
              - generic [ref=e184]:
                - button "🔒 SEO" [ref=e185] [cursor=pointer]
                - button "🔒 Tags" [ref=e186] [cursor=pointer]
                - button "👀 Examples" [ref=e187] [cursor=pointer]
            - generic [ref=e188]:
              - generic [ref=e189]:
                - generic [ref=e190]:
                  - generic [ref=e191]: "6"
                  - generic [ref=e192]:
                    - heading "Kids Reading Comprehension Pack" [level=3] [ref=e193]
                    - paragraph [ref=e194]: Short stories with comprehension questions designed for early readers.
                - button "🤍" [ref=e195] [cursor=pointer]
              - generic [ref=e196]:
                - generic [ref=e197]:
                  - paragraph [ref=e198]: Market Analysis
                  - button "Should I make this? →" [ref=e199] [cursor=pointer]
                - generic [ref=e200]:
                  - generic [ref=e201]: 🔥 Medium Demand
                  - generic [ref=e202]: ⚠️ Medium Competition
                  - generic [ref=e203]: 💰 High Potential
                - generic [ref=e204]:
                  - generic [ref=e205]:
                    - text: 👥
                    - generic [ref=e206]: Fitness Beginners & Gym-goers
                  - generic [ref=e207]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e208] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e209]: Upgrade to unlock
              - generic [ref=e210]:
                - button "🔒 SEO" [ref=e211] [cursor=pointer]
                - button "🔒 Tags" [ref=e212] [cursor=pointer]
                - button "👀 Examples" [ref=e213] [cursor=pointer]
            - generic [ref=e214]:
              - generic [ref=e215]:
                - generic [ref=e216]:
                  - generic [ref=e217]: "7"
                  - generic [ref=e218]:
                    - heading "Kids Behavior Reward Chart" [level=3] [ref=e219]
                    - paragraph [ref=e220]: Printable weekly reward chart to encourage positive behavior at home or school.
                - button "🤍" [ref=e221] [cursor=pointer]
              - generic [ref=e222]:
                - generic [ref=e223]:
                  - paragraph [ref=e224]: Market Analysis
                  - button "Should I make this? →" [ref=e225] [cursor=pointer]
                - generic [ref=e226]:
                  - generic [ref=e227]: 🔥 Medium Demand
                  - generic [ref=e228]: ⚠️ Medium Competition
                  - generic [ref=e229]: 💰 High Potential
                - generic [ref=e230]:
                  - generic [ref=e231]:
                    - text: 👥
                    - generic [ref=e232]: Fitness Beginners & Gym-goers
                  - generic [ref=e233]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e234] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e235]: Upgrade to unlock
              - generic [ref=e236]:
                - button "🔒 SEO" [ref=e237] [cursor=pointer]
                - button "🔒 Tags" [ref=e238] [cursor=pointer]
                - button "👀 Examples" [ref=e239] [cursor=pointer]
            - generic [ref=e240]:
              - generic [ref=e241]:
                - generic [ref=e242]:
                  - generic [ref=e243]: "8"
                  - generic [ref=e244]:
                    - heading "Kids Science Experiment Workbook" [level=3] [ref=e245]
                    - paragraph [ref=e246]: Simple at-home science experiments with step-by-step worksheets.
                - button "🤍" [ref=e247] [cursor=pointer]
              - generic [ref=e248]:
                - generic [ref=e249]:
                  - paragraph [ref=e250]: Market Analysis
                  - button "Should I make this? →" [ref=e251] [cursor=pointer]
                - generic [ref=e252]:
                  - generic [ref=e253]: 🔥 Medium Demand
                  - generic [ref=e254]: ⚠️ Medium Competition
                  - generic [ref=e255]: 💰 High Potential
                - generic [ref=e256]:
                  - generic [ref=e257]:
                    - text: 👥
                    - generic [ref=e258]: Fitness Beginners & Gym-goers
                  - generic [ref=e259]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e260] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e261]: Upgrade to unlock
              - generic [ref=e262]:
                - button "🔒 SEO" [ref=e263] [cursor=pointer]
                - button "🔒 Tags" [ref=e264] [cursor=pointer]
                - button "👀 Examples" [ref=e265] [cursor=pointer]
            - generic [ref=e266]:
              - generic [ref=e267]:
                - generic [ref=e268]:
                  - generic [ref=e269]: "9"
                  - generic [ref=e270]:
                    - heading "Kids Mindfulness Activity Book" [level=3] [ref=e271]
                    - paragraph [ref=e272]: Breathing exercises, gratitude prompts, and calm-down coloring pages for children.
                - button "🤍" [ref=e273] [cursor=pointer]
              - generic [ref=e274]:
                - generic [ref=e275]:
                  - paragraph [ref=e276]: Market Analysis
                  - button "Should I make this? →" [ref=e277] [cursor=pointer]
                - generic [ref=e278]:
                  - generic [ref=e279]: 🔥 Medium Demand
                  - generic [ref=e280]: ⚠️ Medium Competition
                  - generic [ref=e281]: 💰 High Potential
                - generic [ref=e282]:
                  - generic [ref=e283]:
                    - text: 👥
                    - generic [ref=e284]: Fitness Beginners & Gym-goers
                  - generic [ref=e285]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e286] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e287]: Upgrade to unlock
              - generic [ref=e288]:
                - button "🔒 SEO" [ref=e289] [cursor=pointer]
                - button "🔒 Tags" [ref=e290] [cursor=pointer]
                - button "👀 Examples" [ref=e291] [cursor=pointer]
            - generic [ref=e292]:
              - generic [ref=e293]:
                - generic [ref=e294]:
                  - generic [ref=e295]: "10"
                  - generic [ref=e296]:
                    - heading "Kids Goal-Setting Planner" [level=3] [ref=e297]
                    - paragraph [ref=e298]: A fun printable planner to help kids set weekly goals and celebrate wins.
                - button "🤍" [ref=e299] [cursor=pointer]
              - generic [ref=e300]:
                - generic [ref=e301]:
                  - paragraph [ref=e302]: Market Analysis
                  - button "Should I make this? →" [ref=e303] [cursor=pointer]
                - generic [ref=e304]:
                  - generic [ref=e305]: 🔥 Medium Demand
                  - generic [ref=e306]: ⚠️ Medium Competition
                  - generic [ref=e307]: 💰 High Potential
                - generic [ref=e308]:
                  - generic [ref=e309]:
                    - text: 👥
                    - generic [ref=e310]: Fitness Beginners & Gym-goers
                  - generic [ref=e311]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e312] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e313]: Upgrade to unlock
              - generic [ref=e314]:
                - button "🔒 SEO" [ref=e315] [cursor=pointer]
                - button "🔒 Tags" [ref=e316] [cursor=pointer]
                - button "👀 Examples" [ref=e317] [cursor=pointer]
    - contentinfo [ref=e318]: ProductSprint · Built for digital sellers · Powered by AI
  - alert [ref=e319]
```

# Test source

```ts
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
  49  |   await expect(page.getByTestId("upgrade-button")).toContainText("Premium");
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
> 113 |     await expect(heading).toContainText("Fitness");
      |                           ^ Error: expect(locator).toContainText(expected) failed
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
  150 | 
  151 | test.describe("Tags button", () => {
  152 |   test.beforeEach(async ({ page }) => {
  153 |     await mockAllApis(page);
  154 |     await page.goto("/");
  155 |     await unlockPremium(page);
  156 |     await mockAllApis(page);
  157 |     await generateIdeas(page);
  158 |   });
  159 | 
  160 |   test("clicking Tags button shows tag results", async ({ page }) => {
  161 |     const firstCard = page.getByTestId("idea-card").first();
  162 |     await firstCard.getByTestId("tags-button").click();
  163 |     await expect(firstCard.getByTestId("tags-results")).toBeVisible({ timeout: 8_000 });
  164 |   });
  165 | 
  166 |   test("Tags results show 13 tags", async ({ page }) => {
  167 |     const firstCard = page.getByTestId("idea-card").first();
  168 |     await firstCard.getByTestId("tags-button").click();
  169 |     const tagsResults = firstCard.getByTestId("tags-results");
  170 |     await expect(tagsResults).toBeVisible({ timeout: 8_000 });
  171 |     // 13 tag pills
  172 |     await expect(tagsResults.locator(".rounded-full").filter({ hasText: /^[a-z]/ })).toHaveCount(13);
  173 |   });
  174 | 
  175 |   test("clicking Tags button again hides the results (toggle)", async ({ page }) => {
  176 |     const firstCard = page.getByTestId("idea-card").first();
  177 |     await firstCard.getByTestId("tags-button").click();
  178 |     await expect(firstCard.getByTestId("tags-results")).toBeVisible({ timeout: 8_000 });
  179 |     await firstCard.getByTestId("tags-button").click();
  180 |     await expect(firstCard.getByTestId("tags-results")).toBeHidden();
  181 |   });
  182 | });
  183 | 
  184 | test.describe("Examples button", () => {
  185 |   test.beforeEach(async ({ page }) => {
  186 |     await mockAllApis(page);
  187 |     await page.goto("/");
  188 |     await generateIdeas(page);
  189 |   });
  190 | 
  191 |   test("clicking Examples button shows example results", async ({ page }) => {
  192 |     const firstCard = page.getByTestId("idea-card").first();
  193 |     await firstCard.getByTestId("examples-button").click();
  194 |     await expect(firstCard.getByTestId("examples-results")).toBeVisible({ timeout: 8_000 });
  195 |   });
  196 | 
  197 |   test("examples results show price range", async ({ page }) => {
  198 |     const firstCard = page.getByTestId("idea-card").first();
  199 |     await firstCard.getByTestId("examples-button").click();
  200 |     const examplesResult = firstCard.getByTestId("examples-results");
  201 |     await expect(examplesResult).toBeVisible({ timeout: 8_000 });
  202 |     await expect(examplesResult).toContainText("$4.99");
  203 |   });
  204 | 
  205 |   test("examples results show seller tip", async ({ page }) => {
  206 |     const firstCard = page.getByTestId("idea-card").first();
  207 |     await firstCard.getByTestId("examples-button").click();
  208 |     const examplesResult = firstCard.getByTestId("examples-results");
  209 |     await expect(examplesResult).toBeVisible({ timeout: 8_000 });
  210 |     await expect(examplesResult).toContainText("Bundle");
  211 |   });
  212 | 
  213 |   test("clicking Examples button again hides the results (toggle)", async ({ page }) => {
```