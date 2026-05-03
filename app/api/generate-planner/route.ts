import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiError } from "@/lib/geminiError";
import { FALLBACK_PLANNER_DAYS } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

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

      // ── Optimised prompt ────────────────────────────────────────────────────
      const prompt = `Generate a 30-day Etsy digital product creation plan for the "${niche}" niche.
Phases: Days 1-5 = "Setup", Days 6-20 = "Build", Days 21-30 = "Launch".
Each day: unique beginner-friendly product, 4 short tasks, 3 keywords, pricing, effort level.

Return ONLY valid JSON (all 30 days):
{
  "days": [{
    "day": 1,
    "phase": "Setup",
    "title": "Short product name",
    "goal": "One sentence goal",
    "tasks": ["Task 1","Task 2","Task 3","Task 4"],
    "design": { "size": "US Letter (8.5×11 in)", "orientation": "Portrait", "style": "Minimal & Clean", "tool": "Canva" },
    "keywords": ["keyword 1","keyword 2","keyword 3"],
    "pricing": "$4.99–$7.99",
    "time": "2–3 hours",
    "effort": "Easy"
  }]
}
Effort: "Easy" | "Medium" | "Hard". Vary product types. Include all 30 days.`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 50s")), 50_000)
      );
      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
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
