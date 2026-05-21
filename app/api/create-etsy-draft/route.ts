import { NextRequest, NextResponse } from "next/server";
import { withUsageCheck } from "@/lib/apiAuth";
import type { GeneratedListing } from "@/types/research";

export const maxDuration = 30;

/**
 * POST /api/create-etsy-draft
 *
 * When ETSY_CLIENT_ID + ETSY_CLIENT_SECRET + ETSY_REFRESH_TOKEN are configured,
 * this route will call the real Etsy v3 API to create a draft listing.
 *
 * Until then it returns a simulated response so the UI can be built and tested.
 */
export async function POST(req: NextRequest) {
  return withUsageCheck(req, "create_etsy_draft", async (_userId) => {
    const { listing } = await req.json() as { listing?: GeneratedListing };
    if (!listing?.title) {
      return NextResponse.json({ error: "listing is required" }, { status: 400 });
    }

    const hasEtsyOAuth =
      !!process.env.ETSY_CLIENT_ID &&
      !!process.env.ETSY_CLIENT_SECRET &&
      !!process.env.ETSY_REFRESH_TOKEN;

    if (hasEtsyOAuth) {
      // ── Real Etsy API path (when credentials are configured) ──────────────
      // Step 1: Exchange refresh token for access token
      // Step 2: POST to /v3/application/shops/{shop_id}/listings
      // Step 3: Return the draft listing URL
      //
      // This is scaffolded but not yet wired because ETSY_CLIENT_ID is not set.
      // See: https://developers.etsy.com/documentation/reference/#operation/createListing
      return NextResponse.json({
        error: "Real Etsy OAuth flow not yet wired. Remove credentials or complete OAuth setup.",
      }, { status: 501 });
    }

    // ── Mock path — simulates a successful draft creation ─────────────────────
    // In production this would be the real Etsy listing ID returned by the API.
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
      // Echo back what would have been sent to the Etsy API
      sentFields: {
        title: listing.title,
        description: listing.description,
        tags: listing.tags,
        price: listing.pricing?.suggested ?? "$6.00",
        quantity: 999,
        who_made: "i_did",
        when_made: "made_to_order",
        is_digital: true,
        state: "draft",
      },
    });
  });
}
