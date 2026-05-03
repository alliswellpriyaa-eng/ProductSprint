import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_GUMROAD, FALLBACK_SHOPIFY } from "@/data/fallbacks";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  const { idea, platform } = await req.json();

  if (!idea || !platform) {
    return NextResponse.json({ error: "idea and platform are required" }, { status: 400 });
  }
  if (!["gumroad", "shopify"].includes(platform)) {
    return NextResponse.json({ error: "platform must be 'gumroad' or 'shopify'" }, { status: 400 });
  }

  const fallbackData = platform === "gumroad" ? FALLBACK_GUMROAD : FALLBACK_SHOPIFY;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...fallbackData });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = platform === "gumroad"
      ? `Write a Gumroad product listing for: "${idea}". Return ONLY JSON:
{ "productName": "...", "tagline": "...", "description": "...", "salesBullets": ["..."], "suggestedPrice": "$X.99", "tags": ["..."] }`
      : `Write a Shopify product page for: "${idea}". Return ONLY JSON:
{ "productTitle": "...", "metaDescription": "...", "description": "...", "bulletPoints": ["..."], "tags": ["..."], "suggestedPrice": "$X.99", "productType": "Digital Download" }`;

    const result = await model.generateContent(prompt);
    const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return NextResponse.json({ platform, ...JSON.parse(cleaned) });
  } catch (error: unknown) {
    const { message, code } = parseGeminiError(error);
    if (isDev) console.error(`[generate-platform][${code}]`, message);
    return NextResponse.json({
      fallback: true,
      errorCode: code,
      devMessage: isDev ? message : undefined,
      ...fallbackData,
    });
  }
}
