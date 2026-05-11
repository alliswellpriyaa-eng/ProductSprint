import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { getFallbackTags } from "@/data/fallbackData";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_tags", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("tags", idea);
    const cached = getServerCache<{ tags: string[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-tags] cache HIT`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", tags: getFallbackTags(idea) });
    }

    let rawText: string | undefined;
    let modelUsed = "";

    try {
      const prompt = `Generate exactly 13 Etsy tags for: "${idea}".
Rules: each tag 20 characters or fewer, mix broad and specific buyer keywords, include "printable", "pdf", "digital" variations.

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"tags":["tag one","tag two","tag three","tag four","tag five","tag six","tag seven","tag eight","tag nine","tag ten","tag eleven","tag twelve","tag thirteen"]}`;

      const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
      rawText = call.rawText;
      modelUsed = call.modelUsed;

      const parsed = extractJson<{ tags: string[] }>(rawText);
      if (parsed.tags && Array.isArray(parsed.tags)) {
        parsed.tags = parsed.tags.map((tag: string) => tag.length > 20 ? tag.substring(0, 20) : tag);
      }

      setServerCache(key, parsed);
      return NextResponse.json({ ...parsed, modelUsed });

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : message;
      console.error(`[generate-tags][${code}]`, devMessage);
      return NextResponse.json({ fallback: true, errorCode: code, devMessage, rawPreview: rawText?.slice(0, 500), tags: getFallbackTags(idea) });
    }
  });
}
