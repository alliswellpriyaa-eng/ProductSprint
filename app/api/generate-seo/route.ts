import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { getFallbackSeoTitles } from "@/data/fallbackData";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_seo", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("seo", idea);
    const cached = getServerCache<{ titles: string[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-seo] cache HIT`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", titles: getFallbackSeoTitles(idea) });
    }

    let rawText: string | undefined;
    let modelUsed = "";

    try {
      const prompt = `Generate 3 high-converting Etsy SEO titles for: "${idea}".
Rules: under 140 chars each, include keywords buyers search, use " | " separators, add "Printable PDF" or "Instant Download" where natural.

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"titles":["Title one here","Title two here","Title three here"]}`;

      const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
      rawText = call.rawText;
      modelUsed = call.modelUsed;

      const parsed = extractJson(rawText);
      setServerCache(key, parsed);
      return NextResponse.json({ ...(parsed as object), modelUsed });

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : message;
      console.error(`[generate-seo][${code}]`, devMessage);
      return NextResponse.json({ fallback: true, errorCode: code, devMessage, rawPreview: rawText?.slice(0, 500), titles: getFallbackSeoTitles(idea) });
    }
  });
}
