"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import AuthModal from "./AuthModal";

interface Props {
  /** Called when user wants to upgrade */
  onUpgrade?: () => void;
}

export default function UsageBadge({ onUpgrade }: Props) {
  const { user, loading, signOut, monetizationEnabled } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Don't render anything if monetization is off
  if (!monetizationEnabled) return null;

  if (loading) {
    return (
      <div className="h-8 w-32 bg-gray-100 rounded-full animate-pulse" />
    );
  }

  // Not signed in
  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
        >
          Sign in
        </button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  const isPremium = user.plan === "premium";
  const ideasUsed = user.usage.generate_ideas ?? 0;
  const ideasLimit = user.limits.generate_ideas ?? 3;

  const handleUpgrade = async () => {
    setShowMenu(false);
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Redirect to pricing
      window.location.href = "/pricing";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
          isPremium
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {isPremium ? (
          <>
            <span className="text-amber-500">⚡</span>
            <span>Sprint Pro</span>
          </>
        ) : (
          <>
            <span>Free</span>
            <span className="text-gray-400">·</span>
            <span>
              {ideasUsed}/{ideasLimit} ideas
            </span>
          </>
        )}
        <svg
          className="w-3 h-3 ml-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[200px] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {user.email}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isPremium ? "⚡ Sprint Pro — Unlimited" : `Free plan — ${ideasUsed}/${ideasLimit} ideas today`}
              </p>
            </div>

            {!isPremium && (
              <button
                onClick={handleUpgrade}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
              >
                ⚡ Upgrade to Sprint Pro →
              </button>
            )}

            {isPremium && (
              <button
                onClick={async () => {
                  setShowMenu(false);
                  const res = await fetch("/api/stripe/create-portal-session", { method: "POST" });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Manage subscription
              </button>
            )}

            <button
              onClick={() => { setShowMenu(false); signOut(); }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-50"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
