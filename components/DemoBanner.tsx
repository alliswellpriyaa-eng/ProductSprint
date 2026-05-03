"use client";

import ErrorBanner from "@/components/ErrorBanner";

interface DemoBannerProps {
  errorCode?: string;
  devMessage?: string;
  onRetry?: () => void;
  className?: string;
}

const isDev = process.env.NODE_ENV === "development";

// User-friendly labels for each error type in production
const PROD_REASON: Record<string, string> = {
  API_KEY_INVALID: "The AI service couldn't be reached.",
  RATE_LIMIT: "The AI service is temporarily busy.",
  SAFETY_BLOCK: "The AI declined this request.",
  NETWORK: "A network error occurred.",
  UNKNOWN: "The AI service is temporarily unavailable.",
};

export default function DemoBanner({ errorCode, devMessage, onRetry, className = "" }: DemoBannerProps) {
  const reason = errorCode ? (PROD_REASON[errorCode] ?? PROD_REASON.UNKNOWN) : PROD_REASON.UNKNOWN;

  return (
    <div data-testid="demo-banner" className={`space-y-2 ${className}`}>
      {/* Demo mode notice — always shown */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <span className="text-lg flex-shrink-0">⚡</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Demo Mode
            </span>
            <span className="text-xs text-amber-700">
              {isDev ? "AI unavailable — showing sample data" : `${reason} Showing sample results.`}
            </span>
          </div>
          {!isDev && (
            <p className="text-xs text-amber-600 mt-0.5">
              These are example results, not AI-generated. Try again in a moment.
            </p>
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

      {/* Dev-only: full error details */}
      {isDev && devMessage && (
        <ErrorBanner message={devMessage} onRetry={onRetry} />
      )}
    </div>
  );
}
