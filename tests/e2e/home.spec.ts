// Scenario 1: Home page loads correctly
import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the app header with logo and title", async ({ page }) => {
    const header = page.getByTestId("app-header");
    await expect(header).toBeVisible();
    await expect(header).toContainText("ProductSprint");
  });

  test("shows the Go Pro button in the header", async ({ page }) => {
    const upgradeBtn = page.getByTestId("upgrade-button");
    await expect(upgradeBtn).toBeVisible();
    await expect(upgradeBtn).toContainText("Go Pro");
  });

  test("renders both navigation tabs", async ({ page }) => {
    await expect(page.getByTestId("tab-generator")).toBeVisible();
    await expect(page.getByTestId("tab-planner")).toBeVisible();
    await expect(page.getByTestId("tab-generator")).toContainText("Sprint Starter");
    await expect(page.getByTestId("tab-planner")).toContainText("30-Day Sprint Plan");
  });

  test("Idea Generator tab is active by default", async ({ page }) => {
    const generatorTab = page.getByTestId("tab-generator");
    await expect(generatorTab).toHaveClass(/bg-purple-600/);
  });

  test("renders niche and product type dropdowns", async ({ page }) => {
    await expect(page.getByTestId("niche-select")).toBeVisible();
    await expect(page.getByTestId("product-type-select")).toBeVisible();
  });

  test("niche dropdown has correct default value", async ({ page }) => {
    const nicheSelect = page.getByTestId("niche-select");
    await expect(nicheSelect).toHaveValue("Kids");
  });

  test("product type dropdown has correct default value", async ({ page }) => {
    const productTypeSelect = page.getByTestId("product-type-select");
    await expect(productTypeSelect).toHaveValue("Planner");
  });

  test("renders the generate ideas button", async ({ page }) => {
    const generateBtn = page.getByTestId("generate-button");
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toContainText("Start Product Sprint");
  });

  test("shows the platform selector with three options", async ({ page }) => {
    // Scope within the platform selector to avoid matching "Etsy Product Planner" in the header
    const selector = page.getByTestId("platform-selector");
    await expect(selector).toBeVisible();
    await expect(selector.getByText("Etsy")).toBeVisible();
    await expect(selector.getByText("Gumroad")).toBeVisible();
    await expect(selector.getByText("Shopify")).toBeVisible();
  });

  test("shows the empty state with prompt to get started", async ({ page }) => {
    await expect(page.getByText("Ready to launch your next digital product?")).toBeVisible();
  });

  test("switching to Planner tab shows planner view", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    await expect(page.getByTestId("planner-empty-state")).toBeVisible();
    await expect(page.getByTestId("generate-plan-button")).toBeVisible();
  });

  test("switching back to Generator tab restores generator view", async ({ page }) => {
    await page.getByTestId("tab-planner").click();
    await page.getByTestId("tab-generator").click();
    await expect(page.getByTestId("generate-button")).toBeVisible();
    await expect(page.getByText("Ready to launch your next digital product?")).toBeVisible();
  });

  test("footer is visible", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("ProductSprint");
  });
});
