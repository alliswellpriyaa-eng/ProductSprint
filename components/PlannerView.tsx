"use client";

import { useState, useEffect } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import DemoBanner from "@/components/DemoBanner";
import { trackEvent, isAtLimit, incrementTodayUsage, remainingToday } from "@/lib/analytics";
import { getCache, setCache, cacheKey } from "@/lib/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanDay {
  day: number;
  phase: "Setup" | "Build" | "Launch";
  title: string;
  goal: string;
  tasks: string[];
  design?: { size: string; orientation: string; style: string; tool: string };
  keywords: string[];
  pricing: string;
  time: string;
  effort: "Easy" | "Medium" | "Hard";
  // New fields
  category?: "Research" | "Design" | "SEO" | "Listing" | "Marketing" | "Launch";
  estimatedTime?: string;
  completed?: boolean;
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
  Setup:  { label: "🎯 Sprint Setup",  days: "Days 1–5",   color: "border-purple-300 bg-purple-50", badge: "bg-purple-100 text-purple-700", desc: "Build your foundation & first product" },
  Build:  { label: "🔨 Sprint Build",  days: "Days 6–20",  color: "border-blue-300 bg-blue-50",     badge: "bg-blue-100 text-blue-700",   desc: "Ship your product catalog" },
  Launch: { label: "🚀 Sprint Launch", days: "Days 21–30", color: "border-green-300 bg-green-50",   badge: "bg-green-100 text-green-700", desc: "Optimise listings & start earning" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Research:  "bg-purple-100 text-purple-700",
  Design:    "bg-blue-100 text-blue-700",
  SEO:       "bg-yellow-100 text-yellow-700",
  Listing:   "bg-orange-100 text-orange-700",
  Marketing: "bg-pink-100 text-pink-700",
  Launch:    "bg-green-100 text-green-700",
};

const MILESTONES: Record<number, string> = {
  7:  "🎯 Week 1 complete",
  14: "⚡ Halfway there",
  21: "🚀 Launch phase!",
  30: "🏆 Sprint complete!",
};

const EFFORT_COLOR: Record<string, string> = {
  Easy:   "text-green-600 bg-green-50",
  Medium: "text-yellow-600 bg-yellow-50",
  Hard:   "text-red-600 bg-red-50",
};

const DEFAULT_DESIGN = { size: "US Letter (8.5×11 in)", orientation: "Portrait", style: "Minimal & Clean", tool: "Canva" };

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size }} className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Loading hint ─────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "🔍 Analyzing your niche…",
  "📅 Designing 30 days of products…",
  "✍️ Writing tasks & execution steps…",
  "💵 Calculating pricing strategy…",
  "🚀 Finalising your sprint plan…",
];

function PlannerLoadingHint() {
  const [step, setStep] = useState(0);
  useEffect(() => { const id = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 2200); return () => clearInterval(id); }, []);
  return (
    <div className="mt-4 flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
      <Spinner size={16} />
      <p className="text-sm text-orange-700 font-medium">{LOADING_STEPS[step]}</p>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Sprint Progress</span>
          <span className="text-xs text-gray-400">{completed}/{total} days</span>
        </div>
        <span className={`text-sm font-bold ${pct === 100 ? "text-green-600" : pct >= 50 ? "text-orange-500" : "text-purple-600"}`}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-orange-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct === 100 && <p className="text-xs text-green-600 font-medium mt-2 text-center">🏆 Sprint complete! You did it!</p>}
      {pct > 0 && pct < 100 && <p className="text-xs text-gray-400 mt-1.5">{total - completed} days remaining</p>}
    </div>
  );
}

// ─── Locked Row ───────────────────────────────────────────────────────────────

function LockedRow({ label, onUnlock }: { label: string; onUnlock: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <button onClick={onUnlock} className="text-xs text-purple-500 hover:text-purple-700 font-semibold flex items-center gap-1">
        🔒 <span className="underline">Join early access</span>
      </button>
    </div>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ item, actionMode, isPremium, onUnlock, isToday, onToggleComplete }: {
  item: PlanDay & { completed: boolean };
  actionMode: boolean;
  isPremium: boolean;
  onUnlock: () => void;
  isToday: boolean;
  onToggleComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(isToday);
  const phase = PHASES[item.phase] ?? PHASES.Build;
  const isOpen = expanded || actionMode;
  const design = item.design ?? DEFAULT_DESIGN;
  const isMilestone = MILESTONES[item.day];
  const category = item.category;
  const estimatedTime = item.estimatedTime ?? item.time;

  const actionSteps = [
    `Open Canva → Create new design (${design.size}, ${design.orientation})`,
    `Design your "${item.title}" using ${design.style} style`,
    ...item.tasks,
    `Export as PDF Print (high resolution)`,
    `Create Etsy listing — keyword: "${item.keywords[0] ?? "digital printable"}"`,
    `Set price at ${item.pricing} and publish`,
  ];

  return (
    <div>
      {/* Milestone marker */}
      {isMilestone && (
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
          <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">{isMilestone}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
        </div>
      )}

      {/* Today highlight */}
      {isToday && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs font-bold text-orange-500">TODAY&apos;S TASK</span>
        </div>
      )}

      <div
        data-testid="day-card"
        className={`rounded-xl border bg-white shadow-sm transition-all ${
          isToday ? "border-orange-300 ring-2 ring-orange-100 shadow-md" :
          item.completed ? "border-green-200 opacity-70" : "border-gray-100 hover:shadow-md"
        } border-l-4 ${phase.color.split(" ")[0]}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(); trackEvent("planner_task_completed", { day: item.day, title: item.title }); }}
            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${item.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"}`}
          >
            {item.completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>

          <button onClick={() => setExpanded((v) => !v)} className="flex-1 min-w-0 text-left flex items-start gap-3">
            <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${phase.badge}`}>{item.day}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold leading-snug ${item.completed ? "line-through text-gray-400" : "text-gray-800"}`}>{item.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <p className="text-xs text-gray-400">{item.goal}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {category && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-500"}`}>{category}</span>}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EFFORT_COLOR[item.effort] ?? EFFORT_COLOR.Easy}`}>{item.effort}</span>
              {estimatedTime && <span className="text-xs text-gray-400">⏱ {estimatedTime}</span>}
              <span className="text-gray-300 text-sm">{isOpen ? "▲" : "▼"}</span>
            </div>
          </button>
        </div>

        {/* Expanded content */}
        {isOpen && (
          <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-100">
            {actionMode && isPremium ? (
              <div className="space-y-2 pt-3">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">⚡ Action Steps</p>
                {actionSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-700 leading-snug">{step}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">💵 {item.pricing}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">⏱ {estimatedTime}</span>
                </div>
              </div>
            ) : (
              <div className="pt-3 space-y-3">
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
                        {item.keywords.slice(0, 2).map((kw, i) => <p key={i} className="text-xs text-gray-600 truncate">{kw}</p>)}
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
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">⏱ {estimatedTime}</span>
                    </>
                  ) : (
                    <LockedRow label="💵 Pricing" onUnlock={onUnlock} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bundle Card ──────────────────────────────────────────────────────────────

function BundleCard({ days }: { days: PlanDay[] }) {
  const picks = [days[0], days[6], days[13]].filter(Boolean);
  if (picks.length < 2) return null;
  const extractMax = (range: string) => { const nums = range.match(/[\d.]+/g); return nums ? Math.max(...nums.map(Number)) : 7.99; };
  const bundlePrice = (picks.reduce((sum, d) => sum + extractMax(d.pricing), 0) * 0.75).toFixed(2);

  return (
    <div data-testid="bundle-card" className="bg-gradient-to-br from-purple-50 to-orange-50 border border-purple-200 rounded-2xl p-5 mt-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">📦</span>
        <div><p className="font-bold text-gray-800">Bundle Opportunity</p><p className="text-sm text-gray-500">Combine these products to increase revenue per sale.</p></div>
      </div>
      <div className="space-y-2 mb-4">
        {picks.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
            {d.title}
            <span className="text-gray-400 text-xs ml-auto">{d.pricing}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-purple-100">
        <div><p className="text-xs text-gray-400">Bundle price</p><p className="text-lg font-bold text-purple-700">${bundlePrice}</p></div>
        <div className="text-right"><p className="text-xs text-gray-400">vs individual</p><p className="text-sm text-gray-500 line-through">${picks.reduce((s, d) => s + extractMax(d.pricing), 0).toFixed(2)}</p></div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Bundles convert 3× better than single products</p>
    </div>
  );
}

// ─── Main PlannerView ─────────────────────────────────────────────────────────

export default function PlannerView({ niche: parentNiche, isPremium, onUpgradeClick }: PlannerViewProps) {
  const [selectedNiche, setSelectedNiche] = useState(parentNiche ?? NICHES[0]);
  const [planDays, setPlanDays] = useState<(PlanDay & { completed: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState<{ errorCode?: string; devMessage?: string } | null>(null);
  const [actionMode, setActionMode] = useState(false);
  const [planFromCache, setPlanFromCache] = useState(false);
  // Hydration-safe remaining count — read from localStorage only after mount
  const [remainingPlanner, setRemainingPlanner] = useState<number | null>(null);
  useEffect(() => { setRemainingPlanner(remainingToday("planner")); }, []);

  // Load completion state from localStorage
  const getCompletionKey = (niche: string) => `ps_plan_completed_${niche}`;
  const loadCompletedDays = (niche: string): Set<number> => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem(getCompletionKey(niche)) || "[]")); }
    catch { return new Set(); }
  };
  const saveCompletedDays = (niche: string, set: Set<number>) => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(getCompletionKey(niche), JSON.stringify(Array.from(set))); } catch {}
  };

  const toggleComplete = (day: number) => {
    setPlanDays((prev) => {
      const updated = prev.map((d) => d.day === day ? { ...d, completed: !d.completed } : d);
      const completedSet = new Set(updated.filter((d) => d.completed).map((d) => d.day));
      saveCompletedDays(selectedNiche, completedSet);
      return updated;
    });
  };

  const completedCount = planDays.filter((d) => d.completed).length;
  const todayDay = completedCount + 1; // "today" is the next uncompleted day

  const grouped = {
    Setup:  planDays.filter((d) => d.day <= 5),
    Build:  planDays.filter((d) => d.day > 5 && d.day <= 20),
    Launch: planDays.filter((d) => d.day > 20),
  } as Record<"Setup" | "Build" | "Launch", (PlanDay & { completed: boolean })[]>;

  const handleGenerate = async () => {
    setError(""); setFallback(null);
    if (!isPremium && isAtLimit("planner")) { onUpgradeClick("planner_locked"); return; }

    const ck = cacheKey("planner", selectedNiche);
    const cachedDays = getCache<PlanDay[]>(ck);
    if (cachedDays) {
      const completed = loadCompletedDays(selectedNiche);
      setPlanDays(cachedDays.map((d) => ({ ...d, completed: completed.has(d.day) })));
      setPlanFromCache(true); setError(""); setFallback(null);
      trackEvent("cache_hit", { feature: "planner", niche: selectedNiche });
      return;
    }

    trackEvent("cache_miss", { feature: "planner", niche: selectedNiche });
    setLoading(true); setPlanDays([]); setPlanFromCache(false);
    try {
      const res = await fetch("/api/generate-planner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: selectedNiche }) });
      const data = await res.json();
      if (res.status === 403 && data.upgradeRequired) { onUpgradeClick("planner_locked"); return; }
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      if (data.fallback) setFallback({ errorCode: data.errorCode, devMessage: data.devMessage });

      const days: PlanDay[] = data.days || [];
      const completed = loadCompletedDays(selectedNiche);
      setPlanDays(days.map((d) => ({ ...d, completed: completed.has(d.day) })));

      if (!data.fallback && days.length > 0) {
        setCache(ck, days);
        if (data.cached) setPlanFromCache(true);
      }

      trackEvent("planner_generated", { niche: selectedNiche });
      if (!isPremium) incrementTodayUsage("planner");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div>
      {/* Input card */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">30-Day Sprint Plan</h2>
        <p className="text-sm text-gray-400 mb-5">
          A full month of daily tasks — product creation, Canva setup, SEO keywords, pricing, and launch steps. Know exactly what to do each day.
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
        {loading && <PlannerLoadingHint />}
        {!loading && !isPremium && (
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1 flex-wrap">
            ⚡ Free: 1 sprint plan/day · Daily tasks, keywords & pricing unlock with{" "}
            <button onClick={() => onUpgradeClick("planner_locked")} className="text-purple-500 font-semibold hover:underline">Sprint Pro</button>
            {remainingPlanner !== null && <>{" "}· {remainingPlanner} remaining today</>}
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
          subtitle="AI is busy right now — showing backup sprint plan."
        />
      )}

      {/* Results */}
      {planDays.length > 0 && (
        <div data-testid="plan-results">
          {/* Progress bar */}
          <ProgressBar completed={completedCount} total={planDays.length} />

          {/* Controls header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-gray-800">
                  30-day sprint · <span className="text-orange-500">{selectedNiche}</span>
                </h2>
                {planFromCache && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">⚡ Instant</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Click any day to expand · Toggle Action Mode for step-by-step execution</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500">⚡ Action Mode</span>
              <button
                data-testid="action-mode-toggle"
                onClick={() => setActionMode((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 overflow-hidden ${actionMode ? "bg-orange-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${actionMode ? "translate-x-6" : "translate-x-0"}`} />
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
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-200">{days.filter((d) => d.completed).length}/{days.length}</p>
                    <p className="text-xs text-gray-400">done</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {days.map((item) => (
                    <DayCard
                      key={item.day}
                      item={item}
                      actionMode={actionMode}
                      isPremium={isPremium}
                      onUnlock={() => onUpgradeClick("planner_locked")}
                      isToday={item.day === todayDay && !item.completed}
                      onToggleComplete={() => toggleComplete(item.day)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <BundleCard days={planDays} />
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
