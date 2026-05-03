import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_EXAMPLES } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_seo", async (_userId) => {
  const { idea } = await req.json();
  if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", ...FALLBACK_EXAMPLES });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Generate realistic Etsy listing examples for this digital product: "${idea}".

Return ONLY a JSON object:
{
  "titles": ["Example title 1 | With Keywords | Printable PDF", "Example title 2 | Instant Download"],
  "priceRange": "$3.99 – $7.99",
  "includes": ["item 1", "item 2", "item 3", "item 4"],
  "sellerTip": "One sentence tip for standing out as a seller."
}`;

    const result = await model.generateContent(prompt);
    const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return NextResponse.json(JSON.parse(cleaned));
  } catch (error: unknown) {
    const { message, code } = parseGeminiError(error);
    if (isDev) console.error(`[examples][${code}]`, message);
    return NextResponse.json({ fallback: true, errorCode: code, ...FALLBACK_EXAMPLES });
  }
  });
}
