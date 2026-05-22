import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import { validateTags, tagBucketPromptBlock } from "@/lib/tagValidation";
import {
  fetchTaxonomyNodes,
  fetchTaxonomyProperties,
  flattenTaxonomy,
  resolveCategoryPath,
} from "@/lib/etsy";
import { fillAttributes } from "@/lib/fillAttributes";

export const maxDuration = 60;

const TTL_4H = 4 * 60 * 60 * 1000;
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;

function buildPackPrompt(idea: string): string {
  return `You are an expert Etsy seller and digital product marketer. Generate a complete Etsy Export Pack for this product idea:

Product: "${idea}"

CRITICAL: Return ONLY valid JSON, no markdown fences, no comments, directly parseable by JSON.parse().

Return exactly this structure:
{
  "seoTitle": "Etsy-optimized listing title under 140 characters, keyword-rich, use | as separator",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13"],
  "description": "Full Etsy listing description of 150-200 words. CRITICAL SEO RULE: The very first sentence (the first ~160 characters Etsy indexes for search ranking) must be a natural prose sentence that organically includes your 2-3 most important search keywords — do NOT begin with bullets, emoji, or section headers. After that opening sentence, use formatting freely. Start with buyer pain point, sell the transformation, list what is included, end with a clear call to action. Warm and friendly tone.",
  "pricing": "$X–$Y recommended price range for this digital product",
  "categoryHint": "Etsy seller taxonomy path for this product, e.g. 'Digital Downloads > Calendars & Planners' or 'Digital Downloads > Patterns > Sewing Patterns'",
  "canvaInstructions": "Step-by-step Canva design instructions: document size, colour palette (3 hex codes), font pairing, layout tips, and 3 specific design tips for this exact product type.",
  "thumbnailText": "Short punchy overlay text for product thumbnail (max 6 words, all-caps style)",
  "pinterestTitle": "Pinterest pin title optimised for Pinterest SEO (max 100 characters)",
  "pinterestDescription": "Pinterest pin description with natural keywords for this product (150-200 characters)",
  "reelCaption": "Short Instagram/TikTok caption with a strong hook under 150 characters including 3-5 relevant hashtags",
  "launchChecklist": ["Launch step 1","Launch step 2","Launch step 3","Launch step 4","Launch step 5","Launch step 6","Launch step 7"]
}

TAG RULES — follow exactly:
${tagBucketPromptBlock()}
- Each tag must be 20 characters or fewer (hard limit)
- Use real buyer search terms, no punctuation, no special characters

Rules for launchChecklist: 5 to 7 actionable steps a beginner Etsy seller should take on launch day.`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_etsy_pack", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("etsy_pack", idea);
    const cached = getServerCache<object>(key);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const etsyApiKey = process.env.ETSY_API_KEY;
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { fallback: true, errorCode: "API_KEY_INVALID", devMessage: "GEMINI_API_KEY is not set" },
        { status: 500 }
      );
    }

    let rawText: string | undefined;
    let modelUsed = "";
    const startTime = Date.now();

    try {
      const prompt = buildPackPrompt(idea);

      const call = await geminiCall(
        process.env.GEMINI_API_KEY,
        prompt,
        { responseMimeType: "application/json" },
        { models: MODELS }
      );
      rawText = call.rawText;
      modelUsed = call.modelUsed;

      const parsed = extractJson(rawText) as Record<string, unknown>;

      // ── Validate and sanitise tags ──────────────────────────────────────────
      if (Array.isArray(parsed.tags)) {
        const { valid } = validateTags(parsed.tags as string[]);
        parsed.tags = valid;
      }

      // ── Taxonomy resolution (runs in parallel with response prep) ───────────
      let taxonomyId: number | null = null;
      let attributes: ReturnType<typeof fillAttributes> = [];

      if (etsyApiKey) {
        try {
          const categoryHint = typeof parsed.categoryHint === "string" ? parsed.categoryHint : undefined;
          if (categoryHint) {
            const nodes = await fetchTaxonomyNodes(etsyApiKey);
            const flat = flattenTaxonomy(nodes);
            const node = resolveCategoryPath(flat, categoryHint);

            if (node) {
              taxonomyId = node.id;
              const properties = await fetchTaxonomyProperties(etsyApiKey, node.id);

              // Build product context from the generated pack
              const context = {
                title: typeof parsed.seoTitle === "string" ? parsed.seoTitle : idea,
                tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : [],
                description: typeof parsed.description === "string" ? parsed.description : "",
              };
              attributes = fillAttributes(properties, context);
            }
          }
        } catch (taxErr) {
          console.warn("[generate-etsy-pack] taxonomy resolution failed (non-fatal):", taxErr);
        }
      }

      const responseTime = Date.now() - startTime;

      // Include taxonomy data in the response; strip the internal categoryHint hint
      const output = {
        ...parsed,
        taxonomyId,
        attributes,
        modelUsed,
      };

      setServerCache(key, output, TTL_4H);

      console.log({
        route: "generate-etsy-pack",
        model: modelUsed,
        responseTime,
        success: true,
        fallback: false,
        taxonomyId,
        attributeCount: attributes.length,
      });

      return NextResponse.json({
        ...output,
        rawPreview: rawText.slice(0, 200),
        responseTime,
      });
    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : (raw ?? message);
      const responseTime = Date.now() - startTime;

      console.log({ route: "generate-etsy-pack", model: modelUsed, responseTime, success: false, fallback: true });
      console.error(`[generate-etsy-pack][${code}]`, devMessage);

      return NextResponse.json(
        { fallback: true, errorCode: code, devMessage, rawPreview: rawText?.slice(0, 500), modelUsed, responseTime },
        { status: 500 }
      );
    }
  });
}
