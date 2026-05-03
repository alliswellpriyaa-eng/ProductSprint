import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_TAGS } from "@/data/fallbacks";
import { getFallbackTags } from "@/data/fallbackData";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_tags", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    // ── Server cache check ──────────────────────────────────────────────────
    const key = serverCacheKey("tags", idea);
    const cached = getServerCache<{ tags: string[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-tags] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        fallback: true,
        errorCode: "API_KEY_INVALID",
        devMessage: isDev ? "GEMINI_API_KEY is missing from .env.local" : undefined,
        tags: getFallbackTags(idea),
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // ── Prompt — explicit schema prevents malformed JSON ─────────────────────
      const prompt = `Generate exactly 13 Etsy tags for: "${idea}".
Rules: each tag 20 characters or fewer, mix broad and specific buyer keywords, include "printable", "pdf", "digital" variations.

Return ONLY this JSON (no markdown, no extra text):
{
  "tags": ["tag one","tag two","tag three","tag four","tag five","tag six","tag seven","tag eight","tag nine","tag ten","tag eleven","tag twelve","tag thirteen"]
}`;

      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.tags && Array.isArray(parsed.tags)) {
        parsed.tags = parsed.tags.map((tag: string) =>
          tag.length > 20 ? tag.substring(0, 20) : tag
        );
      }

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[generate-tags][${code}]`, message);
      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage: isDev ? message : undefined,
        tags: getFallbackTags(idea),
      });
    }
  });
}
