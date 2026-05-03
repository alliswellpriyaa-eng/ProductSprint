"use client";

interface ErrorBannerProps {
  message: string;
  className?: string;
  onRetry?: () => void;
}

interface ErrorConfig {
  icon: string;
  title: string;
  body: string;
  fixSteps?: string[];
  fixLink?: { href: string; label: string };
  bg: string;
  border: string;
  titleColor: string;
  bodyColor: string;
  stepsColor: string;
}

function detectError(message: string): ErrorConfig {
  const m = message.toLowerCase();

  // ── Invalid API key ─────────────────────────────────────────────────────────
  if (
    m.includes("api_key_invalid") ||
    m.includes("api key not valid") ||
    m.includes("api key is invalid") ||
    m.includes("invalid api key") ||
    m.includes("400 bad request") ||
    m.includes("please pass a valid api key")
  ) {
    return {
      icon: "🔑",
      title: "Invalid API Key",
      body: "Your Gemini API key isn't working. It may be incorrect, expired, or missing.",
      fixSteps: [
        'Open the file ".env.local" in your project folder',
        'Set  GEMINI_API_KEY=your-key-here  (no quotes, no spaces)',
        "Restart the dev server: stop it with Ctrl+C, then run  npm run dev  again",
      ],
      fixLink: { href: "https://aistudio.google.com/app/apikey", label: "Get a free key at aistudio.google.com →" },
      bg: "bg-amber-50",
      border: "border-amber-200",
      titleColor: "text-amber-800",
      bodyColor: "text-amber-700",
      stepsColor: "text-amber-600",
    };
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  if (
    m.includes("rate limit") ||
    m.includes("resource_exhausted") ||
    m.includes("quota") ||
    m.includes("429")
  ) {
    return {
      icon: "⏱",
      title: "Rate Limit Reached",
      body: "You've hit Gemini's free tier limit (15 requests/min). Wait a moment and try again — it resets automatically.",
      bg: "bg-blue-50",
      border: "border-blue-200",
      titleColor: "text-blue-800",
      bodyColor: "text-blue-700",
      stepsColor: "text-blue-600",
    };
  }

  // ── Safety block ────────────────────────────────────────────────────────────
  if (m.includes("safety") || m.includes("safety_block")) {
    return {
      icon: "🛡",
      title: "Content Blocked",
      body: "The AI flagged this request. Try a slightly different niche or product type.",
      bg: "bg-orange-50",
      border: "border-orange-200",
      titleColor: "text-orange-800",
      bodyColor: "text-orange-700",
      stepsColor: "text-orange-600",
    };
  }

  // ── Timeout ─────────────────────────────────────────────────────────────────
  if (m.includes("timed out") || m.includes("timeout") || m.includes("aborterror")) {
    return {
      icon: "⏳",
      title: "Response Timed Out",
      body: "The 30-day plan request took too long — Gemini is busy or thinking deeply. Sample data is showing below. Try again in a moment.",
      bg: "bg-blue-50",
      border: "border-blue-200",
      titleColor: "text-blue-800",
      bodyColor: "text-blue-700",
      stepsColor: "text-blue-600",
    };
  }

  // ── Network ─────────────────────────────────────────────────────────────────
  if (m.includes("network") || m.includes("fetch failed") || m.includes("econnrefused")) {
    return {
      icon: "🌐",
      title: "Network Error",
      body: "Can't reach the AI service. Check your internet connection and try again.",
      bg: "bg-red-50",
      border: "border-red-200",
      titleColor: "text-red-800",
      bodyColor: "text-red-700",
      stepsColor: "text-red-600",
    };
  }

  // ── Generic fallback ────────────────────────────────────────────────────────
  return {
    icon: "⚠️",
    title: "Something went wrong",
    body: "An unexpected error occurred. Please try again.",
    bg: "bg-red-50",
    border: "border-red-200",
    titleColor: "text-red-800",
    bodyColor: "text-red-700",
    stepsColor: "text-red-600",
  };
}

export default function ErrorBanner({ message, className = "", onRetry }: ErrorBannerProps) {
  const cfg = detectError(message);

  return (
    <div data-testid="error-banner" className={`rounded-2xl border ${cfg.bg} ${cfg.border} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${cfg.titleColor}`}>{cfg.title}</p>
          <p className={`text-sm mt-0.5 leading-relaxed ${cfg.bodyColor}`}>{cfg.body}</p>

          {/* Fix steps */}
          {cfg.fixSteps && cfg.fixSteps.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.stepsColor}`}>How to fix</p>
              {cfg.fixSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full border text-xs flex items-center justify-center font-semibold mt-0.5 ${cfg.border} ${cfg.stepsColor}`}>
                    {i + 1}
                  </span>
                  <p className={`text-xs leading-snug ${cfg.bodyColor}`}>
                    {step.includes("  ") ? (
                      <>
                        {step.split("  ")[0]}
                        {"  "}
                        <code className={`font-mono bg-white/70 px-1 rounded ${cfg.stepsColor}`}>
                          {step.split("  ")[1]}
                        </code>
                        {step.split("  ")[2] ? `  ${step.split("  ")[2]}` : ""}
                      </>
                    ) : step}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Fix link */}
          {cfg.fixLink && (
            <a
              href={cfg.fixLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block mt-3 text-xs font-semibold underline underline-offset-2 ${cfg.titleColor} hover:opacity-80 transition-opacity`}
            >
              {cfg.fixLink.label}
            </a>
          )}

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${cfg.border} ${cfg.bodyColor} hover:bg-white/50`}
            >
              ↺ Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
