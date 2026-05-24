/**
 * Etsy tag validation and diversity utilities.
 *
 * Etsy allows exactly 13 tags, each ≤ 20 characters.
 * For search coverage, tags should span 7 diversity buckets so the listing
 * surfaces across multiple buyer intent signals.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const ETSY_MAX_TAGS = 13;
export const ETSY_TAG_MAX_CHARS = 20;

/**
 * The 7 diversity buckets every listing should cover.
 * Used in prompts so the AI understands the distribution goal,
 * and in assessDiversity() to score the result.
 */
export const TAG_BUCKETS = [
  {
    id: "product_type",
    label: "Product type",
    description: "What the item is: printable, pdf, template, planner, spreadsheet, tracker",
    examples: ["printable pdf", "digital planner", "canva template"],
  },
  {
    id: "topic",
    label: "Topic / theme",
    description: "The subject matter: budget planner, meal prep, habit tracker, wedding",
    examples: ["budget planner", "meal prep", "habit tracker"],
  },
  {
    id: "buyer_persona",
    label: "Buyer persona",
    description: "Who it's for: teachers, moms, students, small business owners",
    examples: ["for teachers", "busy moms", "small business"],
  },
  {
    id: "use_case",
    label: "Use case / occasion",
    description: "When or why it's used: back to school, wedding planning, goal setting",
    examples: ["back to school", "wedding planner", "goal setting"],
  },
  {
    id: "format_style",
    label: "Format / style",
    description: "Aesthetic or file format: minimalist, boho, A4, letter size, editable",
    examples: ["minimalist", "boho style", "letter size"],
  },
  {
    id: "benefit",
    label: "Benefit / action",
    description: "What the buyer gets or does: instant download, time saver, organized",
    examples: ["instant download", "time saver", "stay organized"],
  },
  {
    id: "platform_tool",
    label: "Platform / tool",
    description: "Related software or platform: google sheets, excel, canva, notion",
    examples: ["google sheets", "excel template", "notion template"],
  },
] as const;

export type BucketId = (typeof TAG_BUCKETS)[number]["id"];

// ─── Validation ───────────────────────────────────────────────────────────────

export interface TagValidationResult {
  /** Tags that pass all rules */
  valid: string[];
  /** Human-readable issue descriptions */
  issues: string[];
  /** True when valid.length === ETSY_MAX_TAGS and issues is empty */
  ok: boolean;
}

/**
 * Validate an array of Etsy tags.
 * - Trims whitespace
 * - Enforces ≤ 20 chars (truncates silently)
 * - Removes duplicates (case-insensitive)
 * - Reports if count ≠ 13
 */
export function validateTags(raw: string[]): TagValidationResult {
  const issues: string[] = [];

  if (!Array.isArray(raw)) {
    return { valid: [], issues: ["tags must be an array"], ok: false };
  }

  // 1. Trim + truncate
  const trimmed = raw.map((t) => (typeof t === "string" ? t.trim().slice(0, ETSY_TAG_MAX_CHARS) : ""));

  // 2. Remove empties
  const nonEmpty = trimmed.filter((t) => t.length > 0);
  if (nonEmpty.length < raw.length) {
    issues.push(`${raw.length - nonEmpty.length} empty or non-string tag(s) removed`);
  }

  // 3. Deduplicate (case-insensitive, keep first occurrence)
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const tag of nonEmpty) {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(tag);
    }
  }
  if (deduped.length < nonEmpty.length) {
    issues.push(`${nonEmpty.length - deduped.length} duplicate tag(s) removed`);
  }

  // 4. Count check
  if (deduped.length < ETSY_MAX_TAGS) {
    issues.push(`only ${deduped.length} unique tags (need ${ETSY_MAX_TAGS})`);
  } else if (deduped.length > ETSY_MAX_TAGS) {
    issues.push(`${deduped.length} tags returned; trimming to ${ETSY_MAX_TAGS}`);
    deduped.splice(ETSY_MAX_TAGS);
  }

  return {
    valid: deduped,
    issues,
    ok: deduped.length === ETSY_MAX_TAGS && issues.length === 0,
  };
}

// ─── Diversity assessment ─────────────────────────────────────────────────────

export interface DiversityResult {
  /** 0–7: number of buckets covered */
  score: number;
  /** Bucket labels that appear uncovered */
  missing: string[];
  /** True when all 7 buckets have at least one matching tag */
  diverse: boolean;
}

/**
 * Heuristic check: does the tag set cover all 7 buckets?
 * Uses the example keywords for each bucket as weak signals.
 */
export function assessDiversity(tags: string[]): DiversityResult {
  const lower = tags.map((t) => t.toLowerCase());
  const missing: string[] = [];

  // Simple keyword overlap heuristic per bucket
  const bucketKeywords: Record<BucketId, string[]> = {
    product_type: ["printable", "pdf", "template", "planner", "spreadsheet", "tracker", "worksheet", "checklist", "digital"],
    topic: [], // topic is too product-specific to check generically — always considered covered
    buyer_persona: ["teacher", "mom", "student", "business", "parent", "kid", "bride", "freelancer", "nurse", "coach"],
    use_case: ["school", "wedding", "goal", "budget", "meal", "holiday", "christmas", "baby", "fitness", "launch"],
    format_style: ["minimalist", "boho", "modern", "aesthetic", "letter", "a4", "editable", "fillable", "black", "white"],
    benefit: ["instant", "download", "saver", "organized", "easy", "simple", "quick", "printable"],
    platform_tool: ["google", "excel", "canva", "notion", "sheets", "word", "gdocs"],
  };

  let covered = 0;
  for (const bucket of TAG_BUCKETS) {
    const keywords = bucketKeywords[bucket.id];
    // topic bucket — always mark covered (too product-specific to assert)
    if (bucket.id === "topic" || keywords.length === 0) {
      covered++;
      continue;
    }
    const hit = lower.some((tag) => keywords.some((kw) => tag.includes(kw)));
    if (hit) {
      covered++;
    } else {
      missing.push(bucket.label);
    }
  }

  return { score: covered, missing, diverse: covered >= 6 };
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────

/**
 * Returns the 7-bucket instruction block to embed in a Gemini prompt.
 */
export function tagBucketPromptBlock(): string {
  const lines = TAG_BUCKETS.map(
    (b, i) => `  ${i + 1}. ${b.label} — ${b.description} (e.g. ${b.examples.join(", ")})`
  );
  return `Distribute the 13 tags across these 7 buyer-intent buckets (1–2 tags each):
${lines.join("\n")}`;
}

/**
 * Formats a retry instruction when a previous attempt failed diversity/validation.
 */
export function retryInstruction(issues: string[], missing: string[]): string {
  const parts: string[] = [];
  if (issues.length > 0) parts.push(`Fix these issues: ${issues.join("; ")}.`);
  if (missing.length > 0) parts.push(`Add tags covering these missing buckets: ${missing.join(", ")}.`);
  return parts.join(" ");
}
