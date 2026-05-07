// Scenario 7: 30-Day Sprint Plan generates full execution plan
import { test, expect } from "@playwright/test";
import { MOCK_PLANNER_DAYS } from "./fixtures/mockData";

async function mockPlannerApi(page: import("@playwright/test").Page) {
  await page.route("/api/generate-planner", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ days: MOCK_PLANNER_DAYS }),
    })
  );
}

async function unlockPremium(page: import("@playwright/test").Page) {
  await page.evaluate(() => localStorage.setItem("ps_dev_premium", "true"));
  await page.reload();
}

async function generatePlan(page: import("@playwright/test").Page) {
  await page.getByTestId("tab-planner").click();
  await page.getByTestId("generate-plan-button").click();
  await expect(page.getByTestId("plan-results")).toBeVisible({ timeout: 10_000 });
}

test.describe("30-Day Sprint Plan", () => {
  test.beforeEach(async ({ page }) => {
    await mockPlannerApi(page);
    await page.goto("/");
    await unlockPremium(page);
    await mockPlannerApi(page);
  });

  test("clicking Planner tab shows the planner view", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    await expect(page.getByTestId("planner-empty-state")).toBeVisible();
    await expect(page.getByText("Plan your entire month in seconds.")).toBeVisible();
  });

  test("planner has a niche selector", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    await expect(page.getByTestId("planner-niche-select")).toBeVisible();
  });

  test("Start 30-Day Sprint button triggers plan generation", async ({ page }) => {
    await generatePlan(page);
    await expect(page.getByTestId("plan-results")).toBeVisible();
  });

  test("plan renders 30 day cards", async ({ page }) => {
    await generatePlan(page);
    const dayCards = page.getByTestId("day-card");
    await expect(dayCards).toHaveCount(30);
  });

  test("plan shows all three sprint phases (Setup, Build, Launch)", async ({ page }) => {
    await generatePlan(page);
    await expect(page.getByText("Sprint Setup")).toBeVisible();
    await expect(page.getByText("Sprint Build")).toBeVisible();
    await expect(page.getByText("Sprint Launch")).toBeVisible();
  });

  test("Sprint Setup phase shows Days 1–5", async ({ page }) => {
    await generatePlan(page);
    const setupSection = page.locator("text=Sprint Setup").locator("..").locator("..");
    await expect(setupSection).toContainText("Days 1–5");
  });

  test("clicking a day card expands it to show tasks", async ({ page }) => {
    await generatePlan(page);
    const firstDayCard = page.getByTestId("day-card").first();
    // Click the header button inside the card
    await firstDayCard.locator("button").first().click();
    await expect(firstDayCard).toContainText("Tasks");
  });

  test("bundle card appears after generating plan", async ({ page }) => {
    await generatePlan(page);
    await expect(page.getByTestId("bundle-card")).toBeVisible();
    await expect(page.getByTestId("bundle-card")).toContainText("Bundle Opportunity");
  });

  test("Action Mode toggle exists", async ({ page }) => {
    await generatePlan(page);
    await expect(page.getByTestId("action-mode-toggle")).toBeVisible();
  });

  test("toggling Action Mode expands all day cards with action steps", async ({ page }) => {
    await generatePlan(page);
    await page.getByTestId("action-mode-toggle").click();
    // In action mode all cards expand, first card should show action steps
    const firstDayCard = page.getByTestId("day-card").first();
    await expect(firstDayCard).toContainText("Action Steps", { timeout: 5_000 });
  });

  test("action steps include Canva step and pricing", async ({ page }) => {
    await generatePlan(page);
    await page.getByTestId("action-mode-toggle").click();
    const firstDayCard = page.getByTestId("day-card").first();
    await expect(firstDayCard).toContainText("Open Canva", { timeout: 5_000 });
    await expect(firstDayCard).toContainText("$7.99");
  });

  test("can change niche before generating plan", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    await page.getByTestId("planner-niche-select").selectOption("Wedding");
    await page.getByTestId("generate-plan-button").click();
    await expect(page.getByTestId("plan-results")).toBeVisible({ timeout: 10_000 });
    // Scope to plan-results to avoid matching "Wedding" in the niche dropdown option
    await expect(page.getByTestId("plan-results")).toContainText("Wedding");
  });
});
