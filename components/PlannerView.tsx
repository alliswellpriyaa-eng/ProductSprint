"use client";

import { useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import DemoBanner from "@/components/DemoBanner";
import { trackEvent, isAtLimit, incrementTodayUsage, remainingToday } from "@/lib/analytics";
import { getCache, setCache, cacheKey } from "@/lib/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayDesign {
  size: string;
  orientation: string;
  style: string;
  tool: string;
}

const DEFAULT_DESIGN: DayDesign = {
  size: "US Letter (8.5×11 in)",
  orientation: "Portrait",
  style: "Minimal & Clean",
  tool: "Canva",
};

export interface PlanDay {
  day: number;
  phase: "Setup" | "Build" | "Launch";
  title: string;
  goal: string;
  tasks: string[];
  design?: DayDesign;
  keywords: string[];
  pricing: string;
  time: string;
  effort: "Easy" | "Medium" | "Hard";
}

interface PlannerViewProps {
  niche: string;
  isPremium: boolean;
  onUpgradeClick: (source?: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NICHES = [
  "Kids", "Wedding", "Productivity", "Fitness", "Budgeting", "Teachers",
  "Seasonal – Summer", "Seasonal – Christmas", "Seasonal – Halloween",
  "Self Care", "Small Business", "Travel",
];

const PHASES = {
  Setup:  { label: "🎯 Sprint Setup",  days: "Days 1–5",  color: "border-purple-300 bg-purple-50", badge: "bg-purple-100 text-purple-700", desc: "Build your foundation & first product" },
  Build:  { label: "🔨 Sprint Build",  days: "Days 6–20", color: "border-blue-300 bg-blue-50",   badge: "bg-blue-100 text-blue-700",   desc: "Ship your product catalog" },
  Launch: { label: "🚀 Sprint Launch", days: "Days 21–30",color: "border-green-300 bg-green-50", badge: "bg-green-100 text-green-700", desc: "Optimise listings & start earning" },
};

const EFFORT_COLOR: Record<string, string> = {
  Easy:   "text-green-600 bg-green-50",
  Medium: "text-yellow-600 bg-yellow-50",
  Hard:   "text-red-600 bg-red-50",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size }} className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Locked Row ───────────────────────────────────────────────────────────────

function LockedRow({ label, onUnlock }: { label: string; onUnlock: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <button
        onClick={onUnlock}
        className="text-xs text-purple-500 hover:text-purple-700 font-semibold flex items-center gap-1 transition-colors"
      >
        🔒 Locked — <span className="underline">Join early access</span>
      </button>
    </div>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ item, actionMode, isPremium, onUnlock }: {
  item: PlanDay;
  actionMode: boolean;
  isPremium: boolean;
  onUnlock: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const phase = PHASES[item.phase] ?? PHASES.Build;
  const isOpen = expanded || actionMode;

  const design = item.design ?? DEFAULT_DESIGN;
  const actionSteps = [
    `Open Canva → Create new design (${design.size}, ${design.orientation})`,
    `Design your "${item.title}" using ${design.style} style`,
    ...item.tasks.map((t) => t),
    `Export as PDF Print (high resolution)`,
    `Create Etsy listing — use keyword: "${item.keywords[0] || "digital printable"}"`,
    `Set price at ${item.pricing} and publish`,
  ];

  return (
    <div
      data-testid="day-card"
      className={`rounded-xl border-l-4 bg-white shadow-sm hover:shadow-md transition-all ${phase.color.split(" ")[0]}`}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${phase.badge}`}>
          {item.day}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-snug">{item.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.goal}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EFFORT_COLOR[item.effort] ?? EFFORT_COLOR.Easy}`}>
            {item.effort}
          </span>
          <span className="text-gray-300 text-sm">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">

          {actionMode && isPremium ? (
            /* ⚡ ACTION MODE (premium only) */
            <div className="space-y-2">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1">⚡ Action Steps</p>
              {actionSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-snug">{step}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">💵 {item.pricing}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">⏱ {item.time}</span>
              </div>
            </div>
          ) : (
            /* LIST MODE — tasks/keywords/pricing locked for free users */
            <>
              <div>
                {isPremium ? (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">📋 Tasks</p>
                    <ul className="space-y-1">
                      {item.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-purple-400 font-bold mt-0.5">✓</span>{task}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <LockedRow label="📋 Tasks" onUnlock={onUnlock} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">🎨 Canva</p>
                  <p className="text-xs text-gray-600">{design.size}</p>
                  <p className="text-xs text-gray-500">{design.style}</p>
                </div>
                <div>
                  {isPremium ? (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">🔑 Keywords</p>
                      {item.keywords.slice(0, 2).map((kw, i) => (
                        <p key={i} className="text-xs text-gray-600 truncate">{kw}</p>
                      ))}
                    </>
                  ) : (
                    <LockedRow label="🔑 Keywords" onUnlock={onUnlock} />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isPremium ? (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">💵 {item.pricing}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">⏱ {item.time}</span>
                  </>
                ) : (
                  <LockedRow label="💵 Pricing" onUnlock={onUnlock} />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bundle Card ──────────────────────────────────────────────────────────────

function BundleCard({ days }: { days: PlanDay[] }) {
  const picks = [days[0], days[6], days[13]].filter(Boolean);
  if (picks.length < 2) return null;

  // Rough bundle price: take the highest individual price and multiply by 2.5
  const extractMax = (range: string) => {
    const nums = range.match(/[\d.]+/g);
    return nums ? Math.max(...nums.map(Number)) : 7.99;
  };
  const bundlePrice = (picks.reduce((sum, d) => sum + extractMax(d.pricing), 0) * 0.75).toFixed(2);

  return (
    <div data-testid="bundle-card" className="bg-gradient-to-br from-purple-50 to-orange-50 border border-purple-200 rounded-2xl p-5 mt-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">📦</span>
        <div>
          <p className="font-bold text-gray-800">Bundle Opportunity</p>
          <p className="text-sm text-gray-500">Combine these products to increase your revenue per sale.</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {picks.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            {d.title}
            <span className="text-gray-400 text-xs ml-auto">{d.pricing}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-purple-100">
        <div>
          <p className="text-xs text-gray-400">Sell as a bundle for</p>
          <p className="text-lg font-bold text-purple-700">${bundlePrice}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">vs. individual total</p>
          <p className="text-sm text-gray-500 line-through">${picks.reduce((s, d) => s + extractMax(d.pricing), 0).toFixed(2)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Bundles convert 3× better than single products — and take no extra creation time</p>
    </div>
  );
}

// ─── Main PlannerView ─────────────────────────────────────────────────────────

export default function PlannerView({ niche: parentNiche, isPremium, onUpgradeClick }: PlannerViewProps) {
  const [selectedNiche, setSelectedNiche] = useState(parentNiche ?? NICHES[0]);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState<{ errorCode?: string; devMessage?: string } | null>(null);
  const [actionMode, setActionMode] = useState(false);
  const [planFromCache, setPlanFromCache] = useState(false);

  const grouped = {
    Setup:  planDays.filter((d) => d.phase === "Setup"  || d.day <= 5),
    Build:  planDays.filter((d) => d.phase === "Build"  || (d.day > 5 && d.day <= 20)),
    Launch: planDays.filter((d) => d.phase === "Launch" || d.day > 20),
  } as Record<"Setup" | "Build" | "Launch", PlanDay[]>;

  // Deduplicate after phase assignment fallback
  if (planDays.length > 0 && grouped.Setup.length + grouped.Build.length + grouped.Launch.length > planDays.length) {
    grouped.Setup  = planDays.filter((d) => d.day <= 5);
    grouped.Build  = planDays.filter((d) => d.day > 5 && d.day <= 20);
    grouped.Launch = planDays.filter((d) => d.day > 20);
  }

  const handleGenerate = async () => {
    // Soft daily limit check (1 plan/day for free users)
    if (!isPremium && isAtLimit("planner")) {
      onUpgradeClick("planner_locked");
      return;
    }

    // ── Client cache check ──────────────────────────────────────────────────
    const ck = cacheKey("planner", selectedNiche);
    const cachedDays = getCache<PlanDay[]>(ck);
    if (cachedDays) {
      setPlanDays(cachedDays);
      setPlanFromCache(true);
      setError("");
      setFallback(null);
      trackEvent("cache_hit", { feature: "planner", niche: selectedNiche });
      return;
    }

    trackEvent("cache_miss", { feature: "planner", niche: selectedNiche });
    setLoading(true);
    setPlanDays([]);
    setError("");
    setFallback(null);
    setPlanFromCache(false);
    try {
      const res = await fetch("/api/generate-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: selectedNiche }),
      });
      const data = await res.json();

      // 403 from server-side monetization
      if (res.status === 403 && data.upgradeRequired) {
        onUpgradeClick("planner_locked");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      if (data.fallback) setFallback({ errorCode: data.errorCode, devMessage: data.devMessage });

      const days: PlanDay[] = data.days || [];
      setPlanDays(days);

      // Cache the result (don't cache fallback data)
      if (!data.fallback && days.length > 0) {
        setCache(ck, days);
        if (data.cached) setPlanFromCache(true); // server cache hit
      }

      // Track success + increment soft-limit counter
      trackEvent("planner_generated", { niche: selectedNiche });
      if (!isPremium) incrementTodayUsage("planner");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Input card */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">30-Day Sprint Plan</h2>
        <p className="text-sm text-gray-400 mb-5">
          A full month of daily sprint tasks — product creation, Canva setup, SEO keywords, pricing, and launch steps — so you know exactly what to do each day to earn.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Niche</label>
            <select
              data-testid="planner-niche-select"
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button
            data-testid="generate-plan-button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <><Spinner size={18} /> Building sprint…</> : <>🚀 Start 30-Day Sprint</>}
          </button>
        </div>

        {!isPremium && (
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            ⚡ Free: 1 sprint plan/day. Daily tasks, keywords, and pricing unlock with{" "}
            <button onClick={() => onUpgradeClick("planner_locked")} className="text-purple-500 font-semibold hover:underline">Sprint Pro</button>.
            {" "}Remaining today: {remainingToday("planner")}
          </p>
        )}
      </div>

      {error && <ErrorBanner message={error} className="mb-6" onRetry={handleGenerate} />}
      {fallback && !error && (
        <DemoBanner
          errorCode={fallback.errorCode}
          devMessage={fallback.devMessage}
          onRetry={handleGenerate}
          className="mb-6"
        />
      )}

      {/* Results */}
      {planDays.length > 0 && (
        <div data-testid="plan-results">
          {/* Controls */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-800">
                  30-day sprint · <span className="text-orange-500">{selectedNiche}</span>
                </h2>
                {planFromCache && (
                  <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">⚡ Instant</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Click any day to expand · Toggle Action Mode for step-by-step execution</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">⚡ Action Mode</span>
              <button
                data-testid="action-mode-toggle"
                onClick={() => setActionMode((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${actionMode ? "bg-orange-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${actionMode ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Phases */}
          {(["Setup", "Build", "Launch"] as const).map((phase) => {
            const phaseData = PHASES[phase];
            const days = grouped[phase];
            if (!days || days.length === 0) return null;

            return (
              <div key={phase} className="mb-8">
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-3 ${phaseData.color}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{phaseData.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${phaseData.badge}`}>{phaseData.days}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{phaseData.desc}</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-200">{days.length}</span>
                </div>
                <div className="space-y-2">
                  {days.map((item) => (
                    <DayCard
                      key={item.day}
                      item={item}
                      actionMode={actionMode}
                      isPremium={isPremium}
                      onUnlock={() => onUpgradeClick("planner_locked")}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Bundle suggestion */}
          <BundleCard days={planDays} />

          {/* Regenerate */}
          <div className="text-center mt-6">
            <button onClick={handleGenerate} className="text-xs text-gray-400 hover:text-orange-500 transition-colors">↺ Regenerate plan</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && planDays.length === 0 && !error && (
        <div data-testid="planner-empty-state" className="text-center py-20">
          <div className="text-5xl mb-4">🚀</div>
          <p className="text-gray-500 font-medium">Plan your entire month in seconds.</p>
          <p className="text-sm text-gray-400 mt-1">Each sprint day has a product, tasks, Canva setup, keywords, pricing, and exact steps to earn.</p>
        </div>
      )}
    </div>
  );
}
