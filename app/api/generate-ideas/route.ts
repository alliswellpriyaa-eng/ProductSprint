import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { getFallbackIdeas } from "@/data/fallbackData";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_ideas", async (_userId) => {
    const { niche, productType } = await req.json();

    if (!niche || !productType) {
      return NextResponse.json({ error: "niche and productType are required" }, { status: 400 });
    }

    const key = serverCacheKey("ideas", niche, productType);
    const cached = getServerCache<{ ideas: unknown[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-ideas] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        fallback: true,
        errorCode: "API_KEY_INVALID",
        devMessage: "GEMINI_API_KEY is missing from environment",
        ideas: getFallbackIdeas(niche),
      });
    }

    let rawText: string | undefined;
    let modelUsed = "";
    const t0 = Date.now();

    try {
      const prompt = `You are an Etsy product research expert. Generate 10 highly profitable Etsy digital product ideas.

Niche: "${niche}"
Product Type: "${productType}"

Rules for great ideas:
- Be VERY specific (not "Kids coloring book" → "Summer Road Trip Activity Binder for Kids Ages 4–7")
- Target a clear emotional buyer (busy moms, overwhelmed teachers, anxious brides)
- Include seasonality, life events, or pain points when relevant
- Focus on low-cost-to-create, high-demand digital printables
- Prioritize beginner-friendly Canva creations
- Each title should be 50–70 chars max, Etsy-search-optimized

For each idea include a REALISTIC market score based on actual Etsy trends.

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{
  "ideas": [
    {
      "title": "Summer Road Trip Activity Binder for Kids Ages 4–7",
      "description": "Keep little ones entertained on long drives with 40+ printable games, puzzles, and coloring pages.",
      "marketScore": {
        "demand": 8,
        "competition": "Medium",
        "seoOpportunity": "High",
        "trend": "Seasonal",
        "beginnerFriendly": true,
        "estimatedPriceRange": "$5–$12"
      },
      "whyThisCouldSell": "Parents search heavily for printable activities before summer road trips. Educational low-content printables consistently top Etsy summer charts."
    }
  ]
}

demand: integer 1–10 (10 = highest buyer demand)
competition: "Low" | "Medium" | "High"
seoOpportunity: "Low" | "Medium" | "High"
trend: "Rising" | "Stable" | "Seasonal"
beginnerFriendly: true | false
estimatedPriceRange: realistic Etsy price range string
whyThisCouldSell: 1–2 sentences explaining the commercial opportunity`;

      const call = await geminiCall(
        process.env.GEMINI_API_KEY,
        prompt,
        { responseMimeType: "application/json" }
      );
      rawText = call.rawText;
      modelUsed = call.modelUsed;

      const parsed = extractJson(rawText);
      const payload = { ...(parsed as object), modelUsed, responseTime: Date.now() - t0 };

      setServerCache(key, parsed);
      return NextResponse.json(payload);

    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : (raw ?? message);
      console.error(`[generate-ideas][${code}]`, devMessage);

      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage,
        rawPreview: rawText?.slice(0, 500),
        modelUsed,
        responseTime: Date.now() - t0,
        ideas: getFallbackIdeas(niche),
      });
    }
  });
}
