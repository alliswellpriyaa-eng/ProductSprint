import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  const { idea } = await req.json();
  if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ fallback: true, audience: "General", difficulty: "Easy" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `For this Etsy digital product: "${idea}", identify the primary target audience and creation difficulty.
Return ONLY: { "audience": "short label", "difficulty": "Easy" | "Medium" | "Hard" }`;

    const result = await model.generateContent(prompt);
    const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return NextResponse.json(JSON.parse(cleaned));
  } catch (error: unknown) {
    const { message, code } = parseGeminiError(error);
    if (isDev) console.error(`[meta][${code}]`, message);
    return NextResponse.json({ fallback: true, errorCode: code, audience: "General", difficulty: "Easy" });
  }
}
