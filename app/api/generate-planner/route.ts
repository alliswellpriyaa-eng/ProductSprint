import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { FALLBACK_PLANNER_DAYS } from "@/data/fallbacks";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;

const isDev = process.env.NODE_ENV === "development";
const PLANNER_TTL = 2 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_planner", async (_userId) => {
    const { niche } = await req.json();
    if (!niche) return NextResponse.json({ error: "niche is required" }, { status: 400 });

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
        devMessage: "GEMINI_API_KEY is missing from environment",
        days: FALLBACK_PLANNER_DAYS,
      });
    }

    let rawText: string | undefined;
    let modelUsed = "";
    const t0 = Date.now();

    try {
      const prompt = `You are an Etsy digital product launch coach. Create a detailed 30-day sprint plan for the "${niche}" niche.

Each day should feel like a clear, actionable coaching instruction — not generic advice.
Vary the products across the 30 days (different types: planners, trackers, worksheets, bundles).
Make tasks specific and executable in 1–3 hours.

CRITICAL: Return ONLY valid JSON. Do not include markdown. Do not include \`\`\`json fences. Do not include explanations or comments. The response must be directly parseable by JSON.parse().

Return ALL 30 days using exactly this structure:
{"days":[{"day":1,"phase":"Setup","title":"Product name (specific)","goal":"One actionable sentence","tasks":["Specific task A","Specific task B","Specific task C"],"keywords":["etsy kw1","etsy kw2","etsy kw3"],"pricing":"$4.99–$7.99","time":"2 hrs","effort":"Easy","category":"Research","estimatedTime":"2 hrs","completed":false}]}

Rules:
- phase: "Setup" (days 1-5), "Build" (days 6-20), "Launch" (days 21-30)
- effort: "Easy" | "Medium" | "Hard"
- category: "Research" | "Design" | "SEO" | "Listing" | "Marketing" | "Launch"
- estimatedTime: e.g. "1–2 hrs", "3 hrs", "30 mins"
- completed: always false
- Keep titles short and specific (e.g. "Kids Morning Routine Chart" not "Create product")
- Include all 30 days`;

      const call = await geminiCall(
        process.env.GEMINI_API_KEY,
        prompt,
        { responseMimeType: "application/json" }
      );
      rawText = call.rawText;
      modelUsed = call.modelUsed;

      const parsed = extractJson<{ days?: unknown[] } | unknown[]>(rawText);
      const days = Array.isArray(parsed) ? parsed : ((parsed as { days?: unknown[] }).days ?? []);
      const payload = { days, modelUsed, responseTime: Date.now() - t0 };

      setServerCache(key, payload, PLANNER_TTL);
      return NextResponse.json(payload);

    } catch (error: unknown) {
      const { message, code } = parseGeminiError(error);
      const devMessage = error instanceof Error ? error.message : message;
      console.error(`[generate-planner][${code}]`, devMessage);
      return NextResponse.json({
        fallback: true,
        errorCode: code,
        devMessage,
        rawPreview: rawText?.slice(0, 500),
        modelUsed,
        responseTime: Date.now() - t0,
        days: FALLBACK_PLANNER_DAYS,
      });
    }
  });
}
