"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  CalendarClock,
  FileEdit,
  Send,
  XCircle,
  Bookmark,
  ShieldCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Filter,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Your .env has: NEXT_PUBLIC_API=http://127.0.0.1:8000  (no /api suffix)
// So every call below appends "/api/..." itself.
const API = process.env.NEXT_PUBLIC_API;
const PAGE_SIZE = 7;
const POLL_INTERVAL_MS = 10000; // check for new notifications every 10s

type CategoryKey = "all" | "applications" | "interviews" | "jobs" | "system";

interface TypeMeta {
  category: Exclude<CategoryKey, "all">;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

interface RawNotification {
  id: string | number;
  notification_type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NormalizedNotification {
  id: string | number;
  category: Exclude<CategoryKey, "all">;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  createdAt: string;
  timeAgo: string;
  unread: boolean;
}

interface DebugInfo {
  url: string;
  status: number | string;
  hasToken: boolean;
  rawResponse: unknown;
}

// ---------------------------------------------------------------------------
// Map raw notification_type from the backend -> icon/category for the UI
// ---------------------------------------------------------------------------
const TYPE_META: Record<string, TypeMeta> = {
  SYSTEM: {
    category: "system",
    icon: ShieldCheck,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  JOB_POSTED: {
    category: "jobs",
    icon: Briefcase,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  APPLICATION_SHORTLISTED: {
    category: "applications",
    icon: CheckCircle2,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  APPLICATION_STATUS_UPDATED: {
    category: "applications",
    icon: FileEdit,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  APPLICATION_REJECTED: {
    category: "applications",
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  INTERVIEW_SCHEDULED: {
    category: "interviews",
    icon: CalendarClock,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  JOB_SAVED: {
    category: "jobs",
    icon: Bookmark,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  MESSAGE: {
    category: "system",
    icon: Send,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
};

const DEFAULT_META: TypeMeta = {
  category: "system",
  icon: ShieldCheck,
  iconBg: "bg-slate-100",
  iconColor: "text-slate-600",
};

const TABS: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "applications", label: "Applications" },
  { key: "interviews", label: "Interviews" },
  { key: "jobs", label: "Jobs" },
  { key: "system", label: "System" },
];

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min > 1 ? "s" : ""} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? "s" : ""} ago`;
}

function normalize(raw: RawNotification): NormalizedNotification {
  const meta = TYPE_META[raw.notification_type] || DEFAULT_META;
  return {
    id: raw.id,
    category: meta.category,
    icon: meta.icon,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
    title: raw.title,
    description: raw.message,
    createdAt: raw.created_at,
    timeAgo: timeAgo(raw.created_at),
    unread: !raw.is_read,
  };
}

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("access") : null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function Notification() {
  const [activeTab, setActiveTab] = useState<CategoryKey>("all");
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<NormalizedNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const knownIds = useRef<Set<string | number>>(new Set());

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // -------------------------------------------------------------------------
  // Fetch from the API. `silent` = true skips the loading spinner, used for
  // background polling so the list updates without a visible reload.
  // -------------------------------------------------------------------------
  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      const url = `${API}/api/notifications/`;
      const token = getToken();

      try {
        const res = await fetch(url, { headers: authHeaders() });
        const text = await res.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        setDebugInfo({
          url,
          status: res.status,
          hasToken: !!token,
          rawResponse: typeof data === "string" ? data.slice(0, 300) : data,
        });

        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? "401 Unauthorized — token missing/invalid/expired."
              : `Request failed (${res.status})`
          );
        }

        const list: RawNotification[] = Array.isArray(data)
          ? (data as RawNotification[])
          : ((data as { results?: RawNotification[] })?.results ?? []);
        const normalized = list.map(normalize);

        const newIds = new Set(normalized.map((n) => n.id));
        const hasNew = [...newIds].some((id) => !knownIds.current.has(id));
        knownIds.current = newIds;

        if (!silent || hasNew || normalized.length !== items.length) {
          setItems(
            normalized.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(err);
        setError(message);
        setDebugInfo((prev) => ({
          url,
          status: prev?.status ?? "network error",
          hasToken: !!token,
          rawResponse: prev?.rawResponse ?? message,
        }));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [items.length]
  );

  // Initial load
  useEffect(() => {
    fetchNotifications(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background polling — new notifications (e.g. a job post) show up here
  // automatically without the user refreshing the page.
  useEffect(() => {
    const id = setInterval(() => fetchNotifications(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const counts = useMemo(() => {
    const base: Record<CategoryKey, number> = {
      all: items.length,
      applications: 0,
      interviews: 0,
      jobs: 0,
      system: 0,
    };
    for (const n of items) base[n.category] = (base[n.category] || 0) + 1;
    return base;
  }, [items]);

  const filtered = useMemo(
    () => (activeTab === "all" ? items : items.filter((n) => n.category === activeTab)),
    [items, activeTab]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // -------------------------------------------------------------------------
  // Actions — these now match the DRF ModelViewSet's actual generated URLs:
  //   GET    /api/notifications/                → list
  //   DELETE /api/notifications/{id}/            → destroy
  //   PATCH  /api/notifications/{id}/read/       → mark_as_read (custom action)
  //   PATCH  /api/notifications/read-all/        → mark_all_as_read (custom action)
  //   GET    /api/notifications/unread-count/    → unread_count (custom action)
  // -------------------------------------------------------------------------
  const markAllAsRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      const res = await fetch(`${API}/api/notifications/read-all/`, {
        method: "PATCH", // NOT POST — view uses @action(methods=["patch"])
        headers: authHeaders(),
      });
      if (!res.ok) console.error("mark all as read failed", res.status);
    } catch (err) {
      console.error(err);
    }
  };

  const markOneAsRead = async (id: string | number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      const res = await fetch(`${API}/api/notifications/${id}/read/`, {
        method: "PATCH", // custom action url_path="read", not the base detail route
        headers: authHeaders(),
      });
      if (!res.ok) console.error("mark as read failed", res.status);
    } catch (err) {
      console.error(err);
    }
  };

  const dismiss = async (id: string | number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch(`${API}/api/notifications/${id}/`, {
        method: "DELETE", // maps to destroy() — this one was already correct
        headers: authHeaders(),
      });
      if (!res.ok) console.error("dismiss failed", res.status);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as CategoryKey);
    setPage(1);
  };

  return (
    <div className="w-full max-w-8xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">
            Stay updated with the latest alerts and updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-5">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-slate-500 shadow-none transition-colors duration-200 hover:text-indigo-500 data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:shadow-none"
            >
              {tab.label}{" "}
              <span className="ml-1 text-slate-400 data-[state=active]:text-indigo-500">
                {counts[tab.key] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      <div className="mt-2 divide-y divide-slate-100">
        {loading && (
          <p className="py-10 text-center text-sm text-slate-500">Loading notifications…</p>
        )}

        {!loading && pageItems.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            No notifications in this category.
          </p>
        )}

        {!loading &&
          pageItems.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className="-mx-3 flex items-start gap-3 rounded-lg px-3 py-4 transition-colors duration-150 first:pt-4 last:pb-0 hover:bg-slate-50"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${n.iconColor}`} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{n.description}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2 pl-2">
                  <span className="whitespace-nowrap text-xs text-slate-400">{n.timeAgo}</span>
                  {n.unread && (
                    <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Unread" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => markOneAsRead(n.id)}>
                        Mark as read
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => dismiss(n.id)}>Dismiss</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const num = i + 1;
            const showDirectly =
              totalPages <= 5 || num === 1 || num === totalPages || Math.abs(num - page) <= 1;
            if (!showDirectly) {
              if (num === 2 || num === totalPages - 1) {
                return (
                  <span key={num} className="px-1 text-sm text-slate-400">
                    ...
                  </span>
                );
              }
              return null;
            }
            return (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                  num === page
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {num}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}