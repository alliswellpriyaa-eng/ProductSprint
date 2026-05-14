import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { getFallbackPlanner } from "@/lib/fallback-planners";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";

export const maxDuration = 60;

const isDev = process.env.NODE_ENV === "development";
const PLANNER_TTL = 2 * 60 * 60 * 1000; // 2 hours

// Step 1: fastest model for structured JSON output
const PLANNER_MODELS = ["gemini-2.5-flash-lite"] as const;
// Step 3: hard 12-second per-attempt timeout
const PLANNER_TIMEOUT_MS = 12_000;

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
        days: getFallbackPlanner(niche),
      });
    }

    let rawText: string | undefined;
    let modelUsed = "";
    const t0 = Date.now();

    // Step 4: concise prompt — max 2 tasks/day, each task under 12 words, no markdown
    const prompt = `Generate a 30-day Etsy product sprint plan for the "${niche}" niche. Return concise JSON only.

Rules:
- 30 days total
- max 2 tasks per day, each task under 12 words
- no markdown, no explanations, valid JSON only
- vary categories across days

Return exactly this JSON structure:
{"days":[{"day":1,"phase":"Setup","title":"Product Name","goal":"One action sentence","tasks":["Task A under 12 words","Task B under 12 words"],"keywords":["kw1","kw2","kw3"],"pricing":"$4-$8","time":"2 hrs","effort":"Easy","category":"Research","estimatedTime":"2 hrs","completed":false}]}

phase: "Setup" (days 1-5), "Build" (days 6-20), "Launch" (days 21-30)
effort: "Easy" | "Medium" | "Hard"
category: "Research" | "Design" | "SEO" | "Listing" | "Marketing" | "Launch"
Include all 30 days.`;

    // Step 5: 4096 tokens fits 30 concise days without truncation (2048 was too small)
    // Step 6: lower temperature = faster, more deterministic structured output
    const generationConfig = {
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
      temperature: 0.4,
    };

    // Step 7: 2-attempt retry — if first attempt fails, try once more before falling back
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const call = await geminiCall(
          process.env.GEMINI_API_KEY,
          prompt,
          generationConfig,
          // Step 1 + Step 3: fastest model, 12s timeout
          { models: PLANNER_MODELS, timeoutMs: PLANNER_TIMEOUT_MS }
        );
        rawText = call.rawText;
        modelUsed = call.modelUsed;

        const parsed = extractJson<{ days?: unknown[] } | unknown[]>(rawText);
        const days = Array.isArray(parsed) ? parsed : ((parsed as { days?: unknown[] }).days ?? []);
        const responseTime = Date.now() - t0;
        const payload = { days, modelUsed, responseTime };

        setServerCache(key, payload, PLANNER_TTL);

        // Step 10: structured success log
        console.log({ route: "generate-planner", model: modelUsed, responseTime, success: true, fallback: false });

        return NextResponse.json(payload);

      } catch (error: unknown) {
        if (attempt < 2) {
          // First attempt failed — retry immediately
          if (isDev) console.warn(`[generate-planner] attempt ${attempt} failed, retrying…`);
          continue;
        }

        // Both attempts exhausted — return niche-specific fallback
        const { message, code } = parseGeminiError(error);
        const devMessage = error instanceof Error ? error.message : message;
        const responseTime = Date.now() - t0;

        // Step 10: structured failure log
        console.log({ route: "generate-planner", model: modelUsed, responseTime, success: false, fallback: true });
        console.error(`[generate-planner][${code}]`, devMessage);

        return NextResponse.json({
          fallback: true,
          errorCode: code,
          // Step 9: devMessage stays server-side; DemoBanner shows friendly copy to users
          devMessage,
          rawPreview: rawText?.slice(0, 500),
          modelUsed,
          responseTime,
          // Step 8: niche-specific fallback — never show blank UI
          days: getFallbackPlanner(niche),
        });
      }
    }

    // Should never reach here — TypeScript safety net
    return NextResponse.json({ fallback: true, errorCode: "UNKNOWN", days: getFallbackPlanner(niche) });
  });
}
