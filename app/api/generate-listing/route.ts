import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

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

    let rawText: string | undefined;
    let modelUsed = "";

    try {
      const prompt = `You are an expert Etsy seller copywriter. Generate a complete Etsy listing package for this digital product:

Product: "${idea}"

Create high-converting copy that:
- Uses emotional buyer language (busy parents, overwhelmed teachers, etc.)
- Includes strong keywords naturally
- Is warm, friendly, and beginner-accessible

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"etsyTitle":"Full optimized Etsy title (max 140 chars, keyword-rich, use | as separator)","description":"3–4 sentence product description that sells the transformation, not just features. Start with the buyer's pain point.","bulletPoints":["What's included bullet 1","What's included bullet 2","What's included bullet 3","What's included bullet 4","What's included bullet 5"],"thumbnailText":"Short punchy overlay text for the product thumbnail image (max 6 words, all-caps style)","canvaPrompt":"Step-by-step Canva setup: document size, color palette, font pairing, and 3 specific design tips for this exact product"}`;

      const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
      rawText = call.rawText;
      modelUsed = call.modelUsed;
      const parsed = extractJson(rawText);

      setServerCache(key, parsed);
      return NextResponse.json({ ...(parsed as object), modelUsed });

    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : (raw ?? message);
      console.error(`[generate-listing][${code}]`, devMessage);
      return NextResponse.json({ error: message, devMessage, rawPreview: rawText?.slice(0, 500), modelUsed }, { status: 500 });
    }
  });
}
