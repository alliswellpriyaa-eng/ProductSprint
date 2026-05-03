"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ─── Inner component that reads searchParams ──────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ?? null
  );

  // Redirect already-signed-in users
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/");
    });
  }, [supabase, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace("/");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-violet-600 hover:underline font-medium">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

// ─── Page shell (wraps LoginForm in Suspense) ─────────────────────────────────
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white font-black text-base flex items-center justify-center">
              PS
            </span>
            <span className="font-bold text-gray-900 text-lg">ProductSprint</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back — let&apos;s keep sprinting.</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-400">
            Loading…
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link href="/" className="hover:text-gray-600">← Back to ProductSprint</Link>
        </p>
      </div>
    </div>
  );
}
