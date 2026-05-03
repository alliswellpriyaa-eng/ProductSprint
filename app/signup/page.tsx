"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/");
    });
  }, [supabase, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-gray-900">Check your inbox</h2>
          <p className="text-gray-600 mt-2 text-sm">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
          >
            Go to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white font-black text-base flex items-center justify-center">
              PS
            </span>
            <span className="font-bold text-gray-900 text-lg">ProductSprint</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create your free account</h1>
          <p className="text-sm text-gray-500 mt-1">Start generating profitable product ideas today.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
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
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? "Creating account…" : "Create free account"}
            </button>
          </form>

          {/* Free plan highlights */}
          <ul className="mt-4 space-y-1">
            {[
              "3 idea generations per day",
              "SEO titles & Etsy tags",
              "1 sprint blueprint per day",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-green-500">✓</span> {item}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link href="/" className="hover:text-gray-600">← Back to ProductSprint</Link>
        </p>
      </div>
    </div>
  );
}
