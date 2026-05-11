import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { FALLBACK_PRODUCT } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "create_product", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("product", idea);
    const cached = getServerCache(key);
    if (cached) {
      if (isDev) console.log(`[create-product] cache HIT`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...FALLBACK_PRODUCT });
    }

    let rawText: string | undefined;

    try {
      const prompt = `How to create this Etsy digital product for a beginner: "${idea}".

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"pages":["Page 1: ...","Page 2: ...","Page 3: ...","Page 4: ...","Page 5: ..."],"size":"US Letter (8.5×11 in)","orientation":"Portrait","style":"Minimal & Clean","tips":["tip 1","tip 2","tip 3","tip 4","tip 5"]}`;

      const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
      rawText = call.rawText;
      const parsed = extractJson(rawText);

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[create-product][${code}]`, error instanceof Error ? error.message : message);
      return NextResponse.json({ fallback: true, errorCode: code, devMessage: error instanceof Error ? error.message : message, rawPreview: rawText?.slice(0, 500), ...FALLBACK_PRODUCT });
    }
  });
}
