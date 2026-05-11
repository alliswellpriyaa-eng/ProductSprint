"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { NicheData } from "@/data/niches";
import { trackEvent, isAtLimit, incrementTodayUsage, remainingToday } from "@/lib/analytics";
import { getCache, setCache, cacheKey } from "@/lib/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketScore {
  demand: number; // 1–10
  competition: "Low" | "Medium" | "High";
  seoOpportunity: "Low" | "Medium" | "High";
  trend: "Rising" | "Stable" | "Seasonal";
  beginnerFriendly: boolean;
  estimatedPriceRange: string;
}

export interface Idea {
  title: string;
  description: string;
  marketScore?: MarketScore;
  whyThisCouldSell?: string;
}

interface ListingContent {
  etsyTitle: string;
  description: string;
  bulletPoints: string[];
  thumbnailText: string;
  canvaPrompt: string;
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
  productName?: string;
  tagline?: string;
  description?: string;
  salesBullets?: string[];
  suggestedPrice?: string;
  tags?: string[];
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

// ─── Module-level caches ──────────────────────────────────────────────────────
const productCache = new Map<string, ProductDetails>();
const examplesCache = new Map<string, Examples>();
const platformCacheMap = new Map<string, PlatformContent>();
const listingCache = new Map<string, ListingContent>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg style={{ width: size, height: size }} className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function DemandBar({ value }: { value: number }) {
  const pct = Math.round((value / 10) * 100);
  const color = value >= 8 ? "bg-green-500" : value >= 5 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>{label}</span>;
}

function competitionColor(c: "Low" | "Medium" | "High") {
  return { Low: "bg-green-100 text-green-700", Medium: "bg-yellow-100 text-yellow-700", High: "bg-red-100 text-red-700" }[c];
}
function seoColor(s: "Low" | "Medium" | "High") {
  return { Low: "bg-gray-100 text-gray-600", Medium: "bg-blue-100 text-blue-700", High: "bg-purple-100 text-purple-700" }[s];
}
function trendIcon(t: "Rising" | "Stable" | "Seasonal") {
  return { Rising: "↑ Rising", Stable: "→ Stable", Seasonal: "◎ Seasonal" }[t];
}
function trendColor(t: "Rising" | "Stable" | "Seasonal") {
  return { Rising: "bg-emerald-100 text-emerald-700", Stable: "bg-gray-100 text-gray-600", Seasonal: "bg-orange-100 text-orange-700" }[t];
}

function LockGate({ onUpgrade, label }: { onUpgrade: () => void; label: string }) {
  return (
    <div data-testid="lock-gate" className="rounded-xl border border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-orange-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>🔒</span>
        <span className="text-sm font-semibold text-purple-700">{label}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {["Full SEO strategy", "Listing optimization", "Daily execution steps", "AI product validation", "Etsy launch checklist"].map((f) => (
          <span key={f} className="text-xs text-purple-600 flex items-center gap-1">✓ {f}</span>
        ))}
      </div>
      <button onClick={onUpgrade} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white text-xs font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
        Upgrade to unlock →
      </button>
    </div>
  );
}

// ─── Create Product Modal ─────────────────────────────────────────────────────

function CreateProductModal({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  const lsKey = cacheKey("product", idea.title);
  const initData = productCache.get(idea.title) ?? getCache<ProductDetails>(lsKey) ?? null;
  const [details, setDetails] = useState<ProductDetails | null>(initData);
  const [loading, setLoading] = useState(initData === null);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(initData !== null);
  const fetchedRef = useRef(false);

  if (!fetchedRef.current && details === null && !loading) {
    fetchedRef.current = true;
  }

  // Fetch on mount
  if (details === null && !fetchedRef.current) {
    fetchedRef.current = true;
    fetch("/api/create-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: idea.title }),
    }).then(res => res.json()).then(data => {
      productCache.set(idea.title, data);
      setCache(lsKey, data);
      if (data.cached) setFromCache(true);
      setDetails(data);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }

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
          <button onClick={onClose} className="flex-shrink-0 ml-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
        </div>
        <div className="p-5 space-y-5">
          {loading && <div className="flex flex-col items-center py-8 gap-3"><Spinner size={28} className="text-purple-500" /><p className="text-sm text-gray-400">Building your product plan…</p></div>}
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

// ─── Platform Modal ───────────────────────────────────────────────────────────

function PlatformModal({ idea, platform, onClose }: { idea: Idea; platform: "gumroad" | "shopify"; onClose: () => void }) {
  const ck = `${idea.title}:${platform}`;
  const [content, setContent] = useState<PlatformContent | null>(() => platformCacheMap.get(ck) ?? null);
  const [loading, setLoading] = useState(!platformCacheMap.has(ck));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  if (!platformCacheMap.has(ck) && !fetchedRef.current && content === null) {
    fetchedRef.current = true;
    fetch("/api/generate-platform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title, platform }) })
      .then(res => res.json())
      .then(data => { platformCacheMap.set(ck, data); setContent(data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  const copyText = async (text: string, key: string) => { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000); };
  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copyText(text, id)} className="text-xs text-gray-400 hover:text-purple-600 px-1">{copied === id ? "✓" : "⎘"}</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${platform === "gumroad" ? "text-pink-600" : "text-green-600"}`}>{platform === "gumroad" ? "🛒 Gumroad" : "🏪 Shopify"} Listing</p>
            <h3 className="text-base font-bold text-gray-900">{idea.title}</h3>
          </div>
          <button onClick={onClose} className="flex-shrink-0 ml-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {loading && <div className="flex flex-col items-center py-8 gap-3"><Spinner size={24} className="text-purple-500" /><p className="text-sm text-gray-400">Generating content…</p></div>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {content && platform === "gumroad" && (
            <>
              {content.tagline && <div className="bg-pink-50 rounded-xl p-3 flex items-start justify-between gap-2"><p className="text-sm font-semibold text-pink-800 italic">&ldquo;{content.tagline}&rdquo;</p><CopyBtn text={content.tagline} id="tagline" /></div>}
              {content.description && <div><div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</p><CopyBtn text={content.description} id="desc" /></div><p className="text-sm text-gray-700 whitespace-pre-line">{content.description}</p></div>}
              {content.salesBullets && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selling Points</p><ul className="space-y-1.5">{content.salesBullets.map((b, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-pink-400">✓</span>{b}</li>)}</ul></div>}
              {content.suggestedPrice && <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400 uppercase">Price</span><span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">{content.suggestedPrice}</span></div>}
            </>
          )}
          {content && platform === "shopify" && (
            <>
              {content.productTitle && <div><div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Title</p><CopyBtn text={content.productTitle} id="title" /></div><p className="text-sm font-semibold text-gray-800 bg-green-50 rounded-lg p-2.5">{content.productTitle}</p></div>}
              {content.metaDescription && <div><div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meta Description</p><CopyBtn text={content.metaDescription} id="meta" /></div><p className="text-sm text-gray-600 italic">{content.metaDescription}</p></div>}
              {content.description && <div><div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</p><CopyBtn text={content.description} id="desc" /></div><p className="text-sm text-gray-700">{content.description}</p></div>}
              {content.bulletPoints && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bullets</p><ul className="space-y-1.5">{content.bulletPoints.map((b, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500">•</span>{b}</li>)}</ul></div>}
              {content.suggestedPrice && <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400 uppercase">Price</span><span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">{content.suggestedPrice}</span></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main IdeaCard ────────────────────────────────────────────────────────────

export default function IdeaCard({ idea, index, isPremium, platform, nicheData, onUpgradeClick }: IdeaCardProps) {
  const ms = idea.marketScore;

  const [seoTitles, setSeoTitles] = useState<string[]>([]);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [seoFromCache, setSeoFromCache] = useState(false);
  const [copiedSeo, setCopiedSeo] = useState<number | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [tagsFromCache, setTagsFromCache] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);

  const [examples, setExamples] = useState<Examples | null>(() => examplesCache.get(idea.title) ?? null);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Remaining usage counts — must be state (not inline remainingToday() calls) to
  // avoid React hydration mismatches. localStorage is absent on the server so
  // remainingToday() would return the full limit there but a real value on the client.
  const [remainingSeo, setRemainingSeo] = useState<number | null>(null);
  const [remainingTags, setRemainingTags] = useState<number | null>(null);
  useEffect(() => {
    setRemainingSeo(remainingToday("seo"));
    setRemainingTags(remainingToday("tags"));
  }, []);

  const [listing, setListing] = useState<ListingContent | null>(() => listingCache.get(idea.title) ?? null);
  const [loadingListing, setLoadingListing] = useState(false);
  const [listingError, setListingError] = useState("");
  const [showListing, setShowListing] = useState(false);
  const [activeListingTab, setActiveListingTab] = useState<"listing" | "thumbnail" | "canva">("listing");
  const [copiedListing, setCopiedListing] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showWhySell, setShowWhySell] = useState(false);

  const listingFetchedRef = useRef(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSeo = useCallback(async () => {
    if (!isPremium && isAtLimit("seo")) { trackEvent("premium_feature_clicked", { feature: "seo" }); onUpgradeClick("limit_reached"); return; }
    if (seoTitles.length > 0) { setShowSeo((v) => !v); return; }
    const ck = cacheKey("seo", idea.title);
    const cached = getCache<string[]>(ck);
    if (cached) { setSeoTitles(cached); setSeoFromCache(true); setShowSeo(true); return; }
    trackEvent("seo_generated", { idea: idea.title });
    if (!isPremium) { incrementTodayUsage("seo"); setRemainingSeo(remainingToday("seo")); }
    setLoadingSeo(true); setShowSeo(true);
    try {
      const res = await fetch("/api/generate-seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title }) });
      const data = await res.json();
      if (res.status === 403 && data.upgradeRequired) { onUpgradeClick("limit_reached"); return; }
      if (!res.ok) throw new Error(data.error || "Failed");
      setSeoTitles(data.titles);
      if (data.cached) setSeoFromCache(true);
      setCache(ck, data.titles);
    } catch { /* silent */ }
    finally { setLoadingSeo(false); }
  }, [idea.title, isPremium, onUpgradeClick, seoTitles.length]);

  const handleTags = useCallback(async () => {
    if (!isPremium && isAtLimit("tags")) { trackEvent("premium_feature_clicked", { feature: "tags" }); onUpgradeClick("limit_reached"); return; }
    if (tags.length > 0) { setShowTags((v) => !v); return; }
    const ck = cacheKey("tags", idea.title);
    const cached = getCache<string[]>(ck);
    if (cached) { setTags(cached); setTagsFromCache(true); setShowTags(true); return; }
    trackEvent("tags_generated", { idea: idea.title });
    if (!isPremium) { incrementTodayUsage("tags"); setRemainingTags(remainingToday("tags")); }
    setLoadingTags(true); setShowTags(true);
    try {
      const res = await fetch("/api/generate-tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title }) });
      const data = await res.json();
      if (res.status === 403 && data.upgradeRequired) { onUpgradeClick("limit_reached"); return; }
      if (!res.ok) throw new Error(data.error || "Failed");
      setTags(data.tags);
      if (data.cached) setTagsFromCache(true);
      setCache(ck, data.tags);
    } catch { /* silent */ }
    finally { setLoadingTags(false); }
  }, [idea.title, isPremium, onUpgradeClick, tags.length]);

  const handleExamples = useCallback(async () => {
    if (examples) { setShowExamples((v) => !v); return; }
    const ck = cacheKey("examples", idea.title);
    const cached = getCache<Examples>(ck);
    if (cached) { examplesCache.set(idea.title, cached); setExamples(cached); setShowExamples(true); return; }
    setLoadingExamples(true); setShowExamples(true);
    try {
      const res = await fetch("/api/examples", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      examplesCache.set(idea.title, data); setExamples(data); setCache(ck, data);
    } catch { /* silent */ }
    finally { setLoadingExamples(false); }
  }, [idea.title, examples]);

  const handleListing = useCallback(async () => {
    if (!isPremium) { trackEvent("generate_listing_clicked", { idea: idea.title, premium: false }); onUpgradeClick("generate_listing"); return; }
    trackEvent("generate_listing_clicked", { idea: idea.title, premium: true });
    if (listing) { setShowListing((v) => !v); return; }
    if (listingFetchedRef.current) return;
    listingFetchedRef.current = true;
    setLoadingListing(true); setShowListing(true); setListingError("");
    try {
      const res = await fetch("/api/generate-listing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: idea.title }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      listingCache.set(idea.title, data); setListing(data);
    } catch (e: unknown) { setListingError(e instanceof Error ? e.message : "Error"); listingFetchedRef.current = false; }
    finally { setLoadingListing(false); }
  }, [idea.title, isPremium, onUpgradeClick, listing]);

  const copyText = async (text: string, key: string) => { await navigator.clipboard.writeText(text); setCopiedListing(key); setTimeout(() => setCopiedListing(null), 2000); };

  const toggleSave = useCallback(() => {
    if (!isPremium) { trackEvent("premium_feature_clicked", { feature: "save_idea" }); onUpgradeClick("save_idea"); return; }
    const key = "etsy_saved_ideas";
    const current = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    const updated = saved ? current.filter((t) => t !== idea.title) : [...current, idea.title];
    localStorage.setItem(key, JSON.stringify(updated));
    setSaved(!saved);
  }, [idea.title, saved, isPremium, onUpgradeClick]);

  // ── Derived market score (falls back to nicheData) ────────────────────────

  const demand = ms?.demand ?? (nicheData?.demand === "High" ? 8 : nicheData?.demand === "Medium" ? 5 : 3);
  const competition = ms?.competition ?? nicheData?.competition ?? "Medium";
  const seoOpp = ms?.seoOpportunity ?? "Medium";
  const trend = ms?.trend ?? "Stable";
  const priceRange = ms?.estimatedPriceRange ?? nicheData?.avgPrice ?? "$5–$12";
  const beginnerFriendly = ms?.beginnerFriendly ?? true;
  const isBestIdea = demand >= 8 && competition === "Low";
  const platformIsPremium = platform !== "etsy" && !isPremium;

  return (
    <>
      <div
        data-testid="idea-card"
        className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden ${isBestIdea ? "border-purple-300 ring-2 ring-purple-100" : "border-gray-100"}`}
      >
        {/* Best Idea Banner */}
        {isBestIdea && (
          <div className="bg-gradient-to-r from-purple-600 to-orange-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1.5">
            🔥 HIGH POTENTIAL — Low competition, high demand
          </div>
        )}

        <div className="p-5 flex flex-col gap-4">
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

          {/* Market Score */}
          <div className="bg-gray-50 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Market Analysis</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${demand >= 8 ? "bg-green-100 text-green-700" : demand >= 5 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                {demand >= 8 ? "🔥 Hot" : demand >= 5 ? "📈 Good" : "⚠️ Niche"}
              </span>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">Buyer Demand</span>
                <span className="text-xs text-gray-400">{demand}/10</span>
              </div>
              <DemandBar value={demand} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Pill label={`⚔️ ${competition} Competition`} color={competitionColor(competition)} />
              <Pill label={`🔍 SEO ${seoOpp}`} color={seoColor(seoOpp)} />
              <Pill label={trendIcon(trend)} color={trendColor(trend)} />
              <Pill label={`💵 ${priceRange}`} color="bg-gray-100 text-gray-600" />
              {beginnerFriendly && <Pill label="✅ Beginner" color="bg-blue-50 text-blue-600" />}
            </div>
          </div>

          {/* Why This Could Sell */}
          {idea.whyThisCouldSell && (
            <div>
              <button onClick={() => setShowWhySell((v) => !v)} className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold hover:text-purple-800 transition-colors">
                💡 Why this could sell {showWhySell ? "▲" : "▼"}
              </button>
              {showWhySell && (
                <p className="mt-2 text-xs text-gray-600 leading-relaxed bg-purple-50 rounded-lg px-3 py-2.5 border border-purple-100">
                  {idea.whyThisCouldSell}
                </p>
              )}
            </div>
          )}

          {/* Primary CTA */}
          {isPremium ? (
            <button
              data-testid="create-product-button"
              onClick={() => { trackEvent("create_product_clicked", { idea: idea.title }); setShowModal(true); }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              🛠 Sprint This Product
            </button>
          ) : (
            <LockGate
              onUpgrade={() => { trackEvent("premium_feature_clicked", { feature: "create_product" }); onUpgradeClick("premium_click"); }}
              label="Unlock Full Sprint Blueprint"
            />
          )}

          {/* Platform CTA */}
          {platform !== "etsy" && !platformIsPremium && (
            <button onClick={() => setShowPlatformModal(true)} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              {platform === "gumroad" ? "🛒 Generate Gumroad Listing" : "🏪 Generate Shopify Content"}
            </button>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleListing}
              disabled={loadingListing}
              className={`col-span-2 text-xs py-2 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${showListing && listing ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"} disabled:cursor-not-allowed`}
            >
              {loadingListing ? <><Spinner size={12} /> Generating listing…</> : <>{showListing && listing ? "📋 Hide Listing" : "📋 Generate Etsy Listing"}{!isPremium && <span className="opacity-60">🔒</span>}</>}
            </button>

            <button data-testid="seo-button" onClick={handleSeo} disabled={loadingSeo} className={`text-xs py-2 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${showSeo && seoTitles.length > 0 ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"} disabled:cursor-not-allowed`}>
              {loadingSeo ? <Spinner size={12} /> : "✦"} SEO {!isPremium && remainingSeo !== null && <span className="opacity-60 text-xs">({remainingSeo})</span>}
            </button>

            <button data-testid="tags-button" onClick={handleTags} disabled={loadingTags} className={`text-xs py-2 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${showTags && tags.length > 0 ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600 hover:bg-orange-100"} disabled:cursor-not-allowed`}>
              {loadingTags ? <Spinner size={12} /> : "#"} Tags {!isPremium && remainingTags !== null && <span className="opacity-60 text-xs">({remainingTags})</span>}
            </button>

            <button data-testid="examples-button" onClick={handleExamples} disabled={loadingExamples} className={`col-span-2 text-xs py-2 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${showExamples && examples ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"} disabled:cursor-not-allowed`}>
              {loadingExamples ? <Spinner size={12} /> : "👀"} Real Etsy Examples
            </button>
          </div>

          {/* Generate Listing Results */}
          {showListing && (
            <div className="space-y-3">
              {listingError && <p className="text-red-500 text-xs">{listingError}</p>}
              {loadingListing && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}</div>}
              {listing && (
                <>
                  <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                    {(["listing", "thumbnail", "canva"] as const).map((tab) => (
                      <button key={tab} onClick={() => setActiveListingTab(tab)} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${activeListingTab === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        {tab === "listing" ? "📋 Listing" : tab === "thumbnail" ? "🖼 Thumb" : "🎨 Canva"}
                      </button>
                    ))}
                  </div>

                  {activeListingTab === "listing" && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Etsy Title</p>
                          <button onClick={() => copyText(listing.etsyTitle, "etsyTitle")} className="text-xs text-gray-400 hover:text-purple-600">{copiedListing === "etsyTitle" ? "✓ Copied" : "⎘ Copy"}</button>
                        </div>
                        <p className="text-xs text-gray-800 bg-purple-50 rounded-lg p-2.5 leading-relaxed">{listing.etsyTitle}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</p>
                          <button onClick={() => copyText(listing.description, "desc")} className="text-xs text-gray-400 hover:text-purple-600">{copiedListing === "desc" ? "✓ Copied" : "⎘ Copy"}</button>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{listing.description}</p>
                      </div>
                      {listing.bulletPoints?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">What&apos;s Included</p>
                          <ul className="space-y-1">
                            {listing.bulletPoints.map((b, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700"><span className="text-green-500 flex-shrink-0">✓</span>{b}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {activeListingTab === "thumbnail" && (
                    <div className="space-y-3">
                      <div className="bg-gray-900 rounded-xl p-5 text-center">
                        <p className="text-white font-black text-lg leading-tight uppercase">{listing.thumbnailText}</p>
                        <p className="text-gray-500 text-xs mt-2">Thumbnail overlay text preview</p>
                      </div>
                      <button onClick={() => copyText(listing.thumbnailText, "thumb")} className="w-full text-xs py-2 border border-gray-200 rounded-lg text-gray-500 hover:text-purple-600 hover:border-purple-200 transition-colors">
                        {copiedListing === "thumb" ? "✓ Copied!" : "⎘ Copy thumbnail text"}
                      </button>
                    </div>
                  )}
                  {activeListingTab === "canva" && (
                    <div className="space-y-3">
                      <div className="bg-orange-50 rounded-xl p-3.5">
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.canvaPrompt}</p>
                      </div>
                      <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-gradient-to-r from-purple-600 to-orange-500 text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                        Open Canva & Start Creating →
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SEO Results */}
          {showSeo && (
            <div data-testid="seo-results" className="space-y-2">
              {loadingSeo && [1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
              {seoTitles.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">SEO Titles</p>
                    {seoFromCache && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">⚡ Instant</span>}
                  </div>
                  {seoTitles.map((title, i) => (
                    <div key={i} className="flex items-start gap-2 bg-blue-50 rounded-lg p-2.5">
                      <p className="flex-1 text-xs text-gray-700 leading-relaxed">{title}</p>
                      <button onClick={async () => { await navigator.clipboard.writeText(title); setCopiedSeo(i); setTimeout(() => setCopiedSeo(null), 2000); }} className="flex-shrink-0 text-blue-400 hover:text-blue-700 text-xs">{copiedSeo === i ? "✓" : "⎘"}</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Tags Results */}
          {showTags && (
            <div data-testid="tags-results">
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

          {/* Examples Results */}
          {showExamples && (
            <div data-testid="examples-results" className="bg-gray-50 rounded-xl p-3.5 space-y-3">
              {loadingExamples && <><div className="h-4 bg-gray-200 rounded animate-pulse" /><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" /></>}
              {examples && (
                <>
                  <div>{examples.titles.map((t, i) => <p key={i} className="text-xs text-gray-700 leading-snug mb-1 italic">&ldquo;{t}&rdquo;</p>)}</div>
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full inline-block">💵 {examples.priceRange}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">What buyers get:</p>
                    <ul className="space-y-0.5">{examples.includes.map((item, i) => <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5"><span className="text-gray-400">•</span>{item}</li>)}</ul>
                  </div>
                  {examples.sellerTip && <div className="border-t border-gray-200 pt-2"><p className="text-xs text-orange-700 font-medium">⚡ Seller tip: {examples.sellerTip}</p></div>}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <CreateProductModal idea={idea} onClose={() => setShowModal(false)} />}
      {showPlatformModal && platform !== "etsy" && <PlatformModal idea={idea} platform={platform} onClose={() => setShowPlatformModal(false)} />}
    </>
  );
}
