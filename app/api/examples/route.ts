import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { FALLBACK_EXAMPLES } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";

export const maxDuration = 60;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_seo", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...FALLBACK_EXAMPLES });
    }

    let rawText: string | undefined;

    try {
      const prompt = `Generate realistic Etsy listing examples for this digital product: "${idea}".

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"titles":["Example title 1 | With Keywords | Printable PDF","Example title 2 | Instant Download"],"priceRange":"$3.99 – $7.99","includes":["item 1","item 2","item 3","item 4"],"sellerTip":"One sentence tip for standing out as a seller."}`;

      const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
      rawText = call.rawText;
      return NextResponse.json(extractJson(rawText));

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[examples][${code}]`, error instanceof Error ? error.message : message);
      return NextResponse.json({ fallback: true, errorCode: code, devMessage: error instanceof Error ? error.message : message, rawPreview: rawText?.slice(0, 500), ...FALLBACK_EXAMPLES });
    }
  });
}
