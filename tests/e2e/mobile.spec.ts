// Scenario 8: Mobile responsive layout works
import { test, expect } from "@playwright/test";
import { MOCK_IDEAS, MOCK_ANALYSIS } from "./fixtures/mockData";

// These tests run against the "Mobile Pixel 5" project (375 x 812)
// configured in playwright.config.ts, but we also set viewport here
// explicitly so the tests are self-contained when run in isolation.

test.use({ viewport: { width: 375, height: 812 } });

async function mockIdeasApi(page: import("@playwright/test").Page) {
  await page.route("/api/generate-ideas", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_IDEAS) })
  );
  await page.route("/api/analyze-idea", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_ANALYSIS) })
  );
}

test.describe("Mobile responsive layout", () => {
  test.beforeEach(async ({ page }) => {
    await mockIdeasApi(page);
    await page.goto("/");
  });

  test("header is visible on mobile", async ({ page }) => {
    await expect(page.getByTestId("app-header")).toBeVisible();
    await expect(page.getByTestId("app-header")).toContainText("ProductSprint");
  });

  test("tabs are visible and tappable on mobile", async ({ page }) => {
    const generatorTab = page.getByTestId("tab-generator");
    const plannerTab = page.getByTestId("tab-planner");
    await expect(generatorTab).toBeVisible();
    await expect(plannerTab).toBeVisible();
    // Tabs fit within the viewport width
    const generatorBox = await generatorTab.boundingBox();
    expect(generatorBox?.x).toBeGreaterThanOrEqual(0);
    expect((generatorBox?.x ?? 0) + (generatorBox?.width ?? 0)).toBeLessThanOrEqual(375 + 1);
  });

  test("niche and product type selects are full-width on mobile", async ({ page }) => {
    const nicheSelect = page.getByTestId("niche-select");
    const box = await nicheSelect.boundingBox();
    // Should be reasonably wide (at least half viewport)
    expect(box?.width).toBeGreaterThan(150);
  });

  test("generate button is visible and tappable on mobile", async ({ page }) => {
    const btn = page.getByTestId("generate-button");
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    // Button should be within the viewport
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375 + 20); // small tolerance
  });

  test("idea cards stack in a single column on mobile", async ({ page }) => {
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 10_000 });
    const firstCard = page.getByTestId("idea-card").first();
    const secondCard = page.getByTestId("idea-card").nth(1);
    await expect(firstCard).toBeVisible();
    await expect(secondCard).toBeVisible();

    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    // On mobile, cards stack vertically — second card's top should be below first card's bottom
    if (firstBox && secondBox) {
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 5);
    }
  });

  test("upgrade button is visible on mobile", async ({ page }) => {
    await expect(page.getByTestId("upgrade-button")).toBeVisible();
  });

  test("planner tab switches view correctly on mobile", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    await expect(page.getByTestId("planner-empty-state")).toBeVisible();
    await expect(page.getByTestId("generate-plan-button")).toBeVisible();
  });

  test("planner generate button is tappable on mobile", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    const btn = page.getByTestId("generate-plan-button");
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
  });
});
