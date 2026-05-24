/**
 * Etsy v3 API client
 * Docs: https://developers.etsy.com/documentation/
 *
 * Public endpoints (listing reads, search) only require ETSY_API_KEY.
 * Draft creation requires OAuth — handled separately when credentials are added.
 */

const ETSY_BASE = "https://openapi.etsy.com/v3/application";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EtsyImage {
  url_570xN: string;
  url_fullxfull: string;
  alt_text: string | null;
}

export interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  price: { amount: number; divisor: number; currency_code: string };
  tags: string[];
  views: number;
  num_favorers: number;
  quantity: number;
  state: string;
  url: string;
  images: EtsyImage[];
  shop_id: number;
  shop_name?: string;
  taxonomy_path?: string[];
}

export interface EtsySearchResult {
  listing_id: number;
  title: string;
  description: string;
  price: { amount: number; divisor: number; currency_code: string };
  tags: string[];
  views: number;
  num_favorers: number;
  url: string;
  images: EtsyImage[];
  shop_name?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Etsy v3 requires x-api-key to be formatted as "keystring:sharedsecret".
 * Pass the combined value from process.env.ETSY_API_KEY.
 * If ETSY_SHARED_SECRET is set separately, we join them here.
 */
function headers(apiKey: string): HeadersInit {
  const sharedSecret = process.env.ETSY_SHARED_SECRET;
  const combined =
    sharedSecret && !apiKey.includes(":")
      ? `${apiKey}:${sharedSecret}`
      : apiKey;
  return { "x-api-key": combined };
}

function formatPrice(price: { amount: number; divisor: number; currency_code: string }): string {
  return `${price.currency_code} ${(price.amount / price.divisor).toFixed(2)}`;
}

/** Extract listing ID from an Etsy URL like https://www.etsy.com/listing/123456789/... */
export function extractListingId(url: string): number | null {
  const match = url.match(/\/listing\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract shop name/ID from an Etsy shop URL like https://www.etsy.com/shop/ShopName */
export function extractShopName(url: string): string | null {
  const match = url.match(/etsy\.com\/shop\/([^/?#]+)/i);
  return match ? match[1] : null;
}

/** Detect what kind of Etsy input the user pasted */
export type EtsyInputType = "listing_url" | "shop_url" | "keyword";

export function detectInputType(input: string): EtsyInputType {
  if (input.includes("etsy.com/listing/")) return "listing_url";
  if (input.includes("etsy.com/shop/")) return "shop_url";
  return "keyword";
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** Fetch a single listing by ID. Includes images. */
export async function fetchListing(
  apiKey: string,
  listingId: number
): Promise<EtsyListing | null> {
  try {
    // Etsy v3 uses repeated param syntax: includes[]=Images&includes[]=Shop
    const url = `${ETSY_BASE}/listings/${listingId}?includes[]=Images&includes[]=Shop`;
    const res = await fetch(url, { headers: headers(apiKey) });
    if (!res.ok) {
      console.error(`[etsy] fetchListing ${listingId} → ${res.status}`, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json() as Record<string, unknown>;
    return normalizeListing(data);
  } catch (e) {
    console.error("[etsy] fetchListing error:", e);
    return null;
  }
}

/** Search Etsy listings by keyword. Returns top N results. */
export async function searchListings(
  apiKey: string,
  keyword: string,
  limit = 5
): Promise<EtsySearchResult[]> {
  try {
    // Etsy v3: array params use [] suffix; sort_on valid values: created|price|updated|score
    const url =
      `${ETSY_BASE}/listings/active` +
      `?keywords=${encodeURIComponent(keyword)}` +
      `&limit=${limit}` +
      `&sort_on=score` +
      `&includes[]=Images`;

    const res = await fetch(url, { headers: headers(apiKey) });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[etsy] searchListings "${keyword}" → ${res.status}`, body);
      return [];
    }
    const data = await res.json() as { results?: unknown[] };
    return (data.results ?? []).map((r) => normalizeSearchResult(r as Record<string, unknown>));
  } catch (e) {
    console.error("[etsy] searchListings error:", e);
    return [];
  }
}

/** Fetch top listings from a shop by shop name.
 *  Strategy: try the official shop-by-name lookup first;
 *  if that fails (OAuth required or empty), fall back to a keyword search
 *  using the shop name so shop URLs always return useful results. */
export async function fetchShopListings(
  apiKey: string,
  shopName: string,
  limit = 5
): Promise<EtsySearchResult[]> {
  // ── Step 1: resolve shop name → shop_id via the shops endpoint ───────────
  try {
    const shopRes = await fetch(
      `${ETSY_BASE}/shops?shop_name=${encodeURIComponent(shopName)}`,
      { headers: headers(apiKey) }
    );
    if (shopRes.ok) {
      const shopData = await shopRes.json() as { results?: Array<{ shop_id: number }> };
      const shopId = shopData.results?.[0]?.shop_id;
      if (shopId) {
        const listUrl =
          `${ETSY_BASE}/shops/${shopId}/listings/active` +
          `?limit=${limit}` +
          `&sort_on=score` +
          `&includes[]=Images`;
        const listRes = await fetch(listUrl, { headers: headers(apiKey) });
        if (listRes.ok) {
          const listData = await listRes.json() as { results?: unknown[] };
          const results = (listData.results ?? []).map((r) =>
            normalizeSearchResult({ ...(r as Record<string, unknown>), shop_name: shopName })
          );
          if (results.length > 0) return results;
        } else {
          console.warn(`[etsy] shop listings → ${listRes.status}`);
        }
      } else {
        console.warn(`[etsy] shops?shop_name=${shopName} → no shop_id in response`);
      }
    } else {
      console.warn(`[etsy] shops lookup → ${shopRes.status} (may need OAuth)`);
    }
  } catch (e) {
    console.warn("[etsy] fetchShopListings step1 error:", e);
  }

  // ── Step 2: fall back to keyword search using shop name as query ──────────
  console.log(`[etsy] fetchShopListings falling back to keyword search for "${shopName}"`);
  return searchListings(apiKey, shopName, limit);
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeListing(raw: Record<string, unknown>): EtsyListing {
  const images = extractImages(raw);
  const shop = raw.shop as Record<string, unknown> | undefined;
  return {
    listing_id: raw.listing_id as number,
    title: (raw.title as string) ?? "",
    description: ((raw.description as string) ?? "").slice(0, 2000),
    price: raw.price as EtsyListing["price"],
    tags: (raw.tags as string[]) ?? [],
    views: (raw.views as number) ?? 0,
    num_favorers: (raw.num_favorers as number) ?? 0,
    quantity: (raw.quantity as number) ?? 0,
    state: (raw.state as string) ?? "",
    url: (raw.url as string) ?? `https://www.etsy.com/listing/${raw.listing_id}`,
    images,
    shop_id: (raw.shop_id as number) ?? 0,
    shop_name: (shop?.shop_name as string) ?? undefined,
    taxonomy_path: (raw.taxonomy_path as string[]) ?? [],
  };
}

function normalizeSearchResult(raw: Record<string, unknown>): EtsySearchResult {
  const images = extractImages(raw);
  return {
    listing_id: raw.listing_id as number,
    title: (raw.title as string) ?? "",
    description: ((raw.description as string) ?? "").slice(0, 800),
    price: raw.price as EtsySearchResult["price"],
    tags: (raw.tags as string[]) ?? [],
    views: (raw.views as number) ?? 0,
    num_favorers: (raw.num_favorers as number) ?? 0,
    url: (raw.url as string) ?? `https://www.etsy.com/listing/${raw.listing_id}`,
    images,
    shop_name: (raw.shop_name as string) ?? undefined,
  };
}

function extractImages(raw: Record<string, unknown>): EtsyImage[] {
  const imgs = raw.images as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(imgs)) return [];
  return imgs.slice(0, 3).map((img) => ({
    url_570xN: (img.url_570xN as string) ?? "",
    url_fullxfull: (img.url_fullxfull as string) ?? "",
    alt_text: (img.alt_text as string) ?? null,
  }));
}

// ─── Formatting helpers for AI prompts ────────────────────────────────────────

export function formatListingForPrompt(listing: EtsyListing | EtsySearchResult): string {
  const price = listing.price ? formatPrice(listing.price) : "unknown";
  const lines = [
    `Title: ${listing.title}`,
    `Price: ${price}`,
    `Favorites: ${listing.num_favorers}`,
    `Views: ${listing.views}`,
    `Tags: ${listing.tags.join(", ")}`,
    `Description (excerpt): ${listing.description.slice(0, 400)}`,
  ];
  if (listing.shop_name) lines.push(`Shop: ${listing.shop_name}`);
  return lines.join("\n");
}

// ─── Taxonomy types ───────────────────────────────────────────────────────────

export interface TaxonomyNode {
  id: number;
  level: number;
  name: string;
  parent_id: number | null;
  /** IDs of all ancestors plus this node, root-first */
  full_path_taxonomy_ids: number[];
  children: TaxonomyNode[];
}

export interface TaxonomyPropertyValue {
  value_id: number;
  name: string;
  scale_id: number | null;
  equal_to: string[];
}

export interface TaxonomyProperty {
  property_id: number;
  name: string;
  display_name: string;
  scales: Array<{ scale_id: number; display_name: string; description: string }>;
  is_required: boolean;
  supports_attributes: boolean;
  supports_variations: boolean;
  is_multivalued: boolean;
  max_values_allowed: number | null;
  possible_values: TaxonomyPropertyValue[];
  selected_values: TaxonomyPropertyValue[];
}

// ─── Taxonomy API calls ───────────────────────────────────────────────────────

/** In-process cache so we only fetch the taxonomy tree once per server lifetime. */
let _taxonomyCache: TaxonomyNode[] | null = null;

/**
 * Fetch the full Etsy seller taxonomy tree.
 * Returns a flat-ish array of root nodes, each with nested children.
 * Results are memoised in-process so subsequent calls are free.
 */
export async function fetchTaxonomyNodes(apiKey: string): Promise<TaxonomyNode[]> {
  if (_taxonomyCache) return _taxonomyCache;

  try {
    const url = `${ETSY_BASE}/seller-taxonomy/nodes`;
    const res = await fetch(url, { headers: headers(apiKey) });
    if (!res.ok) {
      console.error(`[etsy] fetchTaxonomyNodes → ${res.status}`, await res.text().catch(() => ""));
      return [];
    }
    const data = await res.json() as { results?: unknown[] };
    const nodes = (data.results ?? []) as TaxonomyNode[];
    _taxonomyCache = nodes;
    return nodes;
  } catch (e) {
    console.error("[etsy] fetchTaxonomyNodes error:", e);
    return [];
  }
}

/**
 * Fetch the listing properties (attributes) available for a specific taxonomy node.
 * @param taxonomyId  The numeric id of the taxonomy node (e.g. 2078 for "Digital Downloads")
 */
export async function fetchTaxonomyProperties(
  apiKey: string,
  taxonomyId: number
): Promise<TaxonomyProperty[]> {
  try {
    const url = `${ETSY_BASE}/seller-taxonomy/nodes/${taxonomyId}/properties`;
    const res = await fetch(url, { headers: headers(apiKey) });
    if (!res.ok) {
      console.error(
        `[etsy] fetchTaxonomyProperties(${taxonomyId}) → ${res.status}`,
        await res.text().catch(() => "")
      );
      return [];
    }
    const data = await res.json() as { results?: unknown[] };
    return (data.results ?? []) as TaxonomyProperty[];
  } catch (e) {
    console.error("[etsy] fetchTaxonomyProperties error:", e);
    return [];
  }
}

// ─── Taxonomy helpers ─────────────────────────────────────────────────────────

/** Flatten a nested taxonomy tree into a single array of all nodes. */
export function flattenTaxonomy(nodes: TaxonomyNode[]): TaxonomyNode[] {
  const result: TaxonomyNode[] = [];
  function walk(node: TaxonomyNode) {
    result.push(node);
    for (const child of node.children ?? []) walk(child);
  }
  for (const root of nodes) walk(root);
  return result;
}

/**
 * Resolve a human-readable category hint (e.g. "Digital Downloads > Patterns")
 * to the best-matching Etsy taxonomy node.
 *
 * Strategy:
 * 1. Try an exact case-insensitive name match on the deepest segment.
 * 2. Fall back to the highest-scoring partial substring match.
 * 3. If nothing matches, return null.
 *
 * @param nodes   Flat array from flattenTaxonomy()
 * @param hint    Free-text category string from AI output or user input
 */
export function resolveCategoryPath(
  nodes: TaxonomyNode[],
  hint: string
): TaxonomyNode | null {
  if (!hint || nodes.length === 0) return null;

  const segments = hint
    .split(/[>\/|,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Score each node: more matching segments = higher score; deeper level preferred
  let best: TaxonomyNode | null = null;
  let bestScore = -1;

  for (const node of nodes) {
    const nameLower = node.name.toLowerCase();
    let score = 0;
    for (const seg of segments) {
      if (nameLower === seg) score += 2;          // exact match
      else if (nameLower.includes(seg)) score += 1; // partial match
    }
    if (score > bestScore || (score === bestScore && node.level > (best?.level ?? -1))) {
      best = node;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : null;
}
