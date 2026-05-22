/**
 * Unit tests for lib/fillAttributes.ts
 * Run with: npm test
 */

import { describe, it, expect } from "vitest";
import {
  buildContextBag,
  scoreValue,
  resolveProperty,
  fillAttributes,
  fillAttributesDetailed,
  type ProductContext,
} from "./fillAttributes";
import type { TaxonomyProperty } from "./etsy";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PDF_PROPERTY: TaxonomyProperty = {
  property_id: 513,
  name: "Digital file type",
  display_name: "Digital file type",
  scales: [],
  is_required: true,
  supports_attributes: true,
  supports_variations: false,
  is_multivalued: true,
  max_values_allowed: 3,
  possible_values: [
    { value_id: 1, name: "PDF", scale_id: null, equal_to: [] },
    { value_id: 2, name: "PNG", scale_id: null, equal_to: [] },
    { value_id: 3, name: "SVG", scale_id: null, equal_to: [] },
    { value_id: 4, name: "JPEG", scale_id: null, equal_to: [] },
  ],
  selected_values: [],
};

const STYLE_PROPERTY: TaxonomyProperty = {
  property_id: 200,
  name: "Style",
  display_name: "Style",
  scales: [],
  is_required: false,
  supports_attributes: true,
  supports_variations: false,
  is_multivalued: true,
  max_values_allowed: null,
  possible_values: [
    { value_id: 10, name: "Minimalist", scale_id: null, equal_to: [] },
    { value_id: 11, name: "Modern", scale_id: null, equal_to: [] },
    { value_id: 12, name: "Bohemian", scale_id: null, equal_to: [] },
    { value_id: 13, name: "Colorful", scale_id: null, equal_to: [] },
  ],
  selected_values: [],
};

const REQUIRED_NO_MATCH_PROPERTY: TaxonomyProperty = {
  property_id: 999,
  name: "Primary color",
  display_name: "Primary color",
  scales: [],
  is_required: true,
  supports_attributes: true,
  supports_variations: false,
  is_multivalued: false,
  max_values_allowed: 1,
  possible_values: [
    { value_id: 50, name: "Beige", scale_id: null, equal_to: [] },
    { value_id: 51, name: "Teal", scale_id: null, equal_to: [] },
  ],
  selected_values: [],
};

const OPTIONAL_NO_VALUES_PROPERTY: TaxonomyProperty = {
  property_id: 777,
  name: "Custom label",
  display_name: "Custom label",
  scales: [],
  is_required: false,
  supports_attributes: true,
  supports_variations: false,
  is_multivalued: false,
  max_values_allowed: 1,
  possible_values: [], // no constrained values
  selected_values: [],
};

const PLANNER_CONTEXT: ProductContext = {
  title: "Daily Planner Printable PDF | Minimalist Productivity Planner",
  tags: ["printable pdf", "daily planner", "minimalist", "instant download"],
  description:
    "Feeling overwhelmed? This printable daily planner PDF helps you stay organized and productive. Clean, minimal design. Instant download.",
};

// ─── buildContextBag ──────────────────────────────────────────────────────────

describe("buildContextBag", () => {
  it("joins title, tags, and description into one lowercase string", () => {
    const bag = buildContextBag(PLANNER_CONTEXT);
    expect(bag).toContain("daily planner");
    expect(bag).toContain("minimalist");
    expect(bag).toContain("instant download");
    expect(bag).toContain("organized");
  });

  it("is entirely lowercase", () => {
    const bag = buildContextBag(PLANNER_CONTEXT);
    expect(bag).toBe(bag.toLowerCase());
  });
});

// ─── scoreValue ───────────────────────────────────────────────────────────────

describe("scoreValue", () => {
  const bag = buildContextBag(PLANNER_CONTEXT);

  it("scores a direct substring match highly", () => {
    expect(scoreValue("PDF", bag)).toBeGreaterThan(0);
  });

  it("scores a synonym match", () => {
    // "Instant Download" synonym list includes "download" and "instant"
    expect(scoreValue("Instant Download", bag)).toBeGreaterThan(0);
  });

  it("returns 0 for an unrelated value", () => {
    expect(scoreValue("Furniture", bag)).toBe(0);
  });

  it("scores PDF higher than SVG for a printable planner context", () => {
    const pdfScore = scoreValue("PDF", bag);
    const svgScore = scoreValue("SVG", bag);
    expect(pdfScore).toBeGreaterThan(svgScore);
  });
});

// ─── resolveProperty ─────────────────────────────────────────────────────────

describe("resolveProperty", () => {
  const bag = buildContextBag(PLANNER_CONTEXT);

  it("matches PDF for a printable planner", () => {
    const { attribute, source } = resolveProperty(PDF_PROPERTY, bag);
    expect(source).toBe("matched");
    expect(attribute.values).toContain("PDF");
    expect(attribute.property_id).toBe(513);
  });

  it("respects is_multivalued and returns multiple matches", () => {
    // Both PDF and PNG could match (pdf/printable keywords)
    const { attribute } = resolveProperty(PDF_PROPERTY, bag);
    expect(attribute.value_ids.length).toBeGreaterThanOrEqual(1);
    expect(attribute.value_ids.length).toBeLessThanOrEqual(3); // max_values_allowed = 3
  });

  it("returns Minimalist for a minimalist planner context", () => {
    const { attribute, source } = resolveProperty(STYLE_PROPERTY, bag);
    expect(source).toBe("matched");
    expect(attribute.values).toContain("Minimalist");
  });

  it("defaults to first value when required property has no match", () => {
    const { attribute, source } = resolveProperty(REQUIRED_NO_MATCH_PROPERTY, bag);
    expect(source).toBe("default");
    expect(attribute.value_ids).toEqual([50]); // first possible value
    expect(attribute.values).toEqual(["Beige"]);
  });

  it("skips optional property with empty possible_values", () => {
    const { source } = resolveProperty(OPTIONAL_NO_VALUES_PROPERTY, bag);
    expect(source).toBe("skipped");
  });

  it("skips optional property with no context match", () => {
    const UNRELATED_OPTIONAL: TaxonomyProperty = {
      ...STYLE_PROPERTY,
      is_required: false,
      possible_values: [
        { value_id: 99, name: "Rustic", scale_id: null, equal_to: [] },
        { value_id: 98, name: "Vintage", scale_id: null, equal_to: [] },
      ],
    };
    const bag2 = buildContextBag({ title: "Budget Tracker", tags: [], description: "Excel spreadsheet" });
    const { source } = resolveProperty(UNRELATED_OPTIONAL, bag2);
    expect(source).toBe("skipped");
  });
});

// ─── fillAttributes ───────────────────────────────────────────────────────────

describe("fillAttributes", () => {
  it("returns attributes for all non-skipped properties", () => {
    const attrs = fillAttributes(
      [PDF_PROPERTY, STYLE_PROPERTY, OPTIONAL_NO_VALUES_PROPERTY],
      PLANNER_CONTEXT
    );
    // OPTIONAL_NO_VALUES_PROPERTY is skipped; PDF and Style are included
    expect(attrs.length).toBe(2);
  });

  it("includes required-with-default in output", () => {
    const attrs = fillAttributes(
      [REQUIRED_NO_MATCH_PROPERTY],
      { title: "Unrelated thing", tags: [], description: "" }
    );
    expect(attrs.length).toBe(1);
    expect(attrs[0].source).toBeUndefined(); // EtsyListingAttribute has no source field
    expect(attrs[0].value_ids).toEqual([50]);
  });

  it("returns empty array for all-skipped properties", () => {
    const attrs = fillAttributes([OPTIONAL_NO_VALUES_PROPERTY], PLANNER_CONTEXT);
    expect(attrs).toEqual([]);
  });

  it("returns correct property_id for each attribute", () => {
    const attrs = fillAttributes([PDF_PROPERTY, STYLE_PROPERTY], PLANNER_CONTEXT);
    const ids = attrs.map((a) => a.property_id);
    expect(ids).toContain(513);
    expect(ids).toContain(200);
  });
});

// ─── fillAttributesDetailed ───────────────────────────────────────────────────

describe("fillAttributesDetailed", () => {
  it("returns a resolution entry for every input property", () => {
    const results = fillAttributesDetailed(
      [PDF_PROPERTY, STYLE_PROPERTY, OPTIONAL_NO_VALUES_PROPERTY],
      PLANNER_CONTEXT
    );
    expect(results).toHaveLength(3);
  });

  it("correctly labels matched, default, and skipped", () => {
    const results = fillAttributesDetailed(
      [PDF_PROPERTY, REQUIRED_NO_MATCH_PROPERTY, OPTIONAL_NO_VALUES_PROPERTY],
      PLANNER_CONTEXT
    );
    const sources = results.map((r) => r.source);
    expect(sources).toContain("matched");
    expect(sources).toContain("default");
    expect(sources).toContain("skipped");
  });
});
