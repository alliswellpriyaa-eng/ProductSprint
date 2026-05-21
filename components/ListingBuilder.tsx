"use client";

import { useState, useCallback } from "react";
import type { ResearchInsight, GeneratedListing } from "@/types/research";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  insight: ResearchInsight;
  researchInput: string;
  onBack: () => void;
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

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1 flex-shrink-0"
    >
      {copied ? "✓ Copied" : `⎘ ${label}`}
    </button>
  );
}

function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon} {title}
      </p>
      {badge && (
        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </div>
  );
}

// ─── Etsy Draft Modal ─────────────────────────────────────────────────────────

function EtsyDraftModal({
  listing,
  onClose,
}: {
  listing: GeneratedListing;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    draftUrl?: string;
    mock?: boolean;
    connectOAuthNote?: string;
    error?: string;
  } | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-etsy-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white relative">
          <button onClick={onClose} className="absolute top-3 right-4 text-white/70 hover:text-white text-2xl leading-none">×</button>
          <p className="text-2xl mb-1">🏷️</p>
          <h2 className="text-lg font-black">Create Etsy Draft</h2>
          <p className="text-orange-100 text-sm mt-0.5">Review before pushing to Etsy</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Pre-flight summary */}
          {!result && (
            <>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Title</p>
                  <p className="text-sm text-gray-800 font-medium leading-snug">{listing.title}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tags ({listing.tags.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-100 rounded-full px-2.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-green-50 rounded-xl px-3.5 py-2.5">
                  <span className="text-lg">💵</span>
                  <div>
                    <p className="text-sm font-bold text-green-700">{listing.pricing?.suggested ?? "$6.00"}</p>
                    <p className="text-xs text-green-600">{listing.pricing?.reasoning}</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-800">
                    This will create a <strong>draft listing</strong> on Etsy. You review and publish manually — nothing goes live automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-opacity text-sm"
              >
                {loading ? <><Spinner size={14} /> Creating draft…</> : "🏷️ Push to Etsy as Draft"}
              </button>
            </>
          )}

          {/* Success state */}
          {result && !result.error && (
            <div className="text-center py-4 space-y-4">
              <div className="text-4xl">{result.mock ? "🎭" : "🎉"}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {result.mock ? "Mock draft created!" : "Draft listing created!"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {result.mock
                    ? "Real Etsy OAuth not connected yet — this simulates the result."
                    : "Your listing is saved as a draft on Etsy."}
                </p>
              </div>
              {result.draftUrl && (
                <a
                  href={result.draftUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  📝 Open Draft on Etsy →
                </a>
              )}
              {result.connectOAuthNote && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-left">
                  <p className="text-xs font-bold text-blue-700 mb-1">To connect real Etsy drafts:</p>
                  <p className="text-xs text-blue-600 leading-relaxed">{result.connectOAuthNote}</p>
                </div>
              )}
              <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors">
                Close
              </button>
            </div>
          )}

          {/* Error state */}
          {result?.error && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ⚠️ {result.error}
              </div>
              <button onClick={() => setResult(null)} className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ListingBuilder ──────────────────────────────────────────────────────

export default function ListingBuilder({ insight, researchInput, onBack }: Props) {
  const [userAngle, setUserAngle] = useState("");
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<GeneratedListing | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"listing" | "tags" | "faq" | "social">("listing");

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-listing-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchInput, insight, userAngle: userAngle.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setListing(data.listing);
      setFromCache(!!data.cached);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [researchInput, insight, userAngle]);

  // Auto-generate on first render
  const [autoGenTriggered, setAutoGenTriggered] = useState(false);
  if (!autoGenTriggered && !loading && !listing) {
    setAutoGenTriggered(true);
    handleGenerate();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 transition-colors mb-2">
            ← Back to Research
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            Better Listing: <span className="text-purple-600">{researchInput}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">AI-generated based on competitor research — original positioning, not a copy</p>
        </div>
        {listing && (
          <button
            onClick={() => setShowDraftModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-opacity"
          >
            🏷️ Create Etsy Draft
          </button>
        )}
      </div>

      {/* Differentiation angle input */}
      {!listing && !loading && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">Want a specific angle? (optional)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={userAngle}
              onChange={(e) => setUserAngle(e.target.value)}
              placeholder='e.g. "target ADHD moms" or "editable Canva template version"'
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center py-14 gap-4">
            <Spinner size={32} />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Crafting your differentiated listing…</p>
              <p className="text-xs text-gray-400 mt-1">Using competitor research to write original positioning</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {!loading && listing && (
        <div className="space-y-4">
          {/* Differentiator + hook callout */}
          <div className="bg-gradient-to-br from-purple-600 to-orange-500 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Your Edge</p>
                <p className="text-sm font-semibold leading-snug">{listing.differentiator}</p>
              </div>
              {fromCache && <span className="text-xs bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">⚡ Cached</span>}
            </div>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Emotional Hook</p>
              <p className="text-sm leading-relaxed italic">"{listing.emotionalHook}"</p>
            </div>
          </div>

          {/* Tab nav */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(["listing", "tags", "faq", "social"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors capitalize ${
                    activeTab === tab
                      ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "listing" ? "📋 Listing" : tab === "tags" ? "# Tags" : tab === "faq" ? "❓ FAQ" : "📌 Social"}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {/* ── LISTING TAB ── */}
              {activeTab === "listing" && (
                <>
                  {/* Title */}
                  <div>
                    <SectionHeader icon="🔤" title="Etsy Title" badge={`${listing.title.length}/140`} />
                    <div className="flex items-start gap-2 bg-purple-50 rounded-xl p-3">
                      <p className="flex-1 text-sm text-gray-800 leading-snug font-medium">{listing.title}</p>
                      <CopyButton text={listing.title} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <SectionHeader icon="📝" title="Description" />
                      <CopyButton text={listing.description} label="Copy desc" />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3.5 max-h-64 overflow-y-auto">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <SectionHeader icon="💵" title="Pricing" />
                    <div className="flex items-center gap-3 bg-green-50 rounded-xl px-3.5 py-2.5">
                      <span className="text-xl font-black text-green-700">{listing.pricing?.suggested}</span>
                      <p className="text-xs text-gray-600">{listing.pricing?.reasoning}</p>
                    </div>
                  </div>

                  {/* Bundle ideas */}
                  <div>
                    <SectionHeader icon="📦" title="Bundle Ideas" />
                    <ul className="space-y-1.5">
                      {listing.bundleIdeas?.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-orange-400 font-bold flex-shrink-0">+</span>{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* ── TAGS TAB ── */}
              {activeTab === "tags" && (
                <>
                  <div className="flex items-center justify-between">
                    <SectionHeader icon="#" title={`Etsy Tags (${listing.tags?.length ?? 0}/13)`} />
                    <CopyButton text={(listing.tags ?? []).join(", ")} label="Copy all" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(listing.tags ?? []).map((tag, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-full px-3 py-1.5 group">
                        <span className="text-xs text-orange-700 font-medium">{tag}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(tag)}
                          className="text-orange-300 hover:text-orange-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ⎘
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── FAQ TAB ── */}
              {activeTab === "faq" && (
                <div className="space-y-3">
                  {(listing.faq ?? []).map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                      <p className="text-xs font-bold text-gray-700 mb-1">Q: {item.question}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── SOCIAL TAB ── */}
              {activeTab === "social" && (
                <>
                  {/* Thumbnail text ideas */}
                  <div>
                    <SectionHeader icon="🖼" title="Thumbnail Text Options" />
                    <div className="space-y-2">
                      {(listing.thumbnailTextIdeas ?? []).map((text, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-2.5">
                          <p className="flex-1 text-white font-black text-sm uppercase tracking-wide">{text}</p>
                          <CopyButton text={text} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mockup ideas */}
                  <div>
                    <SectionHeader icon="🎨" title="Canva Mockup Ideas" />
                    <ul className="space-y-1.5">
                      {(listing.mockupIdeas ?? []).map((idea, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pinterest pin */}
                  {listing.pinterestPin && (
                    <div>
                      <SectionHeader icon="📌" title="Pinterest Pin" />
                      <div className="bg-red-50 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-500 mb-0.5">Pin Title</p>
                            <p className="text-xs text-gray-800 font-medium">{listing.pinterestPin.title}</p>
                          </div>
                          <CopyButton text={listing.pinterestPin.title} />
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-500 mb-0.5">Description</p>
                            <p className="text-xs text-gray-700 leading-relaxed">{listing.pinterestPin.description}</p>
                          </div>
                          <CopyButton text={listing.pinterestPin.description} />
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {listing.pinterestPin.hashtags?.map((h, i) => (
                            <span key={i} className="text-xs bg-red-100 text-red-700 rounded-full px-2.5 py-0.5">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Regenerate + angle input */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Tweak the angle and regenerate</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={userAngle}
                onChange={(e) => setUserAngle(e.target.value)}
                placeholder='e.g. "target teachers", "editable Canva version", "bundle of 3"'
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-60"
              >
                {loading ? <Spinner size={12} /> : "↺"} Regenerate
              </button>
            </div>
          </div>

          {/* Bottom CTA */}
          <button
            onClick={() => setShowDraftModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white font-bold py-4 rounded-2xl transition-opacity text-sm shadow-lg"
          >
            🏷️ Create Etsy Draft — Review &amp; Publish Manually
          </button>
        </div>
      )}

      {showDraftModal && listing && (
        <EtsyDraftModal listing={listing} onClose={() => setShowDraftModal(false)} />
      )}
    </div>
  );
}
