export type ErrorCode =
  | "API_KEY_INVALID"
  | "RATE_LIMIT"
  | "SAFETY_BLOCK"
  | "NETWORK"
  | "PARSE_ERROR"
  | "UNKNOWN";

export interface GeminiError {
  code: ErrorCode;
  message: string;
}

export function parseGeminiError(error: unknown): GeminiError {
  const raw = error instanceof Error ? error.message : String(error);

  if (
    raw.includes("API_KEY_INVALID") ||
    raw.includes("API key not valid") ||
    raw.includes("400 Bad Request") ||
    raw.includes("INVALID_ARGUMENT")
  ) {
    return {
      code: "API_KEY_INVALID",
      message: "Your Gemini API key is invalid or missing. Open .env.local and paste a valid key from aistudio.google.com.",
    };
  }

  if (
    raw.includes("429") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes("quota") ||
    raw.includes("rate limit")
  ) {
    return {
      code: "RATE_LIMIT",
      message: "Gemini rate limit reached. Wait 10–15 seconds and try again.",
    };
  }

  if (raw.includes("SAFETY") || raw.includes("safety")) {
    return {
      code: "SAFETY_BLOCK",
      message: "The AI blocked this request for safety reasons. Try a slightly different niche or product type.",
    };
  }

  if (
    raw.includes("ECONNREFUSED") ||
    raw.includes("fetch failed") ||
    raw.includes("network") ||
    raw.includes("ENOTFOUND") ||
    raw.includes("timed out") ||
    raw.includes("timeout") ||
    raw.includes("AbortError")
  ) {
    return {
      code: "NETWORK",
      message: "The request timed out — Gemini took too long to respond. Showing sample data instead.",
    };
  }

  // SyntaxError from JSON.parse — Gemini returned non-JSON text
  if (
    error instanceof SyntaxError ||
    raw.includes("SyntaxError") ||
    raw.includes("JSON") ||
    raw.includes("Unexpected token") ||
    raw.includes("Unexpected end") ||
    raw.includes("is not valid JSON")
  ) {
    return {
      code: "PARSE_ERROR",
      message: "The AI returned an unexpected format. Retrying usually fixes this.",
    };
  }

  // Return a trimmed, readable version of any other error
  return {
    code: "UNKNOWN",
    message: raw.length > 120 ? "Something went wrong. Please try again." : raw,
  };
}
