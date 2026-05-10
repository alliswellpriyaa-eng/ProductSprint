import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { getFallbackIdeas } from "@/data/fallbackData";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import { withGeminiRetry } from "@/lib/geminiRetry";

export const maxDuration = 60;

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_ideas", async (_userId) => {
    const { niche, productType } = await req.json();

    if (!niche || !productType) {
      return NextResponse.json({ error: "niche and productType are required" }, { status: 400 });
    }

    // ── Server cache check ────────────────────────────────────────────────────
    const key = serverCacheKey("ideas", niche, productType);
    const cached = getServerCache<{ ideas: unknown[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-ideas] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    // ── Missing key → fallback ────────────────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        fallback: true,
        errorCode: "API_KEY_INVALID",
        devMessage: isDev ? "GEMINI_API_KEY is missing from .env.local" : undefined,
        ideas: getFallbackIdeas(niche),
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // ── Upgraded prompt: specific, emotional, with market data ───────────────
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

Return ONLY this JSON (no markdown, no extra text):
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

      const result = await withGeminiRetry(
        () => model.generateContent(prompt),
        { label: "generate-ideas", delayMs: 4000 }
      );
      const text = result.response.text();
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      console.error(`[generate-ideas][${code}]`, raw ?? message);

      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage: raw ?? message,
        ideas: getFallbackIdeas(niche),
      });
    }
  });
}
