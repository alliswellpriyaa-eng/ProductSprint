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
        - button "Go Pro →" [ref=e11] [cursor=pointer]
    - main [ref=e12]:
      - generic [ref=e13]:
        - button "⚡ Sprint Starter" [ref=e14] [cursor=pointer]
        - button "🗓 30-Day Sprint Plan 🔒" [ref=e15] [cursor=pointer]:
          - text: 🗓 30-Day Sprint Plan
          - generic [ref=e16]: 🔒
      - generic [ref=e17]:
        - generic [ref=e18]:
          - heading "Start Your Product Sprint" [level=2] [ref=e19]
          - paragraph [ref=e20]: Get 10 income-ready ideas with market scores, competition analysis, creation guides, and listing content — ready to launch.
          - generic [ref=e21]:
            - generic [ref=e22]: Platform
            - generic [ref=e23]:
              - button "🏷️ Etsy" [ref=e24] [cursor=pointer]:
                - generic [ref=e25]: 🏷️
                - generic [ref=e26]: Etsy
              - button "🛒 Gumroad" [ref=e27] [cursor=pointer]:
                - generic [ref=e28]: 🛒
                - generic [ref=e29]: Gumroad
              - button "🏪 Shopify" [ref=e30] [cursor=pointer]:
                - generic [ref=e31]: 🏪
                - generic [ref=e32]: Shopify
          - generic [ref=e33]:
            - generic [ref=e34]:
              - generic [ref=e35]: Niche
              - combobox [ref=e36]:
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
              - generic [ref=e37]:
                - generic [ref=e38]: 🔥 Medium demand
                - generic [ref=e39]: 💵 $3.99–$7.99
            - generic [ref=e40]:
              - generic [ref=e41]: Product Type
              - combobox [ref=e42]:
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
              - paragraph [ref=e43]: "Trending: Workout Planner, Macro Tracker"
          - generic [ref=e44]:
            - button "⚡ Start Product Sprint" [ref=e45] [cursor=pointer]
            - generic [ref=e46]: 2 free sprints remaining today
        - generic [ref=e47]:
          - generic [ref=e48]:
            - generic [ref=e49]:
              - heading "10 sprint ideas · Fitness · Tracker" [level=2] [ref=e50]
              - paragraph [ref=e51]: Market scores auto-loading · Click 🛠 for your creation blueprint
            - button "↺ Regenerate" [ref=e52] [cursor=pointer]
          - generic [ref=e53]:
            - generic [ref=e54]:
              - generic [ref=e55]:
                - generic [ref=e56]:
                  - generic [ref=e57]: "1"
                  - generic [ref=e58]:
                    - heading "Kids Summer Activity Book (Ages 6–10)" [level=3] [ref=e59]
                    - paragraph [ref=e60]: A printable summer workbook packed with puzzles, coloring, and learning activities for kids.
                - button "🤍" [ref=e61] [cursor=pointer]
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - paragraph [ref=e64]: Market Analysis
                  - button "Should I make this? →" [ref=e65] [cursor=pointer]
                - generic [ref=e66]:
                  - generic [ref=e67]: 🔥 Medium Demand
                  - generic [ref=e68]: ⚠️ Medium Competition
                  - generic [ref=e69]: 💰 High Potential
                - generic [ref=e70]:
                  - generic [ref=e71]:
                    - text: 👥
                    - generic [ref=e72]: Fitness Beginners & Gym-goers
                  - generic [ref=e73]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e74] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e75]: Upgrade to unlock
              - generic [ref=e76]:
                - button "🔒 SEO" [ref=e77] [cursor=pointer]
                - button "🔒 Tags" [ref=e78] [cursor=pointer]
                - button "👀 Examples" [ref=e79] [cursor=pointer]
            - generic [ref=e80]:
              - generic [ref=e81]:
                - generic [ref=e82]:
                  - generic [ref=e83]: "2"
                  - generic [ref=e84]:
                    - heading "Kids Coloring Book – Ocean Adventure" [level=3] [ref=e85]
                    - paragraph [ref=e86]: Fun ocean-themed coloring pages featuring sea animals and underwater scenes.
                - button "🤍" [ref=e87] [cursor=pointer]
              - generic [ref=e88]:
                - generic [ref=e89]:
                  - paragraph [ref=e90]: Market Analysis
                  - button "Should I make this? →" [ref=e91] [cursor=pointer]
                - generic [ref=e92]:
                  - generic [ref=e93]: 🔥 Medium Demand
                  - generic [ref=e94]: ⚠️ Medium Competition
                  - generic [ref=e95]: 💰 High Potential
                - generic [ref=e96]:
                  - generic [ref=e97]:
                    - text: 👥
                    - generic [ref=e98]: Fitness Beginners & Gym-goers
                  - generic [ref=e99]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e100] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e101]: Upgrade to unlock
              - generic [ref=e102]:
                - button "🔒 SEO" [ref=e103] [cursor=pointer]
                - button "🔒 Tags" [ref=e104] [cursor=pointer]
                - button "👀 Examples" [ref=e105] [cursor=pointer]
            - generic [ref=e106]:
              - generic [ref=e107]:
                - generic [ref=e108]:
                  - generic [ref=e109]: "3"
                  - generic [ref=e110]:
                    - heading "Kids Alphabet Tracing Workbook" [level=3] [ref=e111]
                    - paragraph [ref=e112]: Printable A-Z tracing sheets to help young learners practice handwriting.
                - button "🤍" [ref=e113] [cursor=pointer]
              - generic [ref=e114]:
                - generic [ref=e115]:
                  - paragraph [ref=e116]: Market Analysis
                  - button "Should I make this? →" [ref=e117] [cursor=pointer]
                - generic [ref=e118]:
                  - generic [ref=e119]: 🔥 Medium Demand
                  - generic [ref=e120]: ⚠️ Medium Competition
                  - generic [ref=e121]: 💰 High Potential
                - generic [ref=e122]:
                  - generic [ref=e123]:
                    - text: 👥
                    - generic [ref=e124]: Fitness Beginners & Gym-goers
                  - generic [ref=e125]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e126] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e127]: Upgrade to unlock
              - generic [ref=e128]:
                - button "🔒 SEO" [ref=e129] [cursor=pointer]
                - button "🔒 Tags" [ref=e130] [cursor=pointer]
                - button "👀 Examples" [ref=e131] [cursor=pointer]
            - generic [ref=e132]:
              - generic [ref=e133]:
                - generic [ref=e134]:
                  - generic [ref=e135]: "4"
                  - generic [ref=e136]:
                    - heading "Kids Emotions & Feelings Journal" [level=3] [ref=e137]
                    - paragraph [ref=e138]: A guided journal to help children identify and express their emotions.
                - button "🤍" [ref=e139] [cursor=pointer]
              - generic [ref=e140]:
                - generic [ref=e141]:
                  - paragraph [ref=e142]: Market Analysis
                  - button "Should I make this? →" [ref=e143] [cursor=pointer]
                - generic [ref=e144]:
                  - generic [ref=e145]: 🔥 Medium Demand
                  - generic [ref=e146]: ⚠️ Medium Competition
                  - generic [ref=e147]: 💰 High Potential
                - generic [ref=e148]:
                  - generic [ref=e149]:
                    - text: 👥
                    - generic [ref=e150]: Fitness Beginners & Gym-goers
                  - generic [ref=e151]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e152] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e153]: Upgrade to unlock
              - generic [ref=e154]:
                - button "🔒 SEO" [ref=e155] [cursor=pointer]
                - button "🔒 Tags" [ref=e156] [cursor=pointer]
                - button "👀 Examples" [ref=e157] [cursor=pointer]
            - generic [ref=e158]:
              - generic [ref=e159]:
                - generic [ref=e160]:
                  - generic [ref=e161]: "5"
                  - generic [ref=e162]:
                    - heading "Kids Math Practice Sheets (Grades 1–3)" [level=3] [ref=e163]
                    - paragraph [ref=e164]: Daily math drills covering addition, subtraction, and number recognition.
                - button "🤍" [ref=e165] [cursor=pointer]
              - generic [ref=e166]:
                - generic [ref=e167]:
                  - paragraph [ref=e168]: Market Analysis
                  - button "Should I make this? →" [ref=e169] [cursor=pointer]
                - generic [ref=e170]:
                  - generic [ref=e171]: 🔥 Medium Demand
                  - generic [ref=e172]: ⚠️ Medium Competition
                  - generic [ref=e173]: 💰 High Potential
                - generic [ref=e174]:
                  - generic [ref=e175]:
                    - text: 👥
                    - generic [ref=e176]: Fitness Beginners & Gym-goers
                  - generic [ref=e177]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e178] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e179]: Upgrade to unlock
              - generic [ref=e180]:
                - button "🔒 SEO" [ref=e181] [cursor=pointer]
                - button "🔒 Tags" [ref=e182] [cursor=pointer]
                - button "👀 Examples" [ref=e183] [cursor=pointer]
            - generic [ref=e184]:
              - generic [ref=e185]:
                - generic [ref=e186]:
                  - generic [ref=e187]: "6"
                  - generic [ref=e188]:
                    - heading "Kids Reading Comprehension Pack" [level=3] [ref=e189]
                    - paragraph [ref=e190]: Short stories with comprehension questions designed for early readers.
                - button "🤍" [ref=e191] [cursor=pointer]
              - generic [ref=e192]:
                - generic [ref=e193]:
                  - paragraph [ref=e194]: Market Analysis
                  - button "Should I make this? →" [ref=e195] [cursor=pointer]
                - generic [ref=e196]:
                  - generic [ref=e197]: 🔥 Medium Demand
                  - generic [ref=e198]: ⚠️ Medium Competition
                  - generic [ref=e199]: 💰 High Potential
                - generic [ref=e200]:
                  - generic [ref=e201]:
                    - text: 👥
                    - generic [ref=e202]: Fitness Beginners & Gym-goers
                  - generic [ref=e203]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e204] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e205]: Upgrade to unlock
              - generic [ref=e206]:
                - button "🔒 SEO" [ref=e207] [cursor=pointer]
                - button "🔒 Tags" [ref=e208] [cursor=pointer]
                - button "👀 Examples" [ref=e209] [cursor=pointer]
            - generic [ref=e210]:
              - generic [ref=e211]:
                - generic [ref=e212]:
                  - generic [ref=e213]: "7"
                  - generic [ref=e214]:
                    - heading "Kids Behavior Reward Chart" [level=3] [ref=e215]
                    - paragraph [ref=e216]: Printable weekly reward chart to encourage positive behavior at home or school.
                - button "🤍" [ref=e217] [cursor=pointer]
              - generic [ref=e218]:
                - generic [ref=e219]:
                  - paragraph [ref=e220]: Market Analysis
                  - button "Should I make this? →" [ref=e221] [cursor=pointer]
                - generic [ref=e222]:
                  - generic [ref=e223]: 🔥 Medium Demand
                  - generic [ref=e224]: ⚠️ Medium Competition
                  - generic [ref=e225]: 💰 High Potential
                - generic [ref=e226]:
                  - generic [ref=e227]:
                    - text: 👥
                    - generic [ref=e228]: Fitness Beginners & Gym-goers
                  - generic [ref=e229]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e230] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e231]: Upgrade to unlock
              - generic [ref=e232]:
                - button "🔒 SEO" [ref=e233] [cursor=pointer]
                - button "🔒 Tags" [ref=e234] [cursor=pointer]
                - button "👀 Examples" [ref=e235] [cursor=pointer]
            - generic [ref=e236]:
              - generic [ref=e237]:
                - generic [ref=e238]:
                  - generic [ref=e239]: "8"
                  - generic [ref=e240]:
                    - heading "Kids Science Experiment Workbook" [level=3] [ref=e241]
                    - paragraph [ref=e242]: Simple at-home science experiments with step-by-step worksheets.
                - button "🤍" [ref=e243] [cursor=pointer]
              - generic [ref=e244]:
                - generic [ref=e245]:
                  - paragraph [ref=e246]: Market Analysis
                  - button "Should I make this? →" [ref=e247] [cursor=pointer]
                - generic [ref=e248]:
                  - generic [ref=e249]: 🔥 Medium Demand
                  - generic [ref=e250]: ⚠️ Medium Competition
                  - generic [ref=e251]: 💰 High Potential
                - generic [ref=e252]:
                  - generic [ref=e253]:
                    - text: 👥
                    - generic [ref=e254]: Fitness Beginners & Gym-goers
                  - generic [ref=e255]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e256] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e257]: Upgrade to unlock
              - generic [ref=e258]:
                - button "🔒 SEO" [ref=e259] [cursor=pointer]
                - button "🔒 Tags" [ref=e260] [cursor=pointer]
                - button "👀 Examples" [ref=e261] [cursor=pointer]
            - generic [ref=e262]:
              - generic [ref=e263]:
                - generic [ref=e264]:
                  - generic [ref=e265]: "9"
                  - generic [ref=e266]:
                    - heading "Kids Mindfulness Activity Book" [level=3] [ref=e267]
                    - paragraph [ref=e268]: Breathing exercises, gratitude prompts, and calm-down coloring pages for children.
                - button "🤍" [ref=e269] [cursor=pointer]
              - generic [ref=e270]:
                - generic [ref=e271]:
                  - paragraph [ref=e272]: Market Analysis
                  - button "Should I make this? →" [ref=e273] [cursor=pointer]
                - generic [ref=e274]:
                  - generic [ref=e275]: 🔥 Medium Demand
                  - generic [ref=e276]: ⚠️ Medium Competition
                  - generic [ref=e277]: 💰 High Potential
                - generic [ref=e278]:
                  - generic [ref=e279]:
                    - text: 👥
                    - generic [ref=e280]: Fitness Beginners & Gym-goers
                  - generic [ref=e281]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e282] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e283]: Upgrade to unlock
              - generic [ref=e284]:
                - button "🔒 SEO" [ref=e285] [cursor=pointer]
                - button "🔒 Tags" [ref=e286] [cursor=pointer]
                - button "👀 Examples" [ref=e287] [cursor=pointer]
            - generic [ref=e288]:
              - generic [ref=e289]:
                - generic [ref=e290]:
                  - generic [ref=e291]: "10"
                  - generic [ref=e292]:
                    - heading "Kids Goal-Setting Planner" [level=3] [ref=e293]
                    - paragraph [ref=e294]: A fun printable planner to help kids set weekly goals and celebrate wins.
                - button "🤍" [ref=e295] [cursor=pointer]
              - generic [ref=e296]:
                - generic [ref=e297]:
                  - paragraph [ref=e298]: Market Analysis
                  - button "Should I make this? →" [ref=e299] [cursor=pointer]
                - generic [ref=e300]:
                  - generic [ref=e301]: 🔥 Medium Demand
                  - generic [ref=e302]: ⚠️ Medium Competition
                  - generic [ref=e303]: 💰 High Potential
                - generic [ref=e304]:
                  - generic [ref=e305]:
                    - text: 👥
                    - generic [ref=e306]: Fitness Beginners & Gym-goers
                  - generic [ref=e307]: 🎯 Easy to make
              - button "🔒 Sprint This Product — Upgrade to unlock" [ref=e308] [cursor=pointer]:
                - text: 🔒 Sprint This Product —
                - generic [ref=e309]: Upgrade to unlock
              - generic [ref=e310]:
                - button "🔒 SEO" [ref=e311] [cursor=pointer]
                - button "🔒 Tags" [ref=e312] [cursor=pointer]
                - button "👀 Examples" [ref=e313] [cursor=pointer]
    - contentinfo [ref=e314]: ProductSprint · Built for digital sellers · Powered by AI
  - alert [ref=e315]
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