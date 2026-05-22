/**
 * Unit tests for lib/etsy.ts — taxonomy helpers and utility functions.
 * Run with: npm test  (requires `npm install` first to get vitest)
 */

import { describe, it, expect } from "vitest";
import {
  extractListingId,
  extractShopName,
  detectInputType,
  flattenTaxonomy,
  resolveCategoryPath,
  type TaxonomyNode,
} from "./etsy";

// ─── extractListingId ─────────────────────────────────────────────────────────

describe("extractListingId", () => {
  it("extracts ID from a standard Etsy listing URL", () => {
    expect(extractListingId("https://www.etsy.com/listing/123456789/some-product")).toBe(123456789);
  });

  it("extracts ID from a URL with query params", () => {
    expect(extractListingId("https://www.etsy.com/listing/987654321/item?ref=shop_home_active_1")).toBe(987654321);
  });

  it("returns null for a non-listing URL", () => {
    expect(extractListingId("https://www.etsy.com/shop/MyShop")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractListingId("")).toBeNull();
  });
});

// ─── extractShopName ──────────────────────────────────────────────────────────

describe("extractShopName", () => {
  it("extracts shop name from a shop URL", () => {
    expect(extractShopName("https://www.etsy.com/shop/CreativeJamCo")).toBe("CreativeJamCo");
  });

  it("handles trailing slash", () => {
    expect(extractShopName("https://www.etsy.com/shop/MyShop/")).toBe("MyShop");
  });

  it("returns null for a listing URL", () => {
    expect(extractShopName("https://www.etsy.com/listing/123/product")).toBeNull();
  });
});

// ─── detectInputType ──────────────────────────────────────────────────────────

describe("detectInputType", () => {
  it("detects listing_url", () => {
    expect(detectInputType("https://www.etsy.com/listing/123/thing")).toBe("listing_url");
  });

  it("detects shop_url", () => {
    expect(detectInputType("https://www.etsy.com/shop/MyShop")).toBe("shop_url");
  });

  it("detects keyword for plain text", () => {
    expect(detectInputType("digital planner printable")).toBe("keyword");
  });

  it("detects keyword for empty string", () => {
    expect(detectInputType("")).toBe("keyword");
  });
});

// ─── flattenTaxonomy ──────────────────────────────────────────────────────────

const MOCK_TREE: TaxonomyNode[] = [
  {
    id: 1,
    level: 1,
    name: "Digital Downloads",
    parent_id: null,
    full_path_taxonomy_ids: [1],
    children: [
      {
        id: 10,
        level: 2,
        name: "Patterns",
        parent_id: 1,
        full_path_taxonomy_ids: [1, 10],
        children: [
          {
            id: 100,
            level: 3,
            name: "Sewing Patterns",
            parent_id: 10,
            full_path_taxonomy_ids: [1, 10, 100],
            children: [],
          },
        ],
      },
      {
        id: 11,
        level: 2,
        name: "Planners",
        parent_id: 1,
        full_path_taxonomy_ids: [1, 11],
        children: [],
      },
    ],
  },
  {
    id: 2,
    level: 1,
    name: "Craft Supplies",
    parent_id: null,
    full_path_taxonomy_ids: [2],
    children: [],
  },
];

describe("flattenTaxonomy", () => {
  it("returns all nodes including nested children", () => {
    const flat = flattenTaxonomy(MOCK_TREE);
    expect(flat).toHaveLength(5); // 1 + 10 + 100 + 11 + 2
  });

  it("includes leaf nodes", () => {
    const flat = flattenTaxonomy(MOCK_TREE);
    expect(flat.some((n) => n.id === 100)).toBe(true);
  });

  it("returns empty array for empty input", () => {
    expect(flattenTaxonomy([])).toEqual([]);
  });
});

// ─── resolveCategoryPath ──────────────────────────────────────────────────────

describe("resolveCategoryPath", () => {
  const flat = flattenTaxonomy(MOCK_TREE);

  it("resolves an exact name match", () => {
    const node = resolveCategoryPath(flat, "Planners");
    expect(node?.id).toBe(11);
  });

  it("resolves a path string to the deepest match", () => {
    const node = resolveCategoryPath(flat, "Digital Downloads > Patterns > Sewing Patterns");
    expect(node?.id).toBe(100);
  });

  it("resolves case-insensitively", () => {
    const node = resolveCategoryPath(flat, "planners");
    expect(node?.id).toBe(11);
  });

  it("returns null for an unrecognised category", () => {
    const node = resolveCategoryPath(flat, "Furniture");
    expect(node).toBeNull();
  });

  it("returns null for empty hint", () => {
    expect(resolveCategoryPath(flat, "")).toBeNull();
  });

  it("returns null for empty node list", () => {
    expect(resolveCategoryPath([], "Planners")).toBeNull();
  });

  it("prefers deeper nodes on equal score", () => {
    // "Patterns" matches both id=10 (level 2) and could partially match id=100 (level 3)
    // "Sewing Patterns" contains "Patterns" → id=100 should win
    const node = resolveCategoryPath(flat, "Sewing Patterns");
    expect(node?.id).toBe(100);
  });
});
