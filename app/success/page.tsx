"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function SuccessPage() {
  const { refreshUser } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Give Stripe webhook a moment to land, then refresh user plan
    const timer = setTimeout(async () => {
      await refreshUser();
      setReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Animated checkmark area */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg shadow-violet-200 animate-bounce">
            ⚡
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          You&apos;re now Sprint Pro!
        </h1>
        <p className="text-gray-500 mt-3">
          Unlimited idea generations, SEO titles, tags, blueprints, and sprint
          plans — all yours. Let&apos;s build something.
        </p>

        {/* Feature highlights */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left space-y-3">
          {[
            { icon: "⚡", text: "Unlimited product idea generations" },
            { icon: "🔍", text: "Unlimited SEO titles & Etsy tags" },
            { icon: "🛠", text: "Unlimited Sprint Blueprints" },
            { icon: "🗓", text: "Unlimited 30-Day Sprint Plans" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-lg">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="block bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            {ready ? "Start sprinting →" : "Loading your account…"}
          </Link>
          <a
            href="/api/stripe/create-portal-session"
            onClick={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/stripe/create-portal-session", {
                method: "POST",
              });
              const { url } = await res.json();
              if (url) window.location.href = url;
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Manage billing →
          </a>
        </div>
      </div>
    </div>
  );
}
