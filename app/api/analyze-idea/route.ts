import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { FALLBACK_ANALYSIS } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_ideas", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("analysis", idea);
    const cached = getServerCache(key);
    if (cached) {
      if (isDev) console.log(`[analyze-idea] cache HIT`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...FALLBACK_ANALYSIS });
    }

    let rawText: string | undefined;

    try {
      const prompt = `Rate this Etsy digital product for a beginner seller: "${idea}".

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"demand":"High","competition":"Medium","potential":"High","audience":"short description","difficulty":"Easy"}

demand/competition/potential: "High" | "Medium" | "Low"
difficulty: "Easy" | "Medium" | "Hard"`;

      const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
      rawText = call.rawText;
      const parsed = extractJson(rawText);

      setServerCache(key, parsed);
      return NextResponse.json(parsed);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[analyze-idea][${code}]`, error instanceof Error ? error.message : message);
      return NextResponse.json({ fallback: true, errorCode: code, devMessage: error instanceof Error ? error.message : message, rawPreview: rawText?.slice(0, 500), ...FALLBACK_ANALYSIS });
    }
  });
}
