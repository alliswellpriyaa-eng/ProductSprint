"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, shown as context for why auth is required */
  reason?: string;
  /** Start on "sign up" tab instead of "sign in" */
  defaultTab?: "signin" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  reason,
  defaultTab = "signin",
}: Props) {
  const supabase = createClient();
  const { refreshUser } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      await refreshUser();
      onClose();
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        "Check your inbox! We sent you a confirmation link. Once confirmed, sign in below."
      );
      setTab("signin");
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              {reason && (
                <p className="text-violet-200 text-sm mt-1">{reason}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-violet-200 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 bg-white/10 rounded-lg p-1 gap-1">
            <button
              onClick={() => { setTab("signin"); reset(); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === "signin"
                  ? "bg-white text-violet-700"
                  : "text-violet-200 hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setTab("signup"); reset(); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === "signup"
                  ? "bg-white text-violet-700"
                  : "text-violet-200 hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading
                ? tab === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : tab === "signin"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {tab === "signin" && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setTab("signup"); reset(); }}
                className="text-violet-600 hover:underline font-medium"
              >
                Sign up free
              </button>
            </p>
          )}
          {tab === "signup" && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => { setTab("signin"); reset(); }}
                className="text-violet-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
