/**
 * /admin — ProductSprint Pre-Monetization Analytics Dashboard
 *
 * Protected by a simple query-param key: /admin?key=YOUR_ADMIN_KEY
 * Set ADMIN_KEY in .env.local (or skip for local dev).
 *
 * Fetches all data at render time (server component) from Supabase
 * using the service-role key. Falls back gracefully when not configured.
 */

import { headers } from "next/headers";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabaseConfigured";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventCount {
  event_name: string;
  count: number;
}

interface TopValue {
  value: string;
  count: number;
}

interface AdminData {
  configured: boolean;
  totalSessions: number;
  eventCounts: EventCount[];
  topNiches: TopValue[];
  topProductTypes: TopValue[];
  emailCount: number;
  recentEmails: { email: string; source: string; created_at: string }[];
  decisionRate: number; // premium_click / ideas_generated
  plannerRate: number;  // planner_generated / ideas_generated
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchAdminData(): Promise<AdminData> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      totalSessions: 0,
      eventCounts: [],
      topNiches: [],
      topProductTypes: [],
      emailCount: 0,
      recentEmails: [],
      decisionRate: 0,
      plannerRate: 0,
    };
  }

  const headers = {
    apikey: SERVICE_KEY!,
    Authorization: `Bearer ${SERVICE_KEY!}`,
    "Content-Type": "application/json",
  };

  const baseUrl = `${SUPABASE_URL}/rest/v1`;

  // Parallel fetch all stats
  const [eventsRes, emailsRes, emailCountRes] = await Promise.all([
    fetch(`${baseUrl}/analytics_events?select=event_name,metadata,session_id`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/early_access?select=email,source,created_at&order=created_at.desc&limit=20`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/early_access?select=id`, { headers, cache: "no-store" }),
  ]);

  const events: { event_name: string; metadata: Record<string, unknown>; session_id: string }[] =
    eventsRes.ok ? await eventsRes.json() : [];
  const recentEmails: { email: string; source: string; created_at: string }[] =
    emailsRes.ok ? await emailsRes.json() : [];
  const allEmails: { id: string }[] = emailCountRes.ok ? await emailCountRes.json() : [];

  // Aggregate event counts
  const countMap = new Map<string, number>();
  const sessionSet = new Set<string>();
  const nicheMap = new Map<string, number>();
  const ptMap = new Map<string, number>();

  for (const e of events) {
    countMap.set(e.event_name, (countMap.get(e.event_name) ?? 0) + 1);
    if (e.session_id) sessionSet.add(e.session_id);

    // Extract niche from ideas_generated events
    if (e.event_name === "ideas_generated" && e.metadata?.niche) {
      const n = e.metadata.niche as string;
      nicheMap.set(n, (nicheMap.get(n) ?? 0) + 1);
    }
    if (e.event_name === "ideas_generated" && e.metadata?.productType) {
      const p = e.metadata.productType as string;
      ptMap.set(p, (ptMap.get(p) ?? 0) + 1);
    }
  }

  const sortedEvents = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([event_name, count]) => ({ event_name, count }));

  const topNiches = Array.from(nicheMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([value, count]) => ({ value, count }));

  const topProductTypes = Array.from(ptMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([value, count]) => ({ value, count }));

  const ideasCount = countMap.get("ideas_generated") ?? 0;
  const premiumClickCount = countMap.get("premium_feature_clicked") ?? 0;
  const plannerCount = countMap.get("planner_generated") ?? 0;

  return {
    configured: true,
    totalSessions: sessionSet.size,
    eventCounts: sortedEvents,
    topNiches,
    topProductTypes,
    emailCount: allEmails.length,
    recentEmails,
    decisionRate: ideasCount > 0 ? Math.round((premiumClickCount / ideasCount) * 100) : 0,
    plannerRate: ideasCount > 0 ? Math.round((plannerCount / ideasCount) * 100) : 0,
  };
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight = false }: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "bg-violet-50 border-violet-200" : "bg-white border-gray-100"}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-black ${highlight ? "text-violet-700" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const EVENT_LABELS: Record<string, { emoji: string; label: string }> = {
  start_product_sprint_clicked: { emoji: "⚡", label: "Sprint button clicked" },
  ideas_generated:              { emoji: "💡", label: "Ideas generated" },
  seo_generated:                { emoji: "🔍", label: "SEO titles generated" },
  tags_generated:               { emoji: "🏷", label: "Tags generated" },
  create_product_clicked:       { emoji: "🛠", label: "Create product clicked" },
  planner_generated:            { emoji: "🗓", label: "30-Day planner generated" },
  premium_feature_clicked:      { emoji: "🔒", label: "Premium feature clicked" },
  email_submitted:              { emoji: "📧", label: "Emails submitted" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const ADMIN_KEY = process.env.ADMIN_KEY;

  // Simple key-based auth — skip check in local dev or if ADMIN_KEY not set
  const isAuthed =
    !ADMIN_KEY ||
    process.env.NODE_ENV === "development" ||
    params.key === ADMIN_KEY;

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔒</p>
          <h1 className="text-xl font-bold text-gray-800">Admin access required</h1>
          <p className="text-sm text-gray-500 mt-1">Add <code>?key=YOUR_ADMIN_KEY</code> to the URL</p>
        </div>
      </div>
    );
  }

  const data = await fetchAdminData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-violet-600 text-white text-xs font-black flex items-center justify-center">PS</span>
          <span className="font-bold text-gray-900">ProductSprint</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">Analytics</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to app</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {!data.configured && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
            <p className="font-semibold mb-1">⚠️ Supabase not configured</p>
            <p>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in .env.local, then run the SQL in <code>supabase/schema.sql</code>.</p>
          </div>
        )}

        {/* Decision metrics */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-4">
            📊 Success Metrics
            <span className="ml-2 text-xs font-normal text-gray-400">Launch when: 50+ users · 10+ emails · 10–20% premium clicks</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Unique sessions"
              value={data.totalSessions}
              sub="Goal: 50+"
              highlight={data.totalSessions >= 50}
            />
            <StatCard
              label="Emails collected"
              value={data.emailCount}
              sub="Goal: 10+"
              highlight={data.emailCount >= 10}
            />
            <StatCard
              label="Premium click rate"
              value={`${data.decisionRate}%`}
              sub="Goal: 10–20%"
              highlight={data.decisionRate >= 10}
            />
            <StatCard
              label="Planner conversion"
              value={`${data.plannerRate}%`}
              sub="% who generated planner"
            />
          </div>
        </section>

        {/* Event counts */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-4">⚡ Event Counts</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {data.eventCounts.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No events recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3">Event</th>
                    <th className="text-right px-5 py-3">Count</th>
                    <th className="text-right px-5 py-3">% of starts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.eventCounts.map(({ event_name, count }) => {
                    const meta = EVENT_LABELS[event_name];
                    const startCount = data.eventCounts.find(e => e.event_name === "start_product_sprint_clicked")?.count ?? 1;
                    const pct = Math.round((count / startCount) * 100);
                    return (
                      <tr key={event_name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {meta?.emoji ?? "•"} {meta?.label ?? event_name}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900">{count.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-gray-400">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Top niches + product types */}
        <div className="grid sm:grid-cols-2 gap-6">
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-4">🔥 Top Niches</h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              {data.topNiches.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                data.topNiches.map(({ value, count }, i) => (
                  <div key={value} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{value}</span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-400 rounded-full"
                          style={{ width: `${Math.round((count / (data.topNiches[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-4">🛠 Top Product Types</h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              {data.topProductTypes.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                data.topProductTypes.map(({ value, count }, i) => (
                  <div key={value} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{value}</span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-400 rounded-full"
                          style={{ width: `${Math.round((count / (data.topProductTypes[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Email list */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-4">
            📧 Early Access Emails
            <span className="ml-2 text-sm font-normal text-gray-400">({data.emailCount} total)</span>
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {data.recentEmails.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No emails collected yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Source</th>
                    <th className="text-right px-5 py-3">Signed up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentEmails.map(({ email, source, created_at }) => (
                    <tr key={email} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{email}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                          {source}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 text-xs">
                        {new Date(created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
