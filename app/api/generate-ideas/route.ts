import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_IDEAS } from "@/data/fallbacks";
import { getFallbackIdeas } from "@/data/fallbackData";

export const maxDuration = 60;
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import { withGeminiRetry } from "@/lib/geminiRetry";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_ideas", async (_userId) => {
    const { niche, productType } = await req.json();

    if (!niche || !productType) {
      return NextResponse.json({ error: "niche and productType are required" }, { status: 400 });
    }

    // ── Server cache check ────────────────────────────────────────────────────
    const key = serverCacheKey("ideas", niche, productType);
    const cached = getServerCache<{ ideas: typeof FALLBACK_IDEAS }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-ideas] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    // ── Missing key → fallback ────────────────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      const ideas = getFallbackIdeas(niche);
      return NextResponse.json({
        fallback: true,
        errorCode: "API_KEY_INVALID",
        devMessage: isDev ? "GEMINI_API_KEY is missing from .env.local" : undefined,
        ideas,
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // ── Prompt — explicit schema prevents malformed JSON ─────────────────────
      const prompt = `Generate 10 profitable Etsy digital product ideas for niche: "${niche}", product type: "${productType}".
Keep them specific and beginner-friendly. Each title max 60 chars, description one sentence.

Return ONLY this JSON (no markdown, no extra text):
{
  "ideas": [
    { "title": "Short product title", "description": "One sentence description." },
    { "title": "Short product title", "description": "One sentence description." }
  ]
}`;

      const result = await withGeminiRetry(
        () => model.generateContent(prompt),
        { label: "generate-ideas", delayMs: 4000 }
      );
      const text = result.response.text();
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // ── Store in server cache ─────────────────────────────────────────────────
      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      // Always log server-side (visible in Vercel function logs)
      console.error(`[generate-ideas][${code}]`, raw ?? message);

      // TEMP: devMessage always included so we can diagnose prod errors via DevTools
      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage: raw ?? message,
        ideas: getFallbackIdeas(niche),
      });
    }
  });
}
