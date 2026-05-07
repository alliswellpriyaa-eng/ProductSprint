// Scenario 9: API failure shows friendly error (DemoBanner / ErrorBanner)
import { test, expect } from "@playwright/test";
import { MOCK_FALLBACK_IDEAS, MOCK_FALLBACK_PLANNER, MOCK_IDEAS } from "./fixtures/mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function unlockPremium(page: import("@playwright/test").Page) {
  await page.evaluate(() => localStorage.setItem("ps_dev_premium", "true"));
  await page.reload();
}

// ─── Idea Generator — fallback (soft) errors ──────────────────────────────────

test.describe("Fallback / demo mode on API failure", () => {
  test("shows DemoBanner when ideas API returns fallback:true", async ({ page }) => {
    await page.route("/api/generate-ideas", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FALLBACK_IDEAS),
      })
    );
    await page.route("/api/analyze-idea", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ demand: "High", competition: "Medium", potential: "High", audience: "Test", difficulty: "Easy" }) })
    );

    await page.goto("/");
    await page.getByTestId("generate-button").click();

    // Demo banner should appear
    await expect(page.getByTestId("demo-banner")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("demo-banner")).toContainText("Demo Mode");
  });

  test("DemoBanner shows a Retry button", async ({ page }) => {
    await page.route("/api/generate-ideas", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FALLBACK_IDEAS),
      })
    );
    await page.route("/api/analyze-idea", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) })
    );

    await page.goto("/");
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("demo-banner")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("demo-banner").locator("button", { hasText: "Retry" })).toBeVisible();
  });

  test("even in fallback mode, idea cards are rendered with sample data", async ({ page }) => {
    await page.route("/api/generate-ideas", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FALLBACK_IDEAS),
      })
    );
    await page.route("/api/analyze-idea", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) })
    );

    await page.goto("/");
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("ideas-grid")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("idea-card")).toHaveCount(10);
  });

  test("Retry button in DemoBanner triggers a new API call", async ({ page }) => {
    let callCount = 0;
    await page.route("/api/generate-ideas", (route) => {
      callCount++;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(callCount === 1 ? MOCK_FALLBACK_IDEAS : MOCK_IDEAS),
      });
    });
    await page.route("/api/analyze-idea", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) })
    );

    await page.goto("/");
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("demo-banner")).toBeVisible({ timeout: 10_000 });

    // Click retry
    await page.getByTestId("demo-banner").locator("button", { hasText: "Retry" }).click();
    // After successful retry, DemoBanner should disappear
    await expect(page.getByTestId("demo-banner")).toBeHidden({ timeout: 10_000 });
    expect(callCount).toBe(2);
  });
});

// ─── Hard errors (HTTP 500) ───────────────────────────────────────────────────

test.describe("ErrorBanner on hard API failure", () => {
  test("shows ErrorBanner when ideas API returns 500", async ({ page }) => {
    await page.route("/api/generate-ideas", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      })
    );

    await page.goto("/");
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("error-banner")).toBeVisible({ timeout: 10_000 });
  });

  test("ErrorBanner shows a Try Again button", async ({ page }) => {
    await page.route("/api/generate-ideas", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      })
    );

    await page.goto("/");
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("error-banner")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("error-banner").locator("button", { hasText: "Try again" })).toBeVisible();
  });

  test("shows network error banner for fetch failures", async ({ page }) => {
    await page.route("/api/generate-ideas", (route) => route.abort("failed"));

    await page.goto("/");
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("error-banner")).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Planner fallback ─────────────────────────────────────────────────────────

test.describe("Planner DemoBanner on API failure", () => {
  test("shows DemoBanner in planner when API returns fallback:true", async ({ page }) => {
    await page.route("/api/generate-planner", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FALLBACK_PLANNER),
      })
    );

    await page.goto("/");
    await unlockPremium(page);
    await page.route("/api/generate-planner", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FALLBACK_PLANNER),
      })
    );
    await page.getByTestId("tab-planner").click();
    await page.getByTestId("generate-plan-button").click();

    await expect(page.getByTestId("demo-banner")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("plan-results")).toBeVisible();
  });
});
