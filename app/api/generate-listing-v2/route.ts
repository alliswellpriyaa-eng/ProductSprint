import { NextRequest, NextResponse } from "next/server";
import { geminiCall } from "@/lib/geminiCall";
import { extractJson } from "@/lib/safeJson";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import type { ResearchInsight, GeneratedListing } from "@/types/research";
export type { GeneratedListing } from "@/types/research";

export const maxDuration = 60;

const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(
  researchInput: string,
  insight: ResearchInsight,
  userAngle?: string
): string {
  const triggers = insight.emotionalTriggers.join(", ");
  const angles = insight.differentiationAngles.join("\n- ");
  const seoKeywords = insight.seoPatterns.repeatedKeywords.join(", ");

  return `You are an expert Etsy listing copywriter. Based on competitor research, create an ORIGINAL and DIFFERENTIATED listing.

RESEARCH CONTEXT — "${researchInput}":
- Positioning strategy: ${insight.positioningStrategy}
- Emotional triggers that win: ${triggers}
- SEO keywords used by top sellers: ${seoKeywords}
- Title formula competitors use: ${insight.seoPatterns.titleStructure}
- How to beat them:
  - ${angles}
- Pricing insight: ${insight.pricingInsight}
- Thumbnail color palette: ${insight.thumbnailStrategy.colorPalette}
${userAngle ? `\nUser's specific differentiation angle: ${userAngle}` : ""}

RULES:
- NEVER copy competitor titles directly
- Lead with transformation/emotion, not just product features
- Title must be under 140 characters and SEO-rich
- Each tag must be under 20 characters
- Description must be conversion-focused, human-sounding, NOT generic AI
- Include emotional language from the triggers above
- FAQ must address real buyer hesitations

Return ONLY valid JSON matching this structure exactly:
{
  "title": "<etsy title under 140 chars, keyword-rich, benefit-led>",
  "tags": ["<tag1>","<tag2>","<tag3>","<tag4>","<tag5>","<tag6>","<tag7>","<tag8>","<tag9>","<tag10>","<tag11>","<tag12>","<tag13>"],
  "description": "<full etsy description, 200-350 words, use line breaks, include what's included, who it's for, transformation promise, instant download CTA>",
  "faq": [
    {"question": "<buyer question 1>", "answer": "<clear answer>"},
    {"question": "<buyer question 2>", "answer": "<clear answer>"},
    {"question": "<buyer question 3>", "answer": "<clear answer>"}
  ],
  "pricing": {
    "suggested": "<e.g. $6.00>",
    "reasoning": "<1-2 sentences on why this price>">
  },
  "bundleIdeas": ["<bundle 1>", "<bundle 2>", "<bundle 3>"],
  "thumbnailTextIdeas": ["<overlay text option 1>", "<overlay text option 2>", "<overlay text option 3>"],
  "mockupIdeas": ["<canva mockup idea 1>", "<canva mockup idea 2>", "<canva mockup idea 3>"],
  "emotionalHook": "<1-2 sentence hook for social media or opening of description>",
  "differentiator": "<1 sentence — what makes this listing stand out vs competitors>",
  "pinterestPin": {
    "title": "<pinterest pin title>",
    "description": "<2-3 sentences for pin description>",
    "hashtags": ["<hashtag1>","<hashtag2>","<hashtag3>","<hashtag4>","<hashtag5>"]
  }
}`;
}

// ─── Fallback listing for when Gemini is unavailable ─────────────────────────

function buildFallbackListing(researchInput: string, insight: ResearchInsight): GeneratedListing {
  const kw = insight.seoPatterns.repeatedKeywords[0] ?? researchInput;
  return {
    title: `${researchInput} Printable PDF | Instant Download | Digital Planner for Beginners`,
    tags: insight.seoPatterns.repeatedKeywords
      .slice(0, 13)
      .map((t) => t.slice(0, 20)),
    description: `Feeling overwhelmed? This ${researchInput} was designed to bring you clarity and calm in minutes.\n\n✅ What's Included:\n• Beautifully designed printable PDF\n• US Letter + A4 sizes\n• Instant download — no waiting\n\n🎯 Perfect for:\nAnyone who wants ${insight.emotionalTriggers[0] ?? "organization"} and ${insight.emotionalTriggers[1] ?? "simplicity"} without the overwhelm.\n\n💛 How it works:\nDownload → Print or use digitally → Start immediately.\n\n📥 INSTANT DOWNLOAD — No physical item is shipped.\n\nQuestions? Message me anytime. Happy creating! ✨`,
    faq: [
      { question: "Is this a physical product?", answer: "No — this is a digital download. You'll receive a PDF file immediately after purchase." },
      { question: "What size is it?", answer: "Includes both US Letter (8.5×11\") and A4 formats so it prints perfectly worldwide." },
      { question: "Can I use this commercially?", answer: "This is for personal use only. For commercial licenses please message me." },
    ],
    pricing: { suggested: "$6.00", reasoning: insight.pricingInsight },
    bundleIdeas: insight.bundleOpportunities,
    thumbnailTextIdeas: [`${researchInput.toUpperCase()} PRINTABLE`, `Instant Download`, `Beautifully Designed`],
    mockupIdeas: [
      `Flat-lay on ${insight.thumbnailStrategy.colorPalette} background with coffee and plant`,
      `iPad mockup showing 2 pages of the product`,
      `Styled desk scene with the printed version`,
    ],
    emotionalHook: `${insight.emotionalTriggers[0] ? `Finally feel ${insight.emotionalTriggers[0]}` : "Take back control of your day"} — without spending hours setting it up.`,
    differentiator: insight.differentiationAngles[0] ?? "Designed with a specific persona in mind, not generic.",
    pinterestPin: {
      title: `${researchInput} Printable — ${insight.emotionalTriggers[0] ?? "Stay Organized"} with This Instant Download`,
      description: `Looking for a ${kw}? This beautifully designed printable helps you ${insight.emotionalTriggers[0] ?? "stay on track"} every single day. Instant download, print at home or use digitally.`,
      hashtags: [`#${kw.replace(/\s+/g, "")}`, "#etsyprintable", "#instantdownload", "#digitalplanner", "#printableplanner"],
    },
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_listing_v2", async (_userId) => {
    const body = await req.json() as {
      researchInput?: string;
      insight?: ResearchInsight;
      userAngle?: string;
    };

    const { researchInput, insight, userAngle } = body;
    if (!researchInput || !insight) {
      return NextResponse.json({ error: "researchInput and insight are required" }, { status: 400 });
    }

    const cacheKey = serverCacheKey("listing-v2", researchInput, userAngle ?? "");
    const cached = getServerCache<GeneratedListing>(cacheKey);
    if (cached) return NextResponse.json({ listing: cached, cached: true });

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({
        listing: buildFallbackListing(researchInput, insight),
        fallback: true,
      });
    }

    const prompt = buildPrompt(researchInput, insight, userAngle);

    try {
      const { rawText, modelUsed } = await geminiCall(
        geminiApiKey,
        prompt,
        { responseMimeType: "application/json", maxOutputTokens: 2048, temperature: 0.6 },
        { models: ["gemini-2.5-flash", "gemini-2.5-flash-lite"], timeoutMs: 20_000 }
      );

      const parsed = extractJson<GeneratedListing>(rawText);
      if (!parsed || !parsed.title) throw new Error("Invalid listing response");

      // Enforce tag length ≤20 chars
      if (Array.isArray(parsed.tags)) {
        parsed.tags = parsed.tags.map((t) => t.slice(0, 20));
      }

      // Enforce title length ≤140 chars
      if (parsed.title.length > 140) {
        parsed.title = parsed.title.slice(0, 137) + "...";
      }

      setServerCache(cacheKey, parsed, CACHE_TTL);
      console.log({ route: "generate-listing-v2", model: modelUsed, success: true });
      return NextResponse.json({ listing: parsed, cached: false });

    } catch (err) {
      console.error("[generate-listing-v2]", err instanceof Error ? err.message : err);
      return NextResponse.json({
        listing: buildFallbackListing(researchInput, insight),
        fallback: true,
      });
    }
  });
}
