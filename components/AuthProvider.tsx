"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Plan = "free" | "premium";

export interface UsageMap {
  generate_ideas: number;
  generate_planner: number;
  generate_seo: number;
  generate_tags: number;
  create_product: number;
  export_pdf: number;
  [key: string]: number;
}

export interface LimitsMap {
  generate_ideas: number;
  generate_planner: number;
  generate_seo: number;
  generate_tags: number;
  create_product: number;
  export_pdf: number;
  [key: string]: number;
}

export interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
  usage: UsageMap;
  limits: LimitsMap;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** true while the initial session check is in flight */
  loading: boolean;
  /** Call after any successful API use to refresh usage counts */
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Whether monetization is enabled (env-driven) */
  monetizationEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  signOut: async () => {},
  monetizationEnabled: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const monetizationEnabled =
    process.env.NEXT_PUBLIC_MONETIZATION_ENABLED === "true";

  const fetchUser = useCallback(async (authUser: User | null) => {
    if (!authUser || !monetizationEnabled) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [monetizationEnabled]);

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    await fetchUser(authUser);
  }, [supabase, fetchUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      fetchUser(authUser).finally(() => setLoading(false));
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, signOut, monetizationEnabled }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}

/** Returns true when the user is allowed to use a feature (either premium, or within free limits) */
export function useCanUse(feature: keyof LimitsMap): boolean {
  const { user, monetizationEnabled } = useAuth();
  if (!monetizationEnabled) return true;
  if (!user) return false; // not signed in
  if (user.plan === "premium") return true;
  return (user.usage[feature] ?? 0) < (user.limits[feature] ?? 0);
}
