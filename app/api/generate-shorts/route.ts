import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;

const TTL_4H = 4 * 60 * 60 * 1000;
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_shorts", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("shorts", idea);
    const cached = getServerCache<object>(key);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { fallback: true, errorCode: "API_KEY_INVALID", devMessage: "GEMINI_API_KEY is not set" },
        { status: 500 }
      );
    }

    let rawText: string | undefined;
    let modelUsed = "";
    const startTime = Date.now();

    try {
      const prompt = `You are an expert short-form video content creator who helps Etsy sellers go viral on Instagram Reels and TikTok. Generate a complete Short Content Pack for this product idea:

Product: "${idea}"

CRITICAL: Return ONLY valid JSON, no markdown fences, no comments, directly parseable by JSON.parse().

Return exactly this structure:
{
  "hook": "Attention-grabbing first line spoken directly to camera, max 15 words. Example style: 'I used AI to create this Etsy printable in 15 minutes.'",
  "script": "Full 30-45 second script for an Instagram Reel or TikTok. Include natural pauses with [pause], on-screen text cues with [TEXT: ...], and a strong ending. Write it as spoken word.",
  "caption": "Short engaging post caption under 150 characters with a curiosity hook or value statement",
  "hashtags": ["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5","#hashtag6","#hashtag7","#hashtag8","#hashtag9","#hashtag10"],
  "cta": "End-of-video call to action, max 10 words, direct and action-oriented"
}

Rules for hashtags: exactly 10 hashtags mixing niche (#etsyseller, #digitalprintables) with broad (#sidehustle, #makemoneyonline).
Rules for script: keep it conversational, energetic, and relatable to a beginner Etsy seller.`;

      const call = await geminiCall(
        process.env.GEMINI_API_KEY,
        prompt,
        { responseMimeType: "application/json" },
        { models: MODELS }
      );
      rawText = call.rawText;
      modelUsed = call.modelUsed;

      const parsed = extractJson(rawText);
      const responseTime = Date.now() - startTime;

      setServerCache(key, { ...(parsed as object), modelUsed }, TTL_4H);

      console.log({ route: "generate-shorts", model: modelUsed, responseTime, success: true, fallback: false });

      return NextResponse.json({
        ...(parsed as object),
        modelUsed,
        rawPreview: rawText.slice(0, 200),
        responseTime,
      });
    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : (raw ?? message);
      const responseTime = Date.now() - startTime;

      console.log({ route: "generate-shorts", model: modelUsed, responseTime, success: false, fallback: true });
      console.error(`[generate-shorts][${code}]`, devMessage);

      return NextResponse.json(
        { fallback: true, errorCode: code, devMessage, rawPreview: rawText?.slice(0, 500), modelUsed, responseTime },
        { status: 500 }
      );
    }
  });
}
