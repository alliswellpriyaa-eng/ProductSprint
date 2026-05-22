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
