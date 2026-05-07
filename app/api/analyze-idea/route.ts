import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";

export const maxDuration = 60;
import { FALLBACK_ANALYSIS } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  // analyze-idea is non-critical; share the generate_ideas quota
  return withUsageCheck(req, "generate_ideas", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    // ── Server cache check ────────────────────────────────────────────────
    const key = serverCacheKey("analysis", idea);
    const cached = getServerCache(key);
    if (cached) {
      if (isDev) console.log(`[analyze-idea] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...FALLBACK_ANALYSIS });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // ── Optimised prompt ────────────────────────────────────────────────
      const prompt = `Rate this Etsy digital product for a beginner seller: "${idea}".
Return ONLY JSON:
{ "demand": "High"|"Medium"|"Low", "competition": "High"|"Medium"|"Low", "potential": "High"|"Medium"|"Low", "audience": "short description", "difficulty": "Easy"|"Medium"|"Hard" }`;

      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[analyze-idea][${code}]`, message);
      return NextResponse.json({ fallback: true, errorCode: code, ...FALLBACK_ANALYSIS });
    }
  });
}
