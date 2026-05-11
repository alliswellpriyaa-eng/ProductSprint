/**
 * Safe JSON extraction utility.
 * Strips markdown fences, locates the first JSON object/array,
 * and returns the parsed result. Throws on failure so callers
 * can catch and return a proper fallback.
 */
export function extractJson<T = unknown>(text: string): T {
  if (!text || text.trim().length === 0) {
    throw new Error("Empty AI response");
  }

  let cleaned = text.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Find the earliest JSON start character
  const firstArray = cleaned.indexOf("[");
  const firstObject = cleaned.indexOf("{");

  let start = -1;
  if (firstArray === -1) start = firstObject;
  else if (firstObject === -1) start = firstArray;
  else start = Math.min(firstArray, firstObject);

  if (start === -1) {
    throw new Error(`No JSON found in response. Preview: ${cleaned.slice(0, 200)}`);
  }

  if (start > 0) cleaned = cleaned.slice(start);

  // Find the matching end character
  const lastArray = cleaned.lastIndexOf("]");
  const lastObject = cleaned.lastIndexOf("}");
  const end = Math.max(lastArray, lastObject);

  if (end !== -1) cleaned = cleaned.slice(0, end + 1);

  return JSON.parse(cleaned) as T;
}
