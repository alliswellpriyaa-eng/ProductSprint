"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedIdeas, unsaveIdea, type SavedIdea, type EtsyExportPack } from "@/lib/savedIdeas";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-medium"
    >
      {copied ? "Copied!" : `Copy ${label}`}
    </button>
  );
}

function ExportPackSection({ pack }: { pack: EtsyExportPack }) {
  const [open, setOpen] = useState(false);

  const seoTitle = pack.seoTitle ?? "";
  const tags = Array.isArray(pack.tags) ? pack.tags.join(", ") : "";
  const description = pack.description ?? "";
  const pricing = pack.pricing ?? "";
  const reelCaption = pack.reelCaption ?? "";

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>Export Etsy Pack</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {seoTitle && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SEO Title</span>
                <CopyButton text={seoTitle} label="title" />
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{seoTitle}</p>
            </div>
          )}

          {tags && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</span>
                <CopyButton text={tags} label="tags" />
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 break-words">{tags}</p>
            </div>
          )}

          {description && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                <CopyButton text={description} label="description" />
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 whitespace-pre-wrap">{description}</p>
            </div>
          )}

          {pricing && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pricing</span>
                <CopyButton text={pricing} label="pricing" />
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{pricing}</p>
            </div>
          )}

          {reelCaption && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reel Caption</span>
                <CopyButton text={reelCaption} label="caption" />
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{reelCaption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onRemove }: { idea: SavedIdea; onRemove: (title: string) => void }) {
  const score = idea.marketScore;

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-base leading-snug truncate">{idea.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {idea.niche} &middot; {idea.productType}
          </p>
        </div>
        <button
          onClick={() => onRemove(idea.title)}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          Remove
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{idea.description}</p>

      {/* Market score pills */}
      {score && (
        <div className="flex flex-wrap gap-2 mt-3">
          {score.demand !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
              Demand {score.demand}/10
            </span>
          )}
          {score.competition && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
              {score.competition} competition
            </span>
          )}
          {score.trend && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
              {score.trend}
            </span>
          )}
          {score.estimatedPriceRange && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
              {score.estimatedPriceRange}
            </span>
          )}
          {score.beginnerFriendly && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              Beginner-friendly
            </span>
          )}
        </div>
      )}

      {/* Export Pack collapsible */}
      {idea.exportPack && <ExportPackSection pack={idea.exportPack} />}

      {/* Saved date */}
      <p className="text-xs text-gray-400 mt-3">Saved {formatDate(idea.savedAt)}</p>
    </div>
  );
}

export default function SavedPage() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIdeas(getSavedIdeas());
    setLoaded(true);
  }, []);

  function handleRemove(title: string) {
    unsaveIdea(title);
    setIdeas((prev) => prev.filter((i) => i.title !== title));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <span>←</span>
            <span>Back to ProductSprint</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Saved Ideas</h1>
          <div className="w-28" /> {/* spacer to centre the title */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {!loaded ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          // Empty state
          <div className="text-center py-20 px-4">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No saved ideas yet</h2>
            <p className="text-gray-500 mb-6">
              Generate some ideas and save your favorites — they&apos;ll appear here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Generate ideas
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {ideas.length} saved {ideas.length === 1 ? "idea" : "ideas"}
              </p>
            </div>
            <div className="space-y-4">
              {ideas.map((idea) => (
                <IdeaCard key={idea.title} idea={idea} onRemove={handleRemove} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
