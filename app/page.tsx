"use client";

import { useState, useCallback, useEffect } from "react";
import IdeaCard, { type Idea } from "@/components/IdeaCard";
import PlannerView from "@/components/PlannerView";
import { getNicheData } from "@/data/niches";
import ErrorBanner from "@/components/ErrorBanner";
import DemoBanner from "@/components/DemoBanner";
import { useAuth } from "@/components/AuthProvider";
import UsageBadge from "@/components/UsageBadge";
import AuthModal from "@/components/AuthModal";
import EarlyAccessModal, { type EarlyAccessSource } from "@/components/EarlyAccessModal";
import {
  trackEvent,
  isAtLimit,
  incrementTodayUsage,
  remainingToday,
} from "@/lib/analytics";
import { getCache, setCache, cacheKey } from "@/lib/cache";

// ─── Constants ────────────────────────────────────────────────────────────────

const NICHES = [
  "Kids", "Wedding", "Productivity", "Fitness", "Budgeting", "Teachers",
  "Seasonal – Summer", "Seasonal – Christmas", "Seasonal – Halloween",
  "Self Care", "Small Business", "Travel",
];

const PRODUCT_TYPES = [
  "Planner", "Coloring Book", "Journal", "Checklist", "Tracker",
  "Workbook", "Template", "Sticker Sheet", "Wall Art Printable", "Activity Book",
];

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size }} className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="h-9 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-3 gap-1.5">
        <div className="h-8 bg-gray-100 rounded-lg" />
        <div className="h-8 bg-gray-100 rounded-lg" />
        <div className="h-8 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── (UpgradeModal removed — EarlyAccessModal used instead) ──────────────────

// ─── Platform Selector ────────────────────────────────────────────────────────

type Platform = "etsy" | "gumroad" | "shopify";

const PLATFORMS: { id: Platform; label: string; icon: string; desc: string }[] = [
  { id: "etsy",     label: "Etsy",     icon: "🏷️", desc: "SEO titles + tags" },
  { id: "gumroad",  label: "Gumroad",  icon: "🛒", desc: "Sales copy" },
  { id: "shopify",  label: "Shopify",  icon: "🏪", desc: "Product pages" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, refreshUser, monetizationEnabled } = useAuth();
  const [niche, setNiche] = useState(NICHES[0]);
  const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState("");
  const [ideasFallback, setIdeasFallback] = useState<{ errorCode?: string; devMessage?: string } | null>(null);
  const [ideasFromCache, setIdeasFromCache] = useState(false);
  const [activeTab, setActiveTab] = useState<"generator" | "planner">("generator");
  const [platform, setPlatform] = useState<Platform>("etsy");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<string | undefined>();

  // ── Early-access modal (replaces UpgradeModal in pre-monetization phase) ──────
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);
  const [earlyAccessSource, setEarlyAccessSource] = useState<EarlyAccessSource>("unknown");

  const openEarlyAccess = useCallback((source: EarlyAccessSource = "unknown") => {
    trackEvent("premium_feature_clicked", { source });
    setEarlyAccessSource(source);
    setEarlyAccessOpen(true);
  }, []);

  // ── Premium / limit state ──────────────────────────────────────────────────────
  // When real monetization is enabled: derive from Supabase user plan.
  // In pre-monetization (validation) phase: read a dev-only localStorage toggle;
  // everyone is "free" by default so soft limits + EarlyAccessModal are active.
  const [devPremiumOverride, setDevPremiumOverride] = useState(false);
  useEffect(() => {
    // Dev toggle: localStorage.setItem("ps_dev_premium", "true") in browser console
    setDevPremiumOverride(localStorage.getItem("ps_dev_premium") === "true");
  }, []);

  const isPremium = monetizationEnabled
    ? user?.plan === "premium"
    : devPremiumOverride; // false in production; toggle in dev via localStorage

  // Remaining uses today — server-side when monetization is on, localStorage otherwise
  const remainingFreeServer = monetizationEnabled
    ? Math.max(0, (user?.limits?.generate_ideas ?? 3) - (user?.usage?.generate_ideas ?? 0))
    : null;
  const remainingFreeLocal = remainingToday("ideas");
  const remainingFreeDisplay = remainingFreeServer ?? remainingFreeLocal;

  const atLimit = isPremium
    ? false
    : monetizationEnabled
      ? !!user && remainingFreeDisplay === 0
      : isAtLimit("ideas");

  const nicheData = getNicheData(niche);

  // Back-compat: components that call onUpgradeClick() get early-access modal
  const handleUpgradeClick = useCallback(
    (source?: string) => openEarlyAccess((source as EarlyAccessSource) ?? "premium_click"),
    [openEarlyAccess]
  );

  const handleGenerateIdeas = async () => {
    trackEvent("start_product_sprint_clicked", { niche, productType });

    // Require sign-in when monetization is on and user isn't logged in
    if (monetizationEnabled && !user) {
      setAuthModalReason("Sign in to generate product ideas — free, no credit card needed.");
      setShowAuthModal(true);
      return;
    }
    if (atLimit) {
      openEarlyAccess("limit_reached");
      return;
    }

    // ── Client cache check ────────────────────────────────────────────────────
    const ck = cacheKey("ideas", niche, productType);
    const cachedIdeas = getCache<Idea[]>(ck);
    if (cachedIdeas) {
      setIdeas(cachedIdeas);
      setIdeasFromCache(true);
      setIdeasError("");
      setIdeasFallback(null);
      trackEvent("cache_hit", { feature: "ideas", niche, productType });
      return;
    }

    trackEvent("cache_miss", { feature: "ideas", niche, productType });
    setLoadingIdeas(true);
    setIdeas([]);
    setIdeasError("");
    setIdeasFallback(null);
    setIdeasFromCache(false);
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, productType }),
      });
      const data = await res.json();

      // 401 — session expired or not signed in
      if (res.status === 401) {
        setAuthModalReason("Please sign in to continue generating ideas.");
        setShowAuthModal(true);
        return;
      }
      // 403 — daily limit reached (server-side monetization)
      if (res.status === 403 && data.upgradeRequired) {
        openEarlyAccess("limit_reached");
        return;
      }
      // Hard error (400/500 with no fallback data)
      if (!res.ok) throw new Error(data.error || "Failed to generate ideas");

      // Soft fallback: API returned sample data instead of crashing
      if (data.fallback) {
        setIdeasFallback({ errorCode: data.errorCode, devMessage: data.devMessage });
      }
      setIdeas(data.ideas);

      // Cache the result (don't cache fallback data — it's generic)
      if (!data.fallback && data.ideas?.length > 0) {
        setCache(ck, data.ideas);
        if (data.cached) setIdeasFromCache(true); // server cache hit
      }

      // Track success + increment soft-limit counter
      trackEvent("ideas_generated", { niche, productType, count: data.ideas?.length ?? 0 });
      if (!monetizationEnabled) incrementTodayUsage("ideas");

      // Refresh usage counts so the badge stays up to date
      if (monetizationEnabled) refreshUser();
    } catch (e: unknown) {
      setIdeasError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingIdeas(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      {/* ── Header ── */}
      <header data-testid="app-header" className="bg-white border-b border-purple-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow">PS</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">ProductSprint</h1>
              <p className="text-xs text-gray-400 mt-0.5">Turn ideas into Etsy products in 30 days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Free usage counter (pre-monetization phase) */}
            {!monetizationEnabled && !isPremium && (
              <span className="text-xs text-gray-400 hidden sm:block">
                {remainingFreeDisplay} free {remainingFreeDisplay === 1 ? "sprint" : "sprints"} left today
              </span>
            )}
            {/* Auth-aware badge — shows sign-in, usage, or manage subscription */}
            <UsageBadge onUpgrade={() => handleUpgradeClick("premium_click")} />
            {/* Pre-monetization: show "Go Pro" button that opens EarlyAccessModal */}
            {!monetizationEnabled && (
              <button
                data-testid="upgrade-button"
                onClick={() => openEarlyAccess("premium_click")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${isPremium ? "bg-purple-100 text-purple-700" : "bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:opacity-90"}`}
              >
                {isPremium ? "⚡ Sprint Pro" : "Go Pro →"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-1.5 shadow-sm border border-purple-100 w-fit">
          <button data-testid="tab-generator" onClick={() => setActiveTab("generator")} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "generator" ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            ⚡ Sprint Starter
          </button>
          <button data-testid="tab-planner" onClick={() => setActiveTab("planner")} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === "planner" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            🗓 30-Day Sprint Plan {!isPremium && <span className="text-xs opacity-70">🔒</span>}
          </button>
        </div>

        {/* ════════════════════════
            TAB 1 — IDEA GENERATOR
        ════════════════════════ */}
        {activeTab === "generator" && (
          <div>
            {/* Input card */}
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-1">Start Your Product Sprint</h2>
              <p className="text-sm text-gray-400 mb-5">
                Get 10 income-ready ideas with market scores, competition analysis, creation guides, and listing content — ready to launch.
              </p>

              {/* Platform selector */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-2">Platform</label>
                <div data-testid="platform-selector" className="flex gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${platform === p.id ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    >
                      <span className="text-base">{p.icon}</span>
                      <span>{p.label}</span>
                      <span className="text-gray-400 text-xs font-normal hidden sm:block">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Niche</label>
                  <select data-testid="niche-select" value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                    {NICHES.map((n) => <option key={n}>{n}</option>)}
                  </select>
                  {nicheData && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nicheData.demand === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>🔥 {nicheData.demand} demand</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">💵 {nicheData.avgPrice}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Type</label>
                  <select data-testid="product-type-select" value={productType} onChange={(e) => setProductType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                    {PRODUCT_TYPES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  {nicheData && (
                    <p className="text-xs text-gray-400 mt-1.5">Trending: {nicheData.trendingProducts.slice(0, 2).join(", ")}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <button
                  data-testid="generate-button"
                  onClick={handleGenerateIdeas}
                  disabled={loadingIdeas}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingIdeas ? <><Spinner /> Scouting products…</> : atLimit ? "🔒 Daily limit reached" : <>⚡ Start Product Sprint</>}
                </button>
                {!isPremium && !atLimit && (
                  <span className="text-xs text-gray-400">{remainingFreeDisplay} free {remainingFreeDisplay === 1 ? "sprint" : "sprints"} remaining today</span>
                )}
                {atLimit && (
                  <button onClick={() => openEarlyAccess("limit_reached")} className="text-xs text-purple-600 font-semibold hover:underline">
                    Get notified when Pro launches →
                  </button>
                )}
              </div>
            </div>

            {/* Niche tip */}
            {nicheData?.tip && ideas.length === 0 && !loadingIdeas && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 mb-6 flex items-start gap-2">
                <span>💡</span>
                <span><strong>Sprint tip:</strong> {nicheData.tip}</span>
              </div>
            )}

            {ideasError && <ErrorBanner message={ideasError} className="mb-6" onRetry={handleGenerateIdeas} />}
            {ideasFallback && !ideasError && (
              <DemoBanner
                errorCode={ideasFallback.errorCode}
                devMessage={ideasFallback.devMessage}
                onRetry={handleGenerateIdeas}
                className="mb-6"
              />
            )}

            {/* Skeleton */}
            {loadingIdeas && (
              <div data-testid="skeleton-loading" className="grid sm:grid-cols-2 gap-4 items-start">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Results */}
            {!loadingIdeas && ideas.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-gray-800">
                        10 sprint ideas · <span className="text-purple-600">{niche}</span> · <span className="text-orange-500">{productType}</span>
                        {platform !== "etsy" && <span className="text-gray-400"> · {PLATFORMS.find(p => p.id === platform)?.label}</span>}
                      </h2>
                      {ideasFromCache && (
                        <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">⚡ Instant</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Market scores auto-loading · Click 🛠 for your creation blueprint</p>
                  </div>
                  <button onClick={handleGenerateIdeas} disabled={atLimit} className="text-xs text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0 ml-4 disabled:opacity-40">↺ Regenerate</button>
                </div>
                <div data-testid="ideas-grid" className="grid sm:grid-cols-2 gap-4 items-start">
                  {ideas.map((idea, i) => (
                    <IdeaCard
                      key={`${idea.title}-${i}`}
                      idea={idea}
                      index={i}
                      isPremium={isPremium}
                      platform={platform}
                      nicheData={nicheData}
                      onUpgradeClick={handleUpgradeClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loadingIdeas && ideas.length === 0 && !ideasError && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">⚡</div>
                <p className="text-gray-500 font-medium">Ready to launch your next digital product?</p>
                <p className="text-gray-400 text-sm mt-1">Pick a niche and product type, then hit Sprint to get 10 income-ready ideas.</p>
                {nicheData && (
                  <div className="mt-6 inline-flex flex-col items-center gap-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{niche} — Top sprint opportunities</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-1">
                      {nicheData.trendingProducts.map((p) => (
                        <span key={p} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════
            TAB 2 — PLANNER
        ════════════════════════ */}
        {activeTab === "planner" && (
          <PlannerView
            niche={niche}
            isPremium={isPremium}
            onUpgradeClick={handleUpgradeClick}
          />
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-100 mt-8 space-y-1">
        <p>ProductSprint · Built for digital sellers · Powered by AI</p>
        <p>
          Questions?{" "}
          <a href="mailto:support@productsprint.app" className="text-purple-500 hover:underline">
            support@productsprint.app
          </a>
        </p>
      </footer>

      {/* Pre-monetization: EarlyAccessModal (email capture) */}
      <EarlyAccessModal
        isOpen={earlyAccessOpen}
        onClose={() => setEarlyAccessOpen(false)}
        source={earlyAccessSource}
      />
      {/* Full auth modal — used when MONETIZATION_ENABLED=true */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason={authModalReason}
        defaultTab="signup"
      />
    </div>
  );
}
