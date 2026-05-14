"use client";

interface DemoBannerProps {
  errorCode?: string;
  devMessage?: string;
  onRetry?: () => void;
  className?: string;
  /** Override the production subtitle shown to users (Step 9) */
  subtitle?: string;
}

const isDev = process.env.NODE_ENV === "development";

// Step 10 — friendly UX copy. NEVER expose raw Gemini errors to users.
const PROD_REASON: Record<string, string> = {
  API_KEY_INVALID:  "AI is currently busy due to high demand.",
  RATE_LIMIT:       "AI is currently busy due to high demand.",
  SAFETY_BLOCK:     "AI is currently busy due to high demand.",
  NETWORK:          "AI is currently busy due to high demand.",
  PARSE_ERROR:      "AI is currently busy due to high demand.",
  UNKNOWN:          "AI is currently busy due to high demand.",
};

export default function DemoBanner({ errorCode, devMessage, onRetry, className = "", subtitle }: DemoBannerProps) {
  const reason = errorCode ? (PROD_REASON[errorCode] ?? PROD_REASON.UNKNOWN) : PROD_REASON.UNKNOWN;

  return (
    <div data-testid="demo-banner" className={`space-y-2 ${className}`}>
      {/* Step 10: yellow warning banner — NEVER red fatal error box */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <span className="text-lg flex-shrink-0">⚡</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Demo Mode
            </span>
          </div>
          {isDev ? (
            <p className="text-xs text-amber-700 mt-0.5">AI unavailable — showing sample data</p>
          ) : subtitle ? (
            // Step 9: context-specific friendly message (e.g. planner: "AI is busy right now — showing backup sprint plan.")
            <p className="text-xs text-amber-700 mt-0.5">{subtitle}</p>
          ) : (
            <>
              <p className="text-xs text-amber-700 mt-0.5">{reason} Showing backup results for now.</p>
              <p className="text-xs text-amber-600 mt-0.5">Please try again shortly.</p>
            </>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            ↺ Retry
          </button>
        )}
      </div>

      {/* Dev-only: full error details for debugging */}
      {isDev && devMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-mono break-all">
          <span className="font-bold text-red-800">[dev] </span>{devMessage}
        </div>
      )}
    </div>
  );
}
