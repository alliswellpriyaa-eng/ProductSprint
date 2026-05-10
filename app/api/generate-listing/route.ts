import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import { withGeminiRetry } from "@/lib/geminiRetry";

export const maxDuration = 60;

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_listing", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("listing", idea);
    const cached = getServerCache<object>(key);
    if (cached) {
      if (isDev) console.log(`[generate-listing] cache HIT`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const prompt = `You are an expert Etsy seller copywriter. Generate a complete Etsy listing package for this digital product:

Product: "${idea}"

Create high-converting copy that:
- Uses emotional buyer language (busy parents, overwhelmed teachers, etc.)
- Includes strong keywords naturally
- Is warm, friendly, and beginner-accessible

Return ONLY this JSON:
{
  "etsyTitle": "Full optimized Etsy title (max 140 chars, keyword-rich, use | as separator)",
  "description": "3–4 sentence product description that sells the transformation, not just features. Start with the buyer's pain point.",
  "bulletPoints": ["What's included bullet 1", "What's included bullet 2", "What's included bullet 3", "What's included bullet 4", "What's included bullet 5"],
  "thumbnailText": "Short punchy overlay text for the product thumbnail image (max 6 words, all-caps style)",
  "canvaPrompt": "Step-by-step Canva setup: document size, color palette, font pairing, and 3 specific design tips for this exact product"
}`;

      const result = await withGeminiRetry(
        () => model.generateContent(prompt),
        { label: "generate-listing", delayMs: 3000 }
      );
      const text = result.response.text();
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      console.error(`[generate-listing][${code}]`, raw ?? message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
