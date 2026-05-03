"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NicheData } from "@/data/niches";
import { trackEvent, isAtLimit, incrementTodayUsage, remainingToday } from "@/lib/analytics";
import { getCache, setCache, cacheKey, isCached } from "@/lib/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Idea {
  title: string;
  description: string;
}

interface Analysis {
  demand: "High" | "Medium" | "Low";
  competition: "High" | "Medium" | "Low";
  potential: "High" | "Medium" | "Low";
  audience: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface ProductDetails {
  pages: string[];
  size: string;
  orientation: string;
  style: string;
  tips: string[];
}

interface Examples {
  titles: string[];
  priceRange: string;
  includes: string[];
  sellerTip: string;
}

interface PlatformContent {
  platform: string;
  // Gumroad
  productName?: string;
  tagline?: string;
  description?: string;
  salesBullets?: string[];
  suggestedPrice?: string;
  tags?: string[];
  // Shopify
  productTitle?: string;
  metaDescription?: string;
  bulletPoints?: string[];
  productType?: string;
}

export interface IdeaCardProps {
  idea: Idea;
  index: number;
  isPremium: boolean;
  platform: "etsy" | "gumroad" | "shopify";
  nicheData?: NicheData | null;
  onUpgradeClick: (source?: string) => void;
}

// ─── Module-level cache (survives re-renders, resets on page refresh) ─────────
const analysisCache = new Map<string, Analysis>();
const productCache = new Map<string, ProductDetails>();
const examplesCache = new Map<string, Examples>();
const platformCache = new Map<string, PlatformContent>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(value: "High" | "Medium" | "Low", invert = false) {
  const map = invert
    ? { High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700" }
    : { High: "bg-green-100 text-green-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-red-100 text-red-700" };
  return map[value];
}

function effortColor(d: "Easy" | "Medium" | "Hard") {
  return { Easy: "text-green-600", Medium: "text-yellow-600", Hard: "text-red-600" }[d];
}

function getBadges(analysis: Analysis | null) {
  if (!analysis) return [];
  const badges: { label: string; color: string }[] = [];
  if (analysis.demand === "High" && analysis.competition === "Low")
    badges.push({ label: "🔥 BEST IDEA", color: "bg-purple-600 text-white" });
  if (analysis.competition === "Low")
    badges.push({ label: "🟢 LOW COMPETITION", color: "bg-green-100 text-green-700" });
  if (analysis.potential === "High" && analysis.demand === "High")
    badges.push({ label: "💰 HIGH PROFIT", color: "bg-amber-100 text-amber-700" });
  return badges;
}

function getDecisionPoints(analysis: Analysis): { ok: boolean; text: string }[] {
  return [
    { ok: analysis.difficulty === "Easy" || analysis.difficulty === "Medium", text: `${analysis.difficulty} to create in Canva` },
    { ok: analysis.competition !== "High", text: analysis.competition === "Low" ? "Low competition — easier to rank" : "Medium competition — manageable" },
    { ok: analysis.demand !== "Low", text: analysis.demand === "High" ? "High buyer demand on Etsy" : "Moderate buyer demand" },
    { ok: analysis.potential !== "Low", text: `${analysis.potential} profit potential` },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg style={{ width: size, height: size }} className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SkeletonPill() {
  return <span className="inline-block h-5 w-20 bg-gray-200 rounded-full animate-pulse" />;
}

function LockGate({ onUpgrade, label }: { onUpgrade: () => void; label: string }) {
  return (
    <button
      data-testid="lock-gate"
      onClick={onUpgrade}
      className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-dashed border-gray-300 text-gray-400 text-xs py-2.5 rounded-xl hover:bg-purple-50 hover:border-purple-300 hover:text-purple-500 transition-all"
    >
      🔒 {label} — <span className="font-semibold text-purple-500">Upgrade to unlock</span>
    </button>
  );
}

// ─── Create Product Modal ─────────────────────────────────────────────────────

function CreateProductModal({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  const lsCacheKey = cacheKey("product", idea.title);
  const initData = productCache.get(idea.title) ?? getCache<ProductDetails>(lsCacheKey) ?? null;
  const [details, setDetails] = useState<ProductDetails | null>(initData);
  const [loading, setLoading] = useState(initData === null);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(initData !== null);

  useEffect(() => {
    if (details !== null) return; // already have data (memory or localStorage)
    (async () => {
      try {
        const res = await fetch("/api/create-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: idea.title }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        productCache.set(idea.title, data);
        setCache(lsCacheKey, data);
        if (data.cached) setFromCache(true);
        setDetails(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [idea.title, details, lsCacheKey]);

  return (
    <div data-testid="create-product-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">🛠 Sprint Blueprint</p>
              {fromCache && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">⚡ Instant</span>}
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-snug">{idea.title}</h3>
          </div>
          <button onClick={onClose} className="flex-shrink-0 ml-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-5">
          {loading && <div className="flex flex-col items-center py-8 gap-3 text-gray-400"><Spinner size={28} className="text-purple-500" /><p className="text-sm">Building your product plan…</p></div>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {details && (
            <>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">🎨 Canva Setup</p>
                <div className="flex flex-wrap gap-2">
                  {[`📐 ${details.size}`, `🔄 ${details.orientation}`, `✨ ${details.style}`].map((t, i) => (
                    <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 rounded-lg px-3 py-1.5 font-medium">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📄 Product Structure</p>
                <div className="space-y-1.5">
                  {details.pages.map((page, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span>{page.replace(/^Page \d+:\s*/i, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">💡 Design Tips</p>
                <ul className="space-y-2">
                  {details.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 font-bold flex-shrink-0">✓</span>{tip}</li>
                  ))}
                </ul>
              </div>
              <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                Open Canva & Start Creating →
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Platform Content Modal ───────────────────────────────────────────────────

function PlatformModal({ idea, platform, onClose }: { idea: Idea; platform: "gumroad" | "shopify"; onClose: () => void }) {
  const cacheKey = `${idea.title}:${platform}`;
  const [content, setContent] = useState<PlatformContent | null>(() => platformCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!platformCache.has(cacheKey));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (platformCache.has(cacheKey)) return;
    (async () => {
      try {
        const res = await fetch("/api/generate-platform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: idea.title, platform }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        platformCache.set(cacheKey, data);
        setContent(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [idea.title, platform, cacheKey]);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copyText(text, id)} className="text-xs text-gray-400 hover:text-purple-600 transition-colors px-1">
      {copied === id ? "✓" : "⎘"}
    </button>
  );

  const platformLabel = platform === "gumroad" ? "Gumroad" : "Shopify";
  const platformColor = platform === "gumroad" ? "text-pink-600" : "text-green-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${platformColor}`}>
              {platform === "gumroad" ? "🛒" : "🏪"} {platformLabel} Listing
            </p>
            <h3 className="text-base font-bold text-gray-900 leading-snug">{idea.title}</h3>
          </div>
          <button onClick={onClose} className="flex-shrink-0 ml-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {loading && <div className="flex flex-col items-center py-8 gap-3 text-gray-400"><Spinner size={28} className="text-purple-500" /><p className="text-sm">Generating {platformLabel} content…</p></div>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {content && platform === "gumroad" && (
            <>
              {content.tagline && (
                <div className="bg-pink-50 rounded-xl p-3 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-pink-800 italic">&ldquo;{content.tagline}&rdquo;</p>
                  <CopyBtn text={content.tagline} id="tagline" />
                </div>
              )}
              {content.description && (
                <div>
                  <div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</p><CopyBtn text={content.description} id="desc" /></div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content.description}</p>
                </div>
              )}
              {content.salesBullets && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selling Points</p>
                  <ul className="space-y-1.5">
                    {content.salesBullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-pink-400 font-bold">✓</span>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
              {content.suggestedPrice && <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400 uppercase">Suggested Price</span><span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">{content.suggestedPrice}</span></div>}
            </>
          )}
          {content && platform === "shopify" && (
            <>
              {content.productTitle && (
                <div>
                  <div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Title</p><CopyBtn text={content.productTitle} id="title" /></div>
                  <p className="text-sm font-semibold text-gray-800 bg-green-50 rounded-lg p-2.5">{content.productTitle}</p>
                </div>
              )}
              {content.metaDescription && (
                <div>
                  <div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meta Description</p><CopyBtn text={content.metaDescription} id="meta" /></div>
                  <p className="text-sm text-gray-600 italic">{content.metaDescription}</p>
                </div>
              )}
              {content.description && (
                <div>
                  <div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</p><CopyBtn text={content.description} id="desc" /></div>
                  <p className="text-sm text-gray-700 leading-relaxed">{content.description}</p>
                </div>
              )}
              {content.bulletPoints && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Feature Bullets</p>
                  <ul className="space-y-1.5">
                    {content.bulletPoints.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 font-bold">•</span>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
              {content.suggestedPrice && <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400 uppercase">Suggested Price</span><span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">{content.suggestedPrice}</span></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main IdeaCard ────────────────────────────────────────────────────────────

export default function IdeaCard({ idea, index, isPremium, platform, nicheData, onUpgradeClick }: IdeaCardProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(() => {
    if (analysisCache.has(idea.title)) return analysisCache.get(idea.title)!;
    if (nicheData) {
      return { demand: nicheData.demand, competition: nicheData.competition, potential: nicheData.potential, audience: nicheData.audience, difficulty: nicheData.difficulty };
    }
    return null;
  });
  const [analysisLoading, setAnalysisLoading] = useState(!analysisCache.has(idea.title) && !nicheData);

  // Feature states
  const [seoTitles, setSeoTitles] = useState<string[]>([]);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [seoError, setSeoError] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [seoFromCache, setSeoFromCache] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagsError, setTagsError] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [tagsFromCache, setTagsFromCache] = useState(false);

  const [examples, setExamples] = useState<Examples | null>(() => examplesCache.get(idea.title) ?? null);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [examplesError, setExamplesError] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [copiedSeo, setCopiedSeo] = useState<number | null>(null);
  const [copiedTags, setCopiedTags] = useState(false);

  const fetchedRef = useRef(false);

  // ── Load saved state ────────────────────────────────────────────────────────
  useEffect(() => {
    const savedIdeas = JSON.parse(localStorage.getItem("etsy_saved_ideas") || "[]") as string[];
    setSaved(savedIdeas.includes(idea.title));
  }, [idea.title]);

  // ── Auto-load analysis (staggered) ─────────────────────────────────────────
  useEffect(() => {
    if (analysisCache.has(idea.title) || nicheData || fetchedRef.current) return;
    fetchedRef.current = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/analyze-idea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: idea.title }),
        });
        const data = await res.json();
        if (res.ok) {
          analysisCache.set(idea.title, data);
          setAnalysis(data);
        }
      } catch { /* silently fail */ }
      finally { setAnalysisLoading(false); }
    }, index * 350);
    return () => clearTimeout(timer);
  }, [idea.title, index, nicheData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSeo = useCallback(async () => {
    // Free users can generate SEO up to daily limit
    if (!isPremium && isAtLimit("seo")) {
      trackEvent("premium_feature_clicked", { feature: "seo", reason: "limit_reached" });
      onUpgradeClick("limit_reached");
      return;
    }

    // Toggle off if already shown
    if (seoTitles.length > 0) { setShowSeo((v) => !v); return; }

    // ── Client cache check ───────────────────────────────────────────────
    const ck = cacheKey("seo", idea.title);
    const cached = getCache<string[]>(ck);
    if (cached) {
      setSeoTitles(cached);
      setSeoFromCache(true);
      setShowSeo(true);
      trackEvent("cache_hit", { feature: "seo", idea: idea.title });
      return;
    }

    trackEvent("cache_miss", { feature: "seo", idea: idea.title });
    trackEvent("seo_generated", { idea: idea.title });
    if (!isPremium) incrementTodayUsage("seo");

    setLoadingSeo(true); setSeoError(""); setShowSeo(true); setSeoFromCache(false);
    try {
      const res = await fetch("/api/generate-seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title }) });
      const data = await res.json();
      if (res.status === 403 && data.upgradeRequired) { onUpgradeClick("limit_reached"); return; }
      if (!res.ok) throw new Error(data.error || "Failed");
      setSeoTitles(data.titles);
      // Cache the result — also flag server-side cache hits as instant
      if (data.cached) setSeoFromCache(true);
      setCache(ck, data.titles);
    } catch (e: unknown) { setSeoError(e instanceof Error ? e.message : "Error"); }
    finally { setLoadingSeo(false); }
  }, [idea.title, isPremium, onUpgradeClick, seoTitles.length]);

  const handleTags = useCallback(async () => {
    // Free users can generate tags up to daily limit
    if (!isPremium && isAtLimit("tags")) {
      trackEvent("premium_feature_clicked", { feature: "tags", reason: "limit_reached" });
      onUpgradeClick("limit_reached");
      return;
    }

    // Toggle off if already shown
    if (tags.length > 0) { setShowTags((v) => !v); return; }

    // ── Client cache check ───────────────────────────────────────────────
    const ck = cacheKey("tags", idea.title);
    const cached = getCache<string[]>(ck);
    if (cached) {
      setTags(cached);
      setTagsFromCache(true);
      setShowTags(true);
      trackEvent("cache_hit", { feature: "tags", idea: idea.title });
      return;
    }

    trackEvent("cache_miss", { feature: "tags", idea: idea.title });
    trackEvent("tags_generated", { idea: idea.title });
    if (!isPremium) incrementTodayUsage("tags");

    setLoadingTags(true); setTagsError(""); setShowTags(true); setTagsFromCache(false);
    try {
      const res = await fetch("/api/generate-tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title }) });
      const data = await res.json();
      if (res.status === 403 && data.upgradeRequired) { onUpgradeClick("limit_reached"); return; }
      if (!res.ok) throw new Error(data.error || "Failed");
      setTags(data.tags);
      if (data.cached) setTagsFromCache(true);
      setCache(ck, data.tags);
    } catch (e: unknown) { setTagsError(e instanceof Error ? e.message : "Error"); }
    finally { setLoadingTags(false); }
  }, [idea.title, isPremium, onUpgradeClick, tags.length]);

  const handleExamples = useCallback(async () => {
    if (examples) { setShowExamples((v) => !v); return; }

    // ── Client cache check ─────────────────────────────────────────────────
    const ck = cacheKey("examples", idea.title);
    const cached = getCache<Examples>(ck);
    if (cached) {
      examplesCache.set(idea.title, cached);
      setExamples(cached);
      setShowExamples(true);
      trackEvent("cache_hit", { feature: "examples", idea: idea.title });
      return;
    }

    setLoadingExamples(true); setExamplesError(""); setShowExamples(true);
    try {
      const res = await fetch("/api/examples", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      examplesCache.set(idea.title, data);
      setExamples(data);
      setCache(ck, data);
    } catch (e: unknown) { setExamplesError(e instanceof Error ? e.message : "Error"); }
    finally { setLoadingExamples(false); }
  }, [idea.title, examples]);

  const toggleSave = useCallback(() => {
    if (!isPremium) {
      trackEvent("premium_feature_clicked", { feature: "save_idea", idea: idea.title });
      onUpgradeClick("save_idea");
      return;
    }
    const key = "etsy_saved_ideas";
    const current = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    const updated = saved ? current.filter((t) => t !== idea.title) : [...current, idea.title];
    localStorage.setItem(key, JSON.stringify(updated));
    setSaved(!saved);
  }, [idea.title, saved, isPremium, onUpgradeClick]);

  const badges = getBadges(analysis);
  const isBestIdea = badges.some((b) => b.label.includes("BEST IDEA"));
  const decisionPoints = analysis ? getDecisionPoints(analysis) : [];

  const platformIsPremium = platform !== "etsy" && !isPremium;

  return (
    <>
      <div data-testid="idea-card" className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-4 ${isBestIdea ? "border-purple-300 ring-2 ring-purple-200 ring-offset-1" : "border-gray-100"}`}>

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{index + 1}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{idea.title}</h3>
              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{idea.description}</p>
            </div>
          </div>
          <button data-testid="save-button" onClick={toggleSave} className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${saved ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400 hover:text-red-400"}`}>
            {saved ? "❤️" : "🤍"}
          </button>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b, i) => <span key={i} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${b.color}`}>{b.label}</span>)}
          </div>
        )}

        {/* Market Analysis */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Market Analysis</p>
            {analysis && (
              <button onClick={() => setShowDecision((v) => !v)} className="text-xs text-purple-500 hover:text-purple-700 transition-colors">
                {showDecision ? "Hide" : "Should I make this? →"}
              </button>
            )}
          </div>

          {analysisLoading ? (
            <div className="flex gap-2 flex-wrap"><SkeletonPill /><SkeletonPill /><SkeletonPill /></div>
          ) : analysis ? (
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${scoreColor(analysis.demand)}`}>🔥 {analysis.demand} Demand</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${scoreColor(analysis.competition, true)}`}>⚠️ {analysis.competition} Competition</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${scoreColor(analysis.potential)}`}>💰 {analysis.potential} Potential</span>
            </div>
          ) : <p className="text-xs text-gray-400">Analysis unavailable</p>}

          {analysis && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-gray-200">
              <span className="text-xs text-gray-500 flex items-center gap-1">👥 <span className="font-medium text-gray-700">{analysis.audience}</span></span>
              <span className={`text-xs font-medium flex items-center gap-1 ${effortColor(analysis.difficulty)}`}>🎯 {analysis.difficulty} to make</span>
            </div>
          )}

          {/* Decision Layer */}
          {showDecision && analysis && (
            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              <p className="text-xs font-bold text-gray-600">Should You Make This?</p>
              {decisionPoints.map((point, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={point.ok ? "text-green-500" : "text-red-400"}>{point.ok ? "✔️" : "❌"}</span>
                  <span className={point.ok ? "text-gray-700" : "text-gray-500"}>{point.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        {isPremium ? (
          <button
            data-testid="create-product-button"
            onClick={() => {
              trackEvent("create_product_clicked", { idea: idea.title });
              setShowModal(true);
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            🛠 Sprint This Product
          </button>
        ) : (
          <LockGate
            onUpgrade={() => {
              trackEvent("premium_feature_clicked", { feature: "create_product", idea: idea.title });
              onUpgradeClick("premium_click");
            }}
            label="Sprint This Product"
          />
        )}

        {/* Export PDF — locked premium feature */}
        {!isPremium && (
          <button
            data-testid="export-pdf-button"
            onClick={() => {
              trackEvent("premium_feature_clicked", { feature: "export_pdf", idea: idea.title });
              onUpgradeClick("export_pdf");
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-xs py-2 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500 transition-all"
          >
            🔒 Export PDF — <span className="font-semibold text-orange-400">Join early access</span>
          </button>
        )}

        {/* Platform CTA (Gumroad / Shopify) */}
        {platform !== "etsy" && (
          platformIsPremium ? (
            <LockGate onUpgrade={onUpgradeClick} label={`${platform === "gumroad" ? "Gumroad" : "Shopify"} Listing Content`} />
          ) : (
            <button onClick={() => setShowPlatformModal(true)} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              {platform === "gumroad" ? "🛒 Generate Gumroad Listing" : "🏪 Generate Shopify Content"}
            </button>
          )
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-3 gap-1.5">
          <button data-testid="seo-button" onClick={handleSeo} disabled={loadingSeo} className={`text-xs py-2 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${showSeo && seoTitles.length > 0 ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"} disabled:cursor-not-allowed`}>
            {loadingSeo ? <Spinner size={12} /> : "✦"} SEO {!isPremium && <span className="text-purple-400 text-xs">({remainingToday("seo")})</span>}
          </button>
          <button data-testid="tags-button" onClick={handleTags} disabled={loadingTags} className={`text-xs py-2 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${showTags && tags.length > 0 ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600 hover:bg-orange-100"} disabled:cursor-not-allowed`}>
            {loadingTags ? <Spinner size={12} /> : "#"} Tags {!isPremium && <span className="text-orange-400 text-xs">({remainingToday("tags")})</span>}
          </button>
          <button data-testid="examples-button" onClick={handleExamples} disabled={loadingExamples} className={`text-xs py-2 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${showExamples && examples ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"} disabled:cursor-not-allowed`}>
            {loadingExamples ? <Spinner size={12} /> : "👀"} Examples
          </button>
        </div>

        {/* SEO */}
        {showSeo && (
          <div data-testid="seo-results" className="space-y-2">
            {seoError && <p className="text-red-500 text-xs">{seoError}</p>}
            {loadingSeo && [1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            {seoTitles.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">SEO Titles</p>
                  {seoFromCache && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">⚡ Instant</span>}
                </div>
                {seoTitles.map((title, i) => (
                  <div key={i} className="flex items-start gap-2 bg-purple-50 rounded-lg p-2.5">
                    <p className="flex-1 text-xs text-gray-700 leading-relaxed">{title}</p>
                    <button onClick={async () => { await navigator.clipboard.writeText(title); setCopiedSeo(i); setTimeout(() => setCopiedSeo(null), 2000); }} className="flex-shrink-0 text-purple-400 hover:text-purple-700 text-xs">{copiedSeo === i ? "✓" : "⎘"}</button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Tags */}
        {showTags && (
          <div data-testid="tags-results">
            {tagsError && <p className="text-red-500 text-xs">{tagsError}</p>}
            {loadingTags && <div className="flex flex-wrap gap-1.5">{Array(13).fill(0).map((_, i) => <span key={i} className="h-6 w-20 bg-gray-100 rounded-full animate-pulse inline-block" />)}</div>}
            {tags.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Etsy Tags</p>
                    {tagsFromCache && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">⚡ Instant</span>}
                  </div>
                  <button onClick={async () => { await navigator.clipboard.writeText(tags.join(", ")); setCopiedTags(true); setTimeout(() => setCopiedTags(false), 2000); }} className="text-xs text-orange-400 hover:text-orange-700">{copiedTags ? "✓ Copied!" : "Copy all"}</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-100 rounded-full px-2.5 py-0.5">{tag}</span>)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Examples */}
        {showExamples && (
          <div data-testid="examples-results" className="bg-blue-50 rounded-xl p-3.5 space-y-3">
            <p className="text-xs text-blue-400 italic">Sample listings (AI-generated)</p>
            {examplesError && <p className="text-red-500 text-xs">{examplesError}</p>}
            {loadingExamples && <><div className="h-4 bg-blue-100 rounded animate-pulse" /><div className="h-4 bg-blue-100 rounded animate-pulse w-3/4" /></>}
            {examples && (
              <>
                <div>{examples.titles.map((t, i) => <p key={i} className="text-xs text-gray-700 leading-snug mb-1 italic">&ldquo;{t}&rdquo;</p>)}</div>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full inline-block">💵 {examples.priceRange}</span>
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">What buyers get:</p>
                  <ul className="space-y-0.5">{examples.includes.map((item, i) => <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5"><span className="text-blue-400">•</span>{item}</li>)}</ul>
                </div>
                {examples.sellerTip && <div className="border-t border-blue-100 pt-2"><p className="text-xs text-blue-700 font-medium">⚡ Sprint tip: {examples.sellerTip}</p></div>}
              </>
            )}
          </div>
        )}
      </div>

      {showModal && <CreateProductModal idea={idea} onClose={() => setShowModal(false)} />}
      {showPlatformModal && platform !== "etsy" && <PlatformModal idea={idea} platform={platform} onClose={() => setShowPlatformModal(false)} />}
    </>
  );
}
