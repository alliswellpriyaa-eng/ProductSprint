// Scenario 10: Premium locked features show upgrade CTA
import { test, expect } from "@playwright/test";
import { MOCK_IDEAS, MOCK_ANALYSIS } from "./fixtures/mockData";

async function mockIdeasApis(page: import("@playwright/test").Page) {
  await page.route("/api/generate-ideas", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_IDEAS) })
  );
  await page.route("/api/analyze-idea", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_ANALYSIS) })
  );
}

async function generateIdeas(page: import("@playwright/test").Page) {
  await page.getByTestId("generate-button").click();
  await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("idea-card").first()).toBeVisible();
}

async function unlockPremium(page: import("@playwright/test").Page) {
  await page.evaluate(() => localStorage.setItem("etsy_premium", "true"));
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

  test("SEO button triggers upgrade modal for free users", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("seo-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
  });

  test("Tags button triggers upgrade modal for free users", async ({ page }) => {
    const firstCard = page.getByTestId("idea-card").first();
    await firstCard.getByTestId("tags-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
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

  test("upgrade modal shows pricing ($10/month)", async ({ page }) => {
    await page.getByTestId("upgrade-button").click();
    const modal = page.getByTestId("upgrade-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("$10");
    await expect(modal).toContainText("month");
  });

  test("upgrade modal shows feature list", async ({ page }) => {
    await page.getByTestId("upgrade-button").click();
    const modal = page.getByTestId("upgrade-modal");
    await expect(modal).toContainText("SEO-optimized titles");
    await expect(modal).toContainText("30-day sprint plan");
  });

  test("upgrade modal closes when clicking 'Continue with free plan'", async ({ page }) => {
    await page.getByTestId("upgrade-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
    await page.getByTestId("upgrade-modal-close-btn").click();
    await expect(page.getByTestId("upgrade-modal")).toBeHidden();
  });

  test("Planner tab shows lock icon for free users", async ({ page }) => {
    const plannerTab = page.getByTestId("tab-planner");
    await expect(plannerTab).toContainText("🔒");
  });

  test("Start 30-Day Sprint button shows lock icon for free users", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    const generatePlanBtn = page.getByTestId("generate-plan-button");
    await expect(generatePlanBtn).toContainText("🔒");
    await expect(generatePlanBtn).toContainText("Start 30-Day Sprint");
  });

  test("Planner generate button opens upgrade modal for free users", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    await page.getByTestId("generate-plan-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
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

  test("unlocking premium via modal toggle works", async ({ page }) => {
    // Start with no premium
    await page.evaluate(() => localStorage.removeItem("etsy_premium"));
    await page.reload();
    await mockIdeasApis(page);

    // Click upgrade and unlock
    await page.getByTestId("upgrade-button").click();
    await expect(page.getByTestId("upgrade-modal")).toBeVisible();
    await page.getByTestId("upgrade-modal-unlock-btn").click();
    await expect(page.getByTestId("upgrade-modal")).toBeHidden();

    // Button should now show Sprint Pro
    await expect(page.getByTestId("upgrade-button")).toContainText("Sprint Pro");
  });
});
