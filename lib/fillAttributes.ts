/**
 * lib/fillAttributes.ts
 *
 * Maps Etsy taxonomy properties + product context to a list of
 * EtsyListingAttribute objects ready to be sent to the Etsy v3
 * create/update listing API.
 *
 * Strategy:
 * 1. Build a lowercase "context bag" from title + tags + description.
 * 2. For each property that has possible_values, score each value
 *    against the context bag using keyword overlap.
 * 3. For multivalued properties, return all values with a positive score.
 *    For single-valued ones, return the best match.
 * 4. Required properties with no match get a "best-effort" default
 *    (first possible value) so the listing isn't rejected.
 * 5. Optional properties with zero matching values are omitted entirely.
 */

import type { TaxonomyProperty, TaxonomyPropertyValue } from "./etsy";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductContext {
  title: string;
  tags: string[];
  description: string;
}

/** A single attribute entry for the Etsy listing API body. */
export interface EtsyListingAttribute {
  property_id: number;
  value_ids: number[];
  values: string[];
  scale_id: number | null;
}

/** Result of a single property resolution attempt. */
export interface AttributeResolution {
  attribute: EtsyListingAttribute;
  /** "matched" = keyword hit, "default" = fallback to first value, "skipped" = no match + optional */
  source: "matched" | "default" | "skipped";
}

// ─── Keyword synonym map ──────────────────────────────────────────────────────

/**
 * Extra keyword aliases that help match common Etsy property values to
 * product context that may use different phrasing.
 * Key: lowercase canonical term used in possible_values names.
 * Value: additional words that should trigger a match.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  pdf: ["printable", "printables", "pdf"],
  png: ["png", "graphic", "image", "clipart", "clip art"],
  svg: ["svg", "cut file", "cricut", "silhouette"],
  jpeg: ["jpeg", "jpg", "photo"],
  "instant download": ["instant", "download", "digital", "printable"],
  digital: ["digital", "download", "printable", "ebook", "template"],
  printable: ["printable", "print", "pdf"],
  planner: ["planner", "planning", "organizer", "organiser", "schedule"],
  template: ["template", "templates"],
  spreadsheet: ["spreadsheet", "excel", "google sheets", "budget"],
  minimalist: ["minimalist", "minimal", "clean", "simple"],
  modern: ["modern", "contemporary", "sleek"],
  bohemian: ["boho", "bohemian", "floral", "wildflower"],
  "black and white": ["black", "white", "monochrome", "monochromatic"],
  colorful: ["colorful", "colourful", "rainbow", "bright", "vibrant"],
  teacher: ["teacher", "classroom", "school", "education", "students"],
  wedding: ["wedding", "bride", "bridal", "marriage"],
  christmas: ["christmas", "xmas", "holiday", "festive"],
  baby: ["baby", "nursery", "newborn", "infant"],
  fitness: ["fitness", "workout", "exercise", "gym", "health"],
  budget: ["budget", "finance", "money", "savings", "expense"],
  meal: ["meal", "food", "recipe", "grocery", "nutrition"],
  "goal setting": ["goal", "goals", "habit", "tracker", "productivity"],
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Build a single lowercase string from all product context fields. */
export function buildContextBag(ctx: ProductContext): string {
  return [ctx.title, ...ctx.tags, ctx.description].join(" ").toLowerCase();
}

/**
 * Score a taxonomy value name against the context bag.
 * Returns a non-negative integer; higher = better match.
 */
export function scoreValue(valueName: string, contextBag: string): number {
  const lower = valueName.toLowerCase();
  let score = 0;

  // Direct substring match
  if (contextBag.includes(lower)) score += 3;

  // Individual word match
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (word.length > 2 && contextBag.includes(word)) score += 1;
  }

  // Synonym map bonus
  const synonyms = SYNONYM_MAP[lower] ?? [];
  for (const syn of synonyms) {
    if (contextBag.includes(syn)) score += 2;
  }

  return score;
}

/**
 * Resolve a single taxonomy property to an attribute entry.
 */
export function resolveProperty(
  prop: TaxonomyProperty,
  contextBag: string
): AttributeResolution {
  const emptyAttribute: EtsyListingAttribute = {
    property_id: prop.property_id,
    value_ids: [],
    values: [],
    scale_id: prop.scales?.[0]?.scale_id ?? null,
  };

  if (!prop.possible_values || prop.possible_values.length === 0) {
    // No constrained values — property uses free-text (e.g. custom colour field).
    // We can't fill these without additional context, so skip.
    return { attribute: emptyAttribute, source: "skipped" };
  }

  // Score all possible values
  const scored = prop.possible_values.map((pv) => ({
    pv,
    score: scoreValue(pv.name, contextBag),
  }));

  const matched = scored.filter((s) => s.score > 0);

  if (matched.length === 0) {
    if (prop.is_required) {
      // Mandatory — use the first available value as a safe default
      const first = prop.possible_values[0];
      return {
        attribute: {
          property_id: prop.property_id,
          value_ids: [first.value_id],
          values: [first.name],
          scale_id: prop.scales?.[0]?.scale_id ?? null,
        },
        source: "default",
      };
    }
    // Optional with no match — omit
    return { attribute: emptyAttribute, source: "skipped" };
  }

  // Sort by score descending
  matched.sort((a, b) => b.score - a.score);

  let chosen: TaxonomyPropertyValue[];
  if (prop.is_multivalued) {
    // Keep all matches; respect max_values_allowed if set
    const limit = prop.max_values_allowed ?? matched.length;
    chosen = matched.slice(0, limit).map((s) => s.pv);
  } else {
    // Single value — take the top scorer
    chosen = [matched[0].pv];
  }

  return {
    attribute: {
      property_id: prop.property_id,
      value_ids: chosen.map((v) => v.value_id),
      values: chosen.map((v) => v.name),
      scale_id: prop.scales?.[0]?.scale_id ?? null,
    },
    source: "matched",
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fill Etsy listing attributes from taxonomy properties + product context.
 *
 * @param properties  Output of fetchTaxonomyProperties(apiKey, taxonomyId)
 * @param context     Product title, tags, and description
 * @returns           Array of EtsyListingAttribute objects (skipped ones excluded)
 */
export function fillAttributes(
  properties: TaxonomyProperty[],
  context: ProductContext
): EtsyListingAttribute[] {
  const bag = buildContextBag(context);
  const results: EtsyListingAttribute[] = [];

  for (const prop of properties) {
    const { attribute, source } = resolveProperty(prop, bag);
    if (source !== "skipped") {
      results.push(attribute);
    }
  }

  return results;
}

/**
 * Detailed version of fillAttributes that also returns resolution metadata
 * (useful for logging/debugging which values were matched vs defaulted).
 */
export function fillAttributesDetailed(
  properties: TaxonomyProperty[],
  context: ProductContext
): AttributeResolution[] {
  const bag = buildContextBag(context);
  return properties.map((prop) => resolveProperty(prop, bag));
}
