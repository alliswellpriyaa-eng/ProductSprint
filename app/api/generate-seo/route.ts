import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_SEO_TITLES } from "@/data/fallbacks";
import { getFallbackSeoTitles } from "@/data/fallbackData";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import { withGeminiRetry } from "@/lib/geminiRetry";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_seo", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    // ── Server cache check ──────────────────────────────────────────────────
    const key = serverCacheKey("seo", idea);
    const cached = getServerCache<{ titles: string[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-seo] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        fallback: true,
        errorCode: "API_KEY_INVALID",
        devMessage: isDev ? "GEMINI_API_KEY is missing from .env.local" : undefined,
        titles: getFallbackSeoTitles(idea),
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // ── Prompt — explicit schema prevents malformed JSON ─────────────────────
      const prompt = `Generate 3 high-converting Etsy SEO titles for: "${idea}".
Rules: under 140 chars each, include keywords buyers search, use " | " separators, add "Printable PDF" or "Instant Download" where natural.

Return ONLY this JSON (no markdown, no extra text):
{
  "titles": [
    "Title one here",
    "Title two here",
    "Title three here"
  ]
}`;

      const result = await withGeminiRetry(
        () => model.generateContent(prompt),
        { label: "generate-seo", delayMs: 4000 }
      );
      const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[generate-seo][${code}]`, message);
      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage: isDev ? message : undefined,
        titles: getFallbackSeoTitles(idea),
      });
    }
  });
}
