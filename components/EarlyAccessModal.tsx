"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EarlyAccessSource =
  | "limit_reached"
  | "premium_click"
  | "export_pdf"
  | "save_idea"
  | "planner_locked"
  | "advanced_examples"
  | "unknown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  source?: EarlyAccessSource;
}

// ─── Feature list shown in the modal ─────────────────────────────────────────

const FEATURES = [
  ["⚡", "Unlimited idea generations — no daily cap"],
  ["🛠", "Sprint Blueprint — full product creation guides"],
  ["📄", "Export PDF — download ready-to-use plans"],
  ["❤️", "Save Ideas — build your personal idea library"],
  ["🗓", "Full 30-Day Sprint Plans with tasks & keywords"],
  ["🏷", "13 Etsy tags per product idea"],
  ["🎯", "Unlimited SEO title generation"],
];

// ─── EarlyAccessModal ─────────────────────────────────────────────────────────

export default function EarlyAccessModal({ isOpen, onClose, source = "unknown" }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sourceLabel: Record<EarlyAccessSource, string> = {
    limit_reached:     "You've hit today's free limit",
    premium_click:     "This is a Pro feature",
    export_pdf:        "PDF export is a Pro feature",
    save_idea:         "Saving ideas is a Pro feature",
    planner_locked:    "Full planner details are a Pro feature",
    advanced_examples: "Advanced examples are a Pro feature",
    unknown:           "Unlock the full experience",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setDone(true);
        trackEvent("email_submitted", { source });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="early-access-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-orange-500 px-6 py-5 text-white text-center relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-4 text-white/70 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
          <p className="text-3xl mb-2">🚀</p>
          <h2 className="text-xl font-black tracking-tight">
            ProductSprint Pro is coming soon
          </h2>
          <p className="text-purple-200 text-sm mt-1">{sourceLabel[source]}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {done ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-gray-900">You&apos;re on the list!</h3>
              <p className="text-sm text-gray-500 mt-2">
                We&apos;ll email you as soon as ProductSprint Pro launches.
                You&apos;ll get early-bird pricing as a thank-you.
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Keep exploring →
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Unlock unlimited product ideas, full sprint plans, SEO titles,
                tags, product breakdowns, and more.
              </p>

              {/* Feature grid */}
              <ul className="space-y-2 mb-5">
                {FEATURES.map(([icon, text]) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="text-base flex-shrink-0">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              {/* Email form */}
              {error && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-opacity text-sm"
                >
                  {loading ? "Saving your spot…" : "🔔 Notify Me When Pro Launches"}
                </button>
              </form>

              <button
                onClick={onClose}
                className="w-full mt-2 text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1.5"
              >
                Keep exploring for free →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
