// Scenario 10: Premium locked features show upgrade CTA
import { test, expect } from "@playwright/test";
import { MOCK_IDEAS, MOCK_ANALYSIS, MOCK_SEO_TITLES, MOCK_TAGS } from "./fixtures/mockData";

async function mockIdeasApis(page: import("@playwright/test").Page) {
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
}

async function generateIdeas(page: import("@playwright/test").Page) {
  await page.getByTestId("generate-button").click();
  await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("idea-card").first()).toBeVisible();
}

async function unlockPremium(page: import("@playwright/test").Page) {
  await page.evaluate(() => localStorage.setItem("ps_dev_premium", "true"));
  await page.reload();
}

// ─── Free user — locked features ─────────────────────────────────────────────

test.describe("Free user — locked features show upgrade CTA", () => {
  test.beforeEach(async ({ page }) => {
    await mockIdeasApis(page);
    await page.goto("/");
    await generateIdeas(page);
  });

  test("Create This Product button shows LockGate for free users", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await expect(firstCard.getByTestId("lock-gate").first()).toBeVisible();
    await expect(firstCard.getByTestId("lock-gate").first()).toContainText("Upgrade to unlock");
  });

  test("SEO button works for free users (shows results up to daily limit)", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("seo-button").click();
    await expect(firstCard.getByTestId("seo-results")).toBeVisible({ timeout: 8_000 });
  });

  test("Tags button works for free users (shows results up to daily limit)", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("tags-button").click();
    await expect(firstCard.getByTestId("tags-results")).toBeVisible({ timeout: 8_000 });
  });

  test("Save button triggers upgrade modal for free users", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("save-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
  });

  test("Upgrade button in header opens upgrade modal", async ({ page }) => {
    await page.getByTestId("upgrade-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
  });

  test("upgrade modal shows Pro feature list", async ({ page }) => {
    await page.getByTestId("upgrade-button").click();
    const modal = page.getByTestId("upgrade-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("SEO");
    await expect(modal).toContainText("30-Day Sprint");
  });

  test("upgrade modal closes when clicking 'Keep exploring for free'", async ({ page }) => {
    await page.getByTestId("upgrade-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
    await page.getByTestId("upgrade-modal-close-btn").click();
    await expect(page.getByTestId("upgrade-modal")).toBeHidden();
  });

  test("Planner tab shows lock icon for free users", async ({ page }) => {
    const plannerTab = page.getByTestId("tab-planner");
    await expect(plannerTab).toContainText("🔒");
  });

  test("Start 30-Day Sprint button is visible and enabled for free users", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    const generatePlanBtn = page.getByTestId("generate-plan-button");
    await expect(generatePlanBtn).toContainText("Start 30-Day Sprint");
    await expect(generatePlanBtn).toBeEnabled();
  });

  test("Planner shows daily limit info for free users", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    // The limit info paragraph is shown below the generate button for free users
    await expect(page.locator("text=1 sprint plan/day")).toBeVisible();
  });
});

// ─── Premium user — features are unlocked ────────────────────────────────────

test.describe("Premium user — features are unlocked", () => {
  test.beforeEach(async ({ page }) => {
    await mockIdeasApis(page);
    await page.goto("/");
    await unlockPremium(page);
    await mockIdeasApis(page);
    await generateIdeas(page);
  });

  test("header shows Sprint Pro badge instead of Go Pro button", async ({ page }) => {
    await expect(page.getByTestId("upgrade-button")).toContainText("Sprint Pro");
  });

  test("Create This Product button is shown for premium users (not LockGate)", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await expect(firstCard.getByTestId("create-product-button")).toBeVisible();
    await expect(firstCard.getByTestId("lock-gate")).toHaveCount(0);
  });

  test("removing premium reverts header button to Go Pro", async ({ page }) => {
    // Premium is active from beforeEach
    await expect(page.getByTestId("upgrade-button")).toContainText("Sprint Pro");

    // Remove premium and reload
    await page.evaluate(() => localStorage.removeItem("ps_dev_premium"));
    await page.reload();
    await mockIdeasApis(page);

    // Back to free tier
    await expect(page.getByTestId("upgrade-button")).toContainText("Go Pro");
  });
});
