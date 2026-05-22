import { NextRequest, NextResponse } from "next/server";
import { parseGeminiError } from "@/lib/geminiError";
import { extractJson } from "@/lib/safeJson";
import { geminiCall } from "@/lib/geminiCall";
import { getFallbackTags } from "@/data/fallbackData";
import { withUsageCheck } from "@/lib/apiAuth";
import { getServerCache, setServerCache, serverCacheKey } from "@/lib/serverCache";
import {
  validateTags,
  assessDiversity,
  tagBucketPromptBlock,
  retryInstruction,
  ETSY_MAX_TAGS,
} from "@/lib/tagValidation";

export const maxDuration = 60;
const isDev = process.env.NODE_ENV === "development";
const MAX_RETRIES = 2;

function buildTagPrompt(idea: string, retryNote?: string): string {
  return `Generate exactly ${ETSY_MAX_TAGS} Etsy tags for this digital product: "${idea}".

${tagBucketPromptBlock()}

Rules:
- Each tag must be ${20} characters or fewer (hard limit — count carefully)
- Use real buyer search terms, not vague adjectives
- No punctuation, no special characters
- Mix broad terms (e.g. "printable pdf") with specific ones (e.g. "teacher planner")
${retryNote ? `\nPrevious attempt issue — ${retryNote}\n` : ""}
CRITICAL: Return ONLY valid JSON, no markdown fences, directly parseable by JSON.parse().

Return exactly this structure:
{"tags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13"]}`;
}

export async function POST(req: NextRequest) {
  return withUsageCheck(req, "generate_tags", async (_userId) => {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "idea is required" }, { status: 400 });

    const key = serverCacheKey("tags", idea);
    const cached = getServerCache<{ tags: string[] }>(key);
    if (cached) {
      if (isDev) console.log(`[generate-tags] cache HIT`);
      return NextResponse.json({ ...cached, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ fallback: true, errorCode: "API_KEY_INVALID", tags: getFallbackTags(idea) });
    }

    let rawText: string | undefined;
    let modelUsed = "";
    let lastIssues: string[] = [];
    let lastMissing: string[] = [];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const retryNote =
        attempt > 0
          ? retryInstruction(lastIssues, lastMissing)
          : undefined;

      try {
        const prompt = buildTagPrompt(idea, retryNote);
        const call = await geminiCall(process.env.GEMINI_API_KEY, prompt, { responseMimeType: "application/json" });
        rawText = call.rawText;
        modelUsed = call.modelUsed;

        const parsed = extractJson<{ tags: string[] }>(rawText);
        const { valid, issues, ok } = validateTags(parsed?.tags ?? []);
        const diversity = assessDiversity(valid);

        if (isDev) {
          console.log(`[generate-tags] attempt=${attempt} ok=${ok} diversity=${diversity.score}/7 missing=${diversity.missing.join(",")}`);
        }

        // Accept if validation passes AND diversity is acceptable (≥6/7 buckets)
        if (ok && diversity.diverse) {
          const result = { tags: valid };
          setServerCache(key, result);
          return NextResponse.json({ ...result, modelUsed, diversityScore: diversity.score });
        }

        // Not good enough — prepare retry context
        lastIssues = issues;
        lastMissing = diversity.missing;

        // On final attempt, return best-effort result
        if (attempt === MAX_RETRIES) {
          if (isDev) console.warn(`[generate-tags] returning best-effort after ${MAX_RETRIES} retries`);
          const result = { tags: valid.length > 0 ? valid : getFallbackTags(idea) };
          setServerCache(key, result);
          return NextResponse.json({
            ...result,
            modelUsed,
            diversityScore: diversity.score,
            diversityWarning: diversity.missing.length > 0
              ? `Missing buckets: ${diversity.missing.join(", ")}`
              : undefined,
          });
        }

      } catch (error: unknown) {
        const { message, code } = parseGeminiError(error);
        const devMessage = error instanceof Error ? error.message : message;
        console.error(`[generate-tags][attempt=${attempt}][${code}]`, devMessage);

        if (attempt === MAX_RETRIES) {
          return NextResponse.json({
            fallback: true,
            errorCode: code,
            devMessage,
            rawPreview: rawText?.slice(0, 500),
            tags: getFallbackTags(idea),
          });
        }
        // Network/API error — retry with same prompt
        lastIssues = [`API error: ${message}`];
        lastMissing = [];
      }
    }

    // Should never reach here
    return NextResponse.json({ fallback: true, tags: getFallbackTags(idea) });
  });
}
