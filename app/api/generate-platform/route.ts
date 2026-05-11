import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { FALLBACK_GUMROAD, FALLBACK_SHOPIFY } from "@/data/fallbacks";

export const maxDuration = 60;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  const { idea, platform } = await req.json();

  if (!idea || !platform) return NextResponse.json({ error: "idea and platform are required" }, { status: 400 });
  if (!["gumroad", "shopify"].includes(platform)) return NextResponse.json({ error: "platform must be 'gumroad' or 'shopify'" }, { status: 400 });

  const fallbackData = platform === "gumroad" ? FALLBACK_GUMROAD : FALLBACK_SHOPIFY;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...fallbackData });
  }

  let rawText: string | undefined;

  try {
    const prompt = platform === "gumroad"
      ? `Write a Gumroad product listing for: "${idea}".

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"productName":"...","tagline":"...","description":"...","salesBullets":["..."],"suggestedPrice":"$X.99","tags":["..."]}`
      : `Write a Shopify product page for: "${idea}".

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return exactly this structure:
{"productTitle":"...","metaDescription":"...","description":"...","bulletPoints":["..."],"tags":["..."],"suggestedPrice":"$X.99","productType":"Digital Download"}`;

    const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
    rawText = call.rawText;
    const extracted = extractJson<Record<string, unknown>>(rawText);
    return NextResponse.json({ platform, ...extracted });

  } catch (error: unknown) {
    const { message, code } = parseGeminiError(error);
    if (isDev) console.error(`[generate-platform][${code}]`, error instanceof Error ? error.message : message);
    return NextResponse.json({ fallback: true, errorCode: code, devMessage: error instanceof Error ? error.message : message, rawPreview: rawText?.slice(0, 500), ...fallbackData });
  }
}
