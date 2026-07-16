import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import { renderPinterestPinPng } from "@/lib/pinterest-image";

export const maxDuration = 60;

const TTL_4H = 4 * 60 * 60 * 1000;
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;

interface PinterestPack {
  title?: string;
  overlayText?: string;
  backgroundColor?: string;
  accentColor?: string;
  overlayBgColor?: string;
  overlayTextColor?: string;
}

// Rendering the PNG is separate from the Gemini text-pack call and can fail on its
// own (e.g. a font file issue) without needing to take down the whole response —
// degrade to text-only with imageError set rather than a hard 500.
async function tryRenderImage(pack: PinterestPack, idea: string) {
  try {
    const png = await renderPinterestPinPng({
      productTitle: pack.title || idea,
      overlayText: pack.overlayText || idea,
      backgroundColor: pack.backgroundColor,
      accentColor: pack.accentColor,
      overlayBgColor: pack.overlayBgColor,
      overlayTextColor: pack.overlayTextColor,
    });
    return { imageBase64: png.toString("base64"), imageFileName: "pinterest-pin.png" };
  } catch (err) {
    console.error("[generate-pinterest] image render failed:", err);
    return { imageError: "Could not render pin image; text pack is still valid." };
  }
}

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_pinterest", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("pinterest", idea);
    const cached = getServerCache<PinterestPack>(key);
    if (cached) {
      const image = await tryRenderImage(cached, idea);
      return NextResponse.json({ ...cached, ...image, cached: true });
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
      const prompt = `You are an expert Pinterest marketer specialising in Etsy digital products. Generate a complete Pinterest Pin Pack for this product idea:

Product: "${idea}"

CRITICAL: Return ONLY valid JSON, no markdown fences, no comments, directly parseable by JSON.parse().

Return exactly this structure:
{
  "title": "Pinterest pin title optimised for Pinterest SEO, max 100 characters, keyword-rich",
  "description": "Pinterest pin description with natural keywords that buyers search for, 150-200 characters, includes a light call to action",
  "overlayText": "Short bold overlay text for the pin image, maximum 8 words, punchy and benefit-driven",
  "hashtags": ["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5","#hashtag6","#hashtag7","#hashtag8","#hashtag9","#hashtag10"],
  "cta": "Clear call to action text to use at the end of the description, max 10 words",
  "canvaLayout": "Description of the ideal Canva pin layout: use a 1000x1500px (2:3) canvas, specify a colour palette of 3 hex codes, recommend font pairing, describe image placement, text hierarchy, and 2-3 specific design tips for this product type",
  "backgroundColor": "Hex code for the pin background, e.g. #F5F5DC — should be light/soft so dark overlay text reads clearly",
  "accentColor": "Hex code for a complementary accent color, e.g. #C9A227",
  "overlayBgColor": "Hex code for the overlay text banner background — should be dark for contrast, e.g. #1B2A4A",
  "overlayTextColor": "Hex code for the overlay text itself — should contrast overlayBgColor, usually #FFFFFF"
}

Rules for hashtags: 8 to 10 hashtags, mix broad and niche terms, include #etsy and #etsyshop.`;

      const call = await geminiCall(
        process.env.GEMINI_API_KEY,
        prompt,
        { responseMimeType: "application/json" },
        { models: MODELS }
      );
      rawText = call.rawText;
      modelUsed = call.modelUsed;

      const parsed = extractJson<PinterestPack>(rawText);
      const responseTime = Date.now() - startTime;

      setServerCache(key, { ...(parsed as object), modelUsed }, TTL_4H);

      console.log({ route: "generate-pinterest", model: modelUsed, responseTime, success: true, fallback: false });

      const image = await tryRenderImage(parsed, idea);

      return NextResponse.json({
        ...(parsed as object),
        ...image,
        modelUsed,
        rawPreview: rawText.slice(0, 200),
        responseTime,
      });
    } catch (error: unknown) {
      const { message, code, raw } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : (raw ?? message);
      const responseTime = Date.now() - startTime;

      console.log({ route: "generate-pinterest", model: modelUsed, responseTime, success: false, fallback: true });
      console.error(`[generate-pinterest][${code}]`, devMessage);

      return NextResponse.json(
        { fallback: true, errorCode: code, devMessage, rawPreview: rawText?.slice(0, 500), modelUsed, responseTime },
        { status: 500 }
      );
    }
  });
}
