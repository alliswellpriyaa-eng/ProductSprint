import { NextRequest, NextResponse } from "next/server";
import { withUsageCheck } from "@/lib/apiAuth";
import type { GeneratedListing } from "@/types/research";
import type { EtsyListingAttribute } from "@/lib/fillAttributes";

export const maxDuration = 30;

const ETSY_TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";
const ETSY_API_BASE = "https://openapi.etsy.com/v3/application";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftBody {
  listing?: GeneratedListing;
  /** taxonomy_id resolved by generate-etsy-pack */
  taxonomyId?: number;
  /** attributes resolved by generate-etsy-pack */
  attributes?: EtsyListingAttribute[];
  /** Override price (float, e.g. 6.00) */
  priceOverride?: number;
}

interface EtsyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Exchange a refresh token for a fresh access token.
 * Etsy uses PKCE (public client) — no client_secret is needed or accepted.
 * Only requires ETSY_CLIENT_ID + ETSY_REFRESH_TOKEN.
 */
async function refreshEtsyToken(): Promise<string> {
  const clientId = process.env.ETSY_CLIENT_ID!;
  const refreshToken = process.env.ETSY_REFRESH_TOKEN!;

  const res = await fetch(ETSY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Etsy token refresh failed: ${res.status} ${body}`);
  }

  const data = await res.json() as EtsyTokenResponse;
  return data.access_token;
}

/**
 * Fetch the authenticated user's first shop ID.
 * Falls back to ETSY_SHOP_ID env var if set (avoids an extra round-trip).
 */
async function getShopId(accessToken: string): Promise<number> {
  if (process.env.ETSY_SHOP_ID) {
    return parseInt(process.env.ETSY_SHOP_ID, 10);
  }

  const res = await fetch(`${ETSY_API_BASE}/users/me/shops`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": process.env.ETSY_CLIENT_ID!,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch shop: ${res.status} ${await res.text().catch(() => "")}`);
  }

  const data = await res.json() as { results?: Array<{ shop_id: number }> };
  const shopId = data.results?.[0]?.shop_id;
  if (!shopId) throw new Error("No Etsy shop found for this account.");
  return shopId;
}

/**
 * Parse a price string like "$6.00" or "$5–$8" into a single float.
 * Returns 6.00 as default if parsing fails.
 */
function parsePriceFloat(raw: string | undefined): number {
  if (!raw) return 6.0;
  // Strip currency symbols and whitespace
  const clean = raw.replace(/[^0-9.–-]/g, "");
  // If range like "5–8" or "5-8", take lower bound
  const parts = clean.split(/[–-]/);
  const val = parseFloat(parts[0]);
  return isNaN(val) || val <= 0 ? 6.0 : val;
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/create-etsy-draft
 *
 * When ETSY_CLIENT_ID + ETSY_CLIENT_SECRET + ETSY_REFRESH_TOKEN are configured,
 * this route calls the real Etsy v3 API to create a draft listing.
 * Otherwise it returns a simulated response so the UI continues to work.
 *
 * Body: { listing: GeneratedListing, taxonomyId?: number, attributes?: EtsyListingAttribute[] }
 */
export async function POST(req: NextRequest) {
  return withUsageCheck(req, "create_etsy_draft", async (_userId) => {
    const body = await req.json() as DraftBody;
    const { listing, taxonomyId, attributes = [], priceOverride } = body;

    if (!listing?.title) {
      return NextResponse.json({ error: "listing is required" }, { status: 400 });
    }

    // Etsy uses PKCE — no client_secret exists. Only need client_id + refresh_token.
    const hasEtsyOAuth =
      !!process.env.ETSY_CLIENT_ID &&
      !!process.env.ETSY_REFRESH_TOKEN;

    const price = priceOverride ?? parsePriceFloat(listing.pricing?.suggested);

    // ── Real Etsy API path ────────────────────────────────────────────────────
    if (hasEtsyOAuth) {
      try {
        const accessToken = await refreshEtsyToken();
        const shopId = await getShopId(accessToken);

        // Etsy v3 createListing body
        // https://developers.etsy.com/documentation/reference/#operation/createListing
        const etsyBody: Record<string, unknown> = {
          title: listing.title.slice(0, 140),
          description: listing.description ?? "",
          price: price,
          quantity: 999,
          who_made: "i_did",
          when_made: "made_to_order",
          taxonomy_id: taxonomyId ?? 2078, // 2078 = "Digital Downloads" root fallback
          type: "download",
          state: "draft",
          tags: (listing.tags ?? []).slice(0, 13),
          ...(attributes.length > 0 && { attributes }),
        };

        const createRes = await fetch(
          `${ETSY_API_BASE}/shops/${shopId}/listings`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "x-api-key": process.env.ETSY_CLIENT_ID!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(etsyBody),
          }
        );

        if (!createRes.ok) {
          const errBody = await createRes.text().catch(() => "");
          console.error(`[create-etsy-draft] Etsy API error ${createRes.status}:`, errBody);
          return NextResponse.json(
            {
              error: "Etsy API returned an error",
              status: createRes.status,
              detail: errBody,
            },
            { status: 502 }
          );
        }

        const created = await createRes.json() as { listing_id: number; state: string };
        const draftUrl = `https://www.etsy.com/your/listings/edit/${created.listing_id}`;

        console.log(`[create-etsy-draft] created listing ${created.listing_id} for shop ${shopId}`);

        return NextResponse.json({
          mock: false,
          listingId: created.listing_id,
          draftUrl,
          status: created.state,
          message: "Listing created as draft — review and publish on Etsy.",
          taxonomyId: etsyBody.taxonomy_id,
          attributeCount: attributes.length,
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[create-etsy-draft] OAuth/API error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // ── Mock path — simulates a successful draft creation ─────────────────────
    const mockListingId = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000);
    const mockDraftUrl = `https://www.etsy.com/your/listings/edit/${mockListingId}`;

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 800));

    return NextResponse.json({
      mock: true,
      listingId: mockListingId,
      draftUrl: mockDraftUrl,
      status: "draft",
      message: "Listing created as draft — review and publish on Etsy.",
      connectOAuthNote:
        "To push real drafts to Etsy, add ETSY_CLIENT_ID, ETSY_CLIENT_SECRET, and ETSY_REFRESH_TOKEN to your environment. See .env.local.example.",
      sentFields: {
        title: listing.title,
        description: listing.description,
        tags: listing.tags,
        price,
        quantity: 999,
        who_made: "i_did",
        when_made: "made_to_order",
        type: "download",
        state: "draft",
        taxonomy_id: taxonomyId ?? null,
        attributeCount: attributes.length,
      },
    });
  });
}
