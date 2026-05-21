import { NextRequest, NextResponse } from "next/server";
import { geminiCall } from "@/lib/geminiCall";
import { extractJson } from "@/lib/safeJson";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import type { ResearchInsight } from "@/types/research";
export type { ResearchInsight } from "@/types/research";
import {
  detectInputType,
  extractListingId,
  extractShopName,
  fetchListing,
  fetchShopListings,
  searchListings,
  formatListingForPrompt,
  type EtsyListing,
  type EtsySearchResult,
} from "@/lib/etsy";

export const maxDuration = 60;

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildResearchPrompt(
  input: string,
  listings: Array<EtsyListing | EtsySearchResult>
): string {
  const listingBlocks = listings
    .map((l, i) => `--- Listing ${i + 1} ---\n${formatListingForPrompt(l)}`)
    .join("\n\n");

  return `You are an expert Etsy market researcher. Analyze the following Etsy listing data and return deep insights in JSON.

User searched for: "${input}"

Listings to analyze:
${listingBlocks}

Return JSON matching this exact structure (no markdown, no extra text):
{
  "outlierScore": <1-10, how much opportunity exists>,
  "clickReason": "<1-2 sentences: why shoppers click these listings>",
  "buyReason": "<1-2 sentences: why shoppers convert and buy>",
  "emotionalTriggers": ["<trigger 1>", "<trigger 2>", "<trigger 3>"],
  "positioningStrategy": "<The core emotional/functional positioning angle that wins in this niche>",
  "seoPatterns": {
    "titleStructure": "<Describe the title formula these listings use>",
    "repeatedKeywords": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"],
    "tagStrategy": "<Describe how tags are structured — long-tail vs short, persona vs product, etc.>"
  },
  "thumbnailStrategy": {
    "colorPalette": "<Describe dominant colors>",
    "fontStyle": "<Describe font style and hierarchy>",
    "compositionNotes": "<Describe layout and mockup style>",
    "clickabilityScore": <1-10>
  },
  "bundleOpportunities": ["<product 1>", "<product 2>", "<product 3>"],
  "differentiationAngles": ["<angle 1>", "<angle 2>", "<angle 3>"],
  "pricingInsight": "<Observe pricing pattern and sweet spot>",
  "topListings": [
    {
      "title": "<listing title>",
      "price": "<formatted price>",
      "favorites": <number>,
      "url": "<etsy url>",
      "whyItWins": "<1 sentence why this specific listing outperforms>"
    }
  ]
}`;
}

// ─── Fallback research for when Etsy API key is missing ──────────────────────

function buildDemoInsight(input: string): ResearchInsight {
  return {
    outlierScore: 7,
    clickReason:
      "Shoppers click because the thumbnail uses high-contrast visuals with clear benefit-driven headline text that immediately communicates what they get.",
    buyReason:
      "High favorite counts and strong social proof lower purchase anxiety; the price point ($4–$9) feels low-risk for an instant download.",
    emotionalTriggers: ["organization", "stress relief", "simplicity", "productivity", "calm"],
    positioningStrategy:
      `Most listings in "${input}" compete on features. The outlier opportunity is to lead with transformation — not what the product IS but how it makes the buyer FEEL after using it.`,
    seoPatterns: {
      titleStructure: "[Product Type] | [Benefit/Persona] | [Format] | [Style Adjective]",
      repeatedKeywords: ["printable", "instant download", "digital download", "planner pdf", input.toLowerCase()],
      tagStrategy:
        "Mix of high-volume broad tags (planner, printable) with specific long-tail buyer intent tags (minimalist planner for moms, adhd daily planner printable).",
    },
    thumbnailStrategy: {
      colorPalette: "Soft neutrals (cream, sage, terracotta) with one bold accent color",
      fontStyle: "Clean sans-serif for body, bold modern serif or script for headline",
      compositionNotes: "Flat-lay mockup on styled desk or tablet mockup, with 2–3 product page previews visible",
      clickabilityScore: 7,
    },
    bundleOpportunities: [
      `${input} + weekly/monthly planner bundle`,
      `${input} + affirmation card set`,
      `${input} + habit tracker + goal setting worksheet`,
    ],
    differentiationAngles: [
      "Add a 'how to use' page and brand it as a complete system, not just a product",
      "Target a specific persona in the title (e.g. 'for moms', 'ADHD-friendly', 'minimalist')",
      "Include editable Canva template link — competitors mostly sell static PDFs",
    ],
    pricingInsight:
      "Top sellers price between $4–$9 for single products, $12–$18 for bundles. The $6–$7 sweet spot maximises impulse purchase conversion.",
    topListings: [
      {
        title: `[Demo] ${input} Printable — Add your ETSY_API_KEY to see real listings`,
        price: "USD 6.00",
        favorites: 2847,
        url: "https://etsy.com",
        whyItWins: "Strong benefit-focused title + styled flat-lay thumbnail that shows the product in use",
      },
    ],
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "research_listing", async (_userId) => {
    const { input } = await req.json() as { input?: string };
    if (!input?.trim()) {
      return NextResponse.json({ error: "input is required" }, { status: 400 });
    }

    const normalizedInput = input.trim();
    const cacheKey = serverCacheKey("research", normalizedInput);
    const cached = getServerCache<ResearchInsight>(cacheKey);
    if (cached) {
      return NextResponse.json({ insight: cached, cached: true });
    }

    const etsyApiKey = process.env.ETSY_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // No Etsy API key — return demo insight with explanation
    if (!etsyApiKey) {
      const demoInsight = buildDemoInsight(normalizedInput);
      return NextResponse.json({
        insight: demoInsight,
        demo: true,
        demoMessage: "Add ETSY_API_KEY to your environment to enable live Etsy listing research.",
      });
    }

    // Fetch real listing data
    const inputType = detectInputType(normalizedInput);
    let listings: Array<EtsyListing | EtsySearchResult> = [];

    if (inputType === "listing_url") {
      const listingId = extractListingId(normalizedInput);
      if (listingId) {
        const listing = await fetchListing(etsyApiKey, listingId);
        if (listing) listings = [listing];
        // Also search for similar listings using the first 3 words of the title
        if (listing) {
          const keywords = listing.title.split(" ").slice(0, 3).join(" ");
          const similar = await searchListings(etsyApiKey, keywords, 4);
          listings = [listing, ...similar.filter((s) => s.listing_id !== listingId).slice(0, 3)];
        }
      }
    } else if (inputType === "shop_url") {
      const shopName = extractShopName(normalizedInput);
      if (shopName) {
        listings = await fetchShopListings(etsyApiKey, shopName, 5);
      }
    } else {
      // keyword
      listings = await searchListings(etsyApiKey, normalizedInput, 5);
    }

    if (listings.length === 0) {
      // Etsy API returned no results (bad key, rate limit, or no matches).
      // Fall back to demo mode so the UI still works.
      console.warn(`[research-listing] Etsy returned 0 listings for "${normalizedInput}" — falling back to demo`);
      const inputType2 = detectInputType(normalizedInput);
      const demoMsg = inputType2 === "shop_url"
        ? "Couldn't fetch live shop data — showing AI-generated example insights. Try pasting a keyword like \"wedding planner printable\" instead."
        : inputType2 === "listing_url"
          ? "Couldn't fetch that listing — it may be private or removed. Try a keyword instead."
          : "No Etsy listings found for this keyword. Try a different search term, or check that your ETSY_API_KEY is valid.";
      return NextResponse.json({
        insight: buildDemoInsight(normalizedInput),
        demo: true,
        demoMessage: demoMsg,
      });
    }

    if (!geminiApiKey) {
      const demoInsight = buildDemoInsight(normalizedInput);
      return NextResponse.json({
        insight: demoInsight,
        demo: true,
        demoMessage: "Add GEMINI_API_KEY to enable AI analysis.",
      });
    }

    // AI analysis
    const prompt = buildResearchPrompt(normalizedInput, listings);

    try {
      const { rawText } = await geminiCall(
        geminiApiKey,
        prompt,
        { responseMimeType: "application/json", maxOutputTokens: 2048, temperature: 0.3 },
        { models: ["gemini-2.5-flash-lite", "gemini-2.5-flash"], timeoutMs: 20_000 }
      );

      const parsed = extractJson<ResearchInsight>(rawText);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid AI response");
      }

      // Merge real listing URLs into topListings if AI hallucinated
      const insight = parsed as ResearchInsight;
      if (Array.isArray(insight.topListings)) {
        insight.topListings = insight.topListings.map((tl, i) => ({
          ...tl,
          url: listings[i]?.url ?? tl.url,
          favorites: listings[i]?.num_favorers ?? tl.favorites,
        }));
      }

      setServerCache(cacheKey, insight, CACHE_TTL);
      return NextResponse.json({ insight, cached: false });

    } catch (err) {
      console.error("[research-listing] Gemini error:", err instanceof Error ? err.message : err);
      // Graceful degradation — return demo
      return NextResponse.json({
        insight: buildDemoInsight(normalizedInput),
        demo: true,
        demoMessage: "AI analysis temporarily unavailable. Showing example insights.",
      });
    }
  });
}
