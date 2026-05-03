// Scenario 2: User can generate product ideas
// Scenario 3: SEO button works
// Scenario 4: Tags button works
// Scenario 5: Examples button works
// Scenario 6: Create This Product works
import { test, expect } from "@playwright/test";
import {
  MOCK_IDEAS,
  MOCK_SEO_TITLES,
  MOCK_TAGS,
  MOCK_EXAMPLES,
  MOCK_ANALYSIS,
  MOCK_PRODUCT,
} from "./fixtures/mockData";

// Helper: mock all required API endpoints
async function mockAllApis(page: import("@playwright/test").Page) {
  await page.route("/api/generate-ideas", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_IDEAS) })
  );
  await page.route("/api/analyze-idea", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_ANALYSIS) })
  );
  await page.route("/api/generate-seo", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SEO_TITLES) })
  );
  await page.route("/api/generate-tags", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_TAGS) })
  );
  await page.route("/api/examples", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EXAMPLES) })
  );
  await page.route("/api/create-product", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCT) })
  );
}

// Helper: generate ideas and wait for cards to appear
async function generateIdeas(page: import("@playwright/test").Page) {
  await page.getByTestId("generate-button").click();
  await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("idea-card").first()).toBeVisible();
}

// Helper: unlock premium via localStorage
async function unlockPremium(page: import("@playwright/test").Page) {
  await page.evaluate(() => localStorage.setItem("etsy_premium", "true"));
  await page.reload();
  await expect(page.getByTestId("upgrade-button")).toContainText("Premium");
}

test.describe("Idea Generator — generate ideas", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto("/");
  });

  test("clicking Generate button shows skeleton loading state", async ({ page }) => {
    // Override with a slow mock so we can catch the skeleton
    await page.route("/api/generate-ideas", (route) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(
          route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_IDEAS) })
        ), 600);
      });
    });

    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("skeleton-loading")).toBeVisible();
    // Wait for ideas to load
    await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 5_000 });
  });

  test("ideas grid renders 10 idea cards after generation", async ({ page }) => {
    await generateIdeas(page);
    const cards = page.getByTestId("idea-card");
    await expect(cards).toHaveCount(10);
  });

  test("each idea card shows a title and description", async ({ page }) => {
    await generateIdeas(page);
    const firstCard = page.getByTestId("idea-card").first();
    await expect(firstCard).toContainText("Kids Summer Activity Book");
  });

  test("each card has SEO, Tags, and Examples buttons", async ({ page }) => {
    await generateIdeas(page);
    const firstCard = page.getByTestId("idea-card").first();
    await expect(firstCard.getByTestId("seo-button")).toBeVisible();
    await expect(firstCard.getByTestId("tags-button")).toBeVisible();
    await expect(firstCard.getByTestId("examples-button")).toBeVisible();
  });

  test("can change niche to Wedding and generate ideas", async ({ page }) => {
    await page.getByTestId("niche-select").selectOption("Wedding");
    await expect(page.getByTestId("niche-select")).toHaveValue("Wedding");
    await generateIdeas(page);
    await expect(page.getByTestId("ideas-grid")).toBeVisible();
  });

  test("can change product type to Journal and generate ideas", async ({ page }) => {
    await page.getByTestId("product-type-select").selectOption("Journal");
    await expect(page.getByTestId("product-type-select")).toHaveValue("Journal");
    await generateIdeas(page);
    await expect(page.getByTestId("ideas-grid")).toBeVisible();
  });

  test("results heading shows selected niche and product type", async ({ page }) => {
    await page.getByTestId("niche-select").selectOption("Fitness");
    await page.getByTestId("product-type-select").selectOption("Tracker");
    await generateIdeas(page);
    const heading = page.locator("h2").filter({ hasText: "10 ideas" });
    await expect(heading).toContainText("Fitness");
    await expect(heading).toContainText("Tracker");
  });
});

test.describe("SEO button", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto("/");
    await unlockPremium(page);
    await mockAllApis(page);
    await generateIdeas(page);
  });

  test("clicking SEO button shows SEO results", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("seo-button").click();
    await expect(firstCard.getByTestId("seo-results")).toBeVisible({ timeout: 8_000 });
  });

  test("SEO results contain 3 titles", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("seo-button").click();
    const seoResults = firstCard.getByTestId("seo-results");
    await expect(seoResults).toBeVisible({ timeout: 8_000 });
    // Three SEO title items rendered
    await expect(seoResults.locator(".bg-purple-50")).toHaveCount(3);
  });

  test("clicking SEO button again hides the results (toggle)", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("seo-button").click();
    await expect(firstCard.getByTestId("seo-results")).toBeVisible({ timeout: 8_000 });
    await firstCard.getByTestId("seo-button").click();
    await expect(firstCard.getByTestId("seo-results")).toBeHidden();
  });
});

test.describe("Tags button", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto("/");
    await unlockPremium(page);
    await mockAllApis(page);
    await generateIdeas(page);
  });

  test("clicking Tags button shows tag results", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("tags-button").click();
    await expect(firstCard.getByTestId("tags-results")).toBeVisible({ timeout: 8_000 });
  });

  test("Tags results show 13 tags", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("tags-button").click();
    const tagsResults = firstCard.getByTestId("tags-results");
    await expect(tagsResults).toBeVisible({ timeout: 8_000 });
    // 13 tag pills
    await expect(tagsResults.locator(".rounded-full").filter({ hasText: /^[a-z]/ })).toHaveCount(13);
  });

  test("clicking Tags button again hides the results (toggle)", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("tags-button").click();
    await expect(firstCard.getByTestId("tags-results")).toBeVisible({ timeout: 8_000 });
    await firstCard.getByTestId("tags-button").click();
    await expect(firstCard.getByTestId("tags-results")).toBeHidden();
  });
});

test.describe("Examples button", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto("/");
    await generateIdeas(page);
  });

  test("clicking Examples button shows example results", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("examples-button").click();
    await expect(firstCard.getByTestId("examples-results")).toBeVisible({ timeout: 8_000 });
  });

  test("examples results show price range", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("examples-button").click();
    const examplesResult = firstCard.getByTestId("examples-results");
    await expect(examplesResult).toBeVisible({ timeout: 8_000 });
    await expect(examplesResult).toContainText("$4.99");
  });

  test("examples results show seller tip", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("examples-button").click();
    const examplesResult = firstCard.getByTestId("examples-results");
    await expect(examplesResult).toBeVisible({ timeout: 8_000 });
    await expect(examplesResult).toContainText("Bundle");
  });

  test("clicking Examples button again hides the results (toggle)", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("examples-button").click();
    await expect(firstCard.getByTestId("examples-results")).toBeVisible({ timeout: 8_000 });
    await firstCard.getByTestId("examples-button").click();
    await expect(firstCard.getByTestId("examples-results")).toBeHidden();
  });
});

test.describe("Create This Product modal", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto("/");
    await unlockPremium(page);
    await mockAllApis(page);
    await generateIdeas(page);
  });

  test("clicking Create This Product opens the modal", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("create-product-button").click();
    await expect(page.getByTestId("create-product-modal")).toBeVisible();
  });

  test("modal shows product structure (pages list)", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("create-product-button").click();
    const modal = page.getByTestId("create-product-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Product Structure", { timeout: 8_000 });
    await expect(modal).toContainText("Cover Page");
  });

  test("modal shows Canva setup info", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("create-product-button").click();
    const modal = page.getByTestId("create-product-modal");
    await expect(modal).toContainText("Canva Setup", { timeout: 8_000 });
    await expect(modal).toContainText("8.5x11");
  });

  test("modal shows design tips", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("create-product-button").click();
    const modal = page.getByTestId("create-product-modal");
    await expect(modal).toContainText("Design Tips", { timeout: 8_000 });
  });

  test("modal can be closed with the X button", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("create-product-button").click();
    const modal = page.getByTestId("create-product-modal");
    await expect(modal).toBeVisible();
    // Click the ✕ button inside the modal header
    await modal.locator("button").filter({ hasText: "✕" }).click();
    await expect(modal).toBeHidden();
  });
});
