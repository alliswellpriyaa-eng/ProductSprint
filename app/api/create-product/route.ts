import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_PRODUCT } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "create_product", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    // ── Server cache check ────────────────────────────────────────────────
    const key = serverCacheKey("product", idea);
    const cached = getServerCache(key);
    if (cached) {
      if (isDev) console.log(`[create-product] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...FALLBACK_PRODUCT });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // ── Optimised prompt ────────────────────────────────────────────────
      const prompt = `How to create this Etsy digital product for a beginner: "${idea}".
Return ONLY JSON:
{ "pages": ["Page 1: ...", "Page 2: ...", "Page 3: ...", "Page 4: ...", "Page 5: ..."], "size": "US Letter (8.5×11 in)", "orientation": "Portrait", "style": "Minimal & Clean", "tips": ["tip 1","tip 2","tip 3","tip 4","tip 5"] }`;

      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[create-product][${code}]`, message);
      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage: isDev ? message : undefined,
        ...FALLBACK_PRODUCT,
      });
    }
  });
}
