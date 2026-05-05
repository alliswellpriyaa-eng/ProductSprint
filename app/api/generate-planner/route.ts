import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_PLANNER_DAYS } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

// Tell Vercel to allow up to 60 s for this function (Hobby plan max)
export const maxDuration = 60;

const isDev = process.env.NODE_ENV === "development";

// Planner payloads are large — cache for 2 hours
const PLANNER_TTL = 2 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_planner", async (_userId) => {
    const { niche } = await req.json();
    if (!niche) return NextResponse.json({ error: "niche is required" }, { status: 400 });

    // ── Server cache check ──────────────────────────────────────────────────
    const key = serverCacheKey("planner", niche);
    const cached = getServerCache<{ days: unknown[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-planner] cache HIT: ${key}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        fallback: true,
        errorCode: "API_KEY_INVALID",
        devMessage: isDev ? "GEMINI_API_KEY is missing from .env.local" : undefined,
        days: FALLBACK_PLANNER_DAYS,
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // ── Prompt — lean schema so Gemini responds in < 20 s ──────────────────
      const prompt = `Create a 30-day Etsy digital product plan for the "${niche}" niche.
Phases: days 1-5 = "Setup", 6-20 = "Build", 21-30 = "Launch".
Return ONLY this JSON with ALL 30 days — no extra text:
{"days":[{"day":1,"phase":"Setup","title":"Product name","goal":"One sentence","tasks":["Task A","Task B","Task C"],"keywords":["kw1","kw2","kw3"],"pricing":"$4.99–$7.99","time":"2–3 hrs","effort":"Easy"}]}
Rules: effort = Easy|Medium|Hard, vary product types, keep titles short, include all 30 days.`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 55s")), 55_000)
      );
      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const rawText = result.response.text();

      if (!rawText || rawText.trim().length < 10) {
        throw new SyntaxError("Gemini returned empty response");
      }

      // Strip markdown fences, then extract the JSON object/array
      // by finding the first { or [ and the last matching } or ]
      const stripped = rawText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const firstBrace = stripped.indexOf("{");
      const firstBracket = stripped.indexOf("[");
      const startIdx =
        firstBrace === -1 ? firstBracket :
        firstBracket === -1 ? firstBrace :
        Math.min(firstBrace, firstBracket);

      if (startIdx === -1) throw new SyntaxError("No JSON object found in response");

      const openChar = stripped[startIdx];
      const closeChar = openChar === "{" ? "}" : "]";
      const endIdx = stripped.lastIndexOf(closeChar);
      if (endIdx === -1) throw new SyntaxError("Unterminated JSON in response");

      const jsonStr = stripped.slice(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);
      const days = Array.isArray(parsed) ? parsed : (parsed.days ?? []);
      const payload = { days };

      setServerCache(key, payload, PLANNER_TTL);
      return NextResponse.json(payload);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      if (isDev) console.error(`[generate-planner][${code}]`, message);
      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage: isDev ? message : undefined,
        days: FALLBACK_PLANNER_DAYS,
      });
    }
  });
}
