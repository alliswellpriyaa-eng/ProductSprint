"use client";

import { useState } from "react";
import type { ResearchInsight } from "@/types/research";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onGenerateListing: (insight: ResearchInsight, input: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size }} className="animate-spin flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 8 ? "bg-green-100 text-green-700 border-green-200" :
    score >= 5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    "bg-red-100 text-red-700 border-red-200";
  const emoji = score >= 8 ? "🔥" : score >= 5 ? "📈" : "⚠️";
  return (
    <div className={`flex flex-col items-center rounded-xl border px-4 py-3 ${color}`}>
      <span className="text-2xl font-black">{score}<span className="text-base font-normal">/10</span></span>
      <span className="text-xs font-medium mt-0.5">{emoji} {label}</span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">{icon} {title}</p>
      {children}
    </div>
  );
}

function TagList({ items, color = "bg-purple-50 text-purple-700" }: { items: string[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>{item}</span>
      ))}
    </div>
  );
}

const LOADING_STEPS = [
  "🔍 Fetching Etsy listing data…",
  "📊 Analyzing title structure & SEO patterns…",
  "🧠 Detecting emotional triggers…",
  "🖼 Evaluating thumbnail strategy…",
  "💡 Finding differentiation angles…",
  "✅ Packaging insights…",
];

function LoadingHint() {
  const [step, setStep] = useState(0);
  // rotate every 2s
  const [started] = useState(() => {
    // We use a local interval — this component only mounts during loading
    return 0;
  });
  void started; // suppress unused warning

  return (
    <div className="flex flex-col items-center py-12 gap-4">
      <Spinner size={32} />
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-gray-700">{LOADING_STEPS[step % LOADING_STEPS.length]}</p>
        <p className="text-xs text-gray-400">Analyzing competitor intelligence…</p>
      </div>
      <button className="hidden" onClick={() => setStep((s) => s + 1)} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResearchPanel({ onGenerateListing }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<ResearchInsight | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState("");

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setInsight(null);
    setDemoMessage(null);
    setLastInput(input.trim());

    // Cycle loading steps
    const interval = setInterval(() => setLoadingStep((s) => (s + 1) % LOADING_STEPS.length), 1800);

    try {
      const res = await fetch("/api/research-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setInsight(data.insight);
      if (data.demo) setDemoMessage(data.demoMessage ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      clearInterval(interval);
      setLoadingStep(0);
      setLoading(false);
    }
  };

  // Directly analyze a keyword without going through setInput first
  const handleAnalyzeKeyword = async (keyword: string) => {
    setInput(keyword);
    setLoading(true);
    setError(null);
    setInsight(null);
    setDemoMessage(null);
    setLastInput(keyword);
    const interval = setInterval(() => setLoadingStep((s) => (s + 1) % LOADING_STEPS.length), 1800);
    try {
      const res = await fetch("/api/research-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setInsight(data.insight);
      if (data.demo) setDemoMessage(data.demoMessage ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      clearInterval(interval);
      setLoadingStep(0);
      setLoading(false);
    }
  };

  const inputPlaceholder =
    'Etsy listing URL, keyword (e.g. "meditation planner"), or shop URL';

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Competitor Research Engine</h2>
        <p className="text-sm text-gray-400 mb-4">
          Paste an Etsy listing URL, keyword, or shop URL — AI will reveal why it wins and how to beat it.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
            placeholder={inputPlaceholder}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-xl transition-opacity text-sm flex-shrink-0"
          >
            {loading ? <Spinner size={14} /> : "🔍"} Analyze
          </button>
        </div>

        {/* Example prompts — click to instantly analyze */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-gray-400 self-center">Try:</span>
          {["meditation planner", "homeschool worksheets", "budget tracker printable", "affirmation cards", "wedding planner printable"].map((ex) => (
            <button
              key={ex}
              onClick={() => handleAnalyzeKeyword(ex)}
              disabled={loading}
              className="text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 px-2.5 py-1 rounded-full transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Inline hint for shop URLs */}
        {input.includes("etsy.com/shop/") && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
            💡 Shop URLs need OAuth to fetch live listings. For best results, type a <strong>product keyword</strong> instead (e.g. the type of products that shop sells).
          </p>
        )}
      </div>

      {/* Demo banner */}
      {demoMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
          <span className="flex-shrink-0 mt-0.5">💡</span>
          <div>
            <strong>Demo mode:</strong> {demoMessage}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center py-12 gap-4">
            <Spinner size={32} />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-gray-700">{LOADING_STEPS[loadingStep]}</p>
              <p className="text-xs text-gray-400">Analyzing competitor intelligence…</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && insight && (
        <div className="space-y-4">
          {/* Score row */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Analysis: <span className="text-purple-600">{lastInput}</span></h3>
                <p className="text-xs text-gray-400 mt-0.5">Based on top Etsy listings in this niche</p>
              </div>
              <button
                onClick={() => onGenerateListing(insight, lastInput)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-xl transition-opacity text-sm"
              >
                ✨ Generate Better Listing →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ScoreBadge score={insight.outlierScore} label="Market Opportunity" />
              <ScoreBadge score={insight.thumbnailStrategy.clickabilityScore} label="Thumbnail CTR" />
              <div className="col-span-2 sm:col-span-1 bg-purple-50 rounded-xl border border-purple-100 px-4 py-3">
                <p className="text-xs font-bold text-purple-600 mb-1 uppercase tracking-wide">Positioning</p>
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{insight.positioningStrategy}</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Why they click */}
            <Section icon="👆" title="Why shoppers click">
              <p className="text-sm text-gray-700 leading-relaxed">{insight.clickReason}</p>
            </Section>

            {/* Why they buy */}
            <Section icon="💳" title="Why shoppers buy">
              <p className="text-sm text-gray-700 leading-relaxed">{insight.buyReason}</p>
            </Section>

            {/* Emotional triggers */}
            <Section icon="❤️" title="Emotional triggers">
              <TagList items={insight.emotionalTriggers} color="bg-red-50 text-red-700" />
            </Section>

            {/* Pricing */}
            <Section icon="💵" title="Pricing insight">
              <p className="text-sm text-gray-700 leading-relaxed">{insight.pricingInsight}</p>
            </Section>

            {/* SEO patterns */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 sm:col-span-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">🔍 SEO Patterns</p>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Title Formula</p>
                <p className="text-xs text-gray-700 bg-blue-50 rounded-lg px-3 py-2 font-mono">{insight.seoPatterns.titleStructure}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1.5">Top Keywords</p>
                <TagList items={insight.seoPatterns.repeatedKeywords} color="bg-blue-50 text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Tag Strategy</p>
                <p className="text-xs text-gray-600 leading-relaxed">{insight.seoPatterns.tagStrategy}</p>
              </div>
            </div>

            {/* Thumbnail strategy */}
            <Section icon="🖼" title="Thumbnail strategy">
              <div className="space-y-2 text-xs text-gray-700">
                <p><span className="font-semibold">Colors:</span> {insight.thumbnailStrategy.colorPalette}</p>
                <p><span className="font-semibold">Fonts:</span> {insight.thumbnailStrategy.fontStyle}</p>
                <p><span className="font-semibold">Layout:</span> {insight.thumbnailStrategy.compositionNotes}</p>
              </div>
            </Section>

            {/* Bundle opportunities */}
            <Section icon="📦" title="Bundle opportunities">
              <ul className="space-y-1.5">
                {insight.bundleOpportunities.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-green-500 flex-shrink-0 font-bold">+</span>{b}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Differentiation angles */}
            <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-xl p-4 space-y-2 sm:col-span-2 border border-purple-100">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">🚀 How to Beat This — Your Differentiation Angles</p>
              <ul className="space-y-2">
                {insight.differentiationAngles.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top listings */}
          {insight.topListings?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">🏆 Top Performing Listings Analyzed</p>
              <div className="space-y-3">
                {insight.topListings.map((tl, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{tl.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-green-700 font-medium">{tl.price}</span>
                        <span className="text-xs text-red-500">❤️ {tl.favorites?.toLocaleString()} favorites</span>
                      </div>
                      <p className="text-xs text-purple-600 mt-1 italic">{tl.whyItWins}</p>
                    </div>
                    <a href={tl.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-xs text-gray-400 hover:text-purple-600 transition-colors">↗</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => onGenerateListing(insight, lastInput)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 text-white font-bold py-3.5 px-8 rounded-2xl transition-opacity text-sm shadow-lg"
            >
              ✨ Generate a Better Version of This Listing →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
