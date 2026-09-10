"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  MessageCircle,
  Mail,
  Send,
  Coffee,
  Sprout,
  ClipboardCheck,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API;
const LIST_URL = `${API_BASE}/api/my-applications/`;

const STATUS_OPTIONS = ["All Status", "Pending", "Shortlisted", "Rejected", "Selected"];

// Tailwind classes per status value coming from the API (lowercase-safe lookup below)
const statusStyles: Record<string, string> = {
  interview: "bg-violet-100 text-violet-600",
  shortlisted: "bg-emerald-100 text-emerald-600",
  pending: "bg-blue-100 text-blue-600",
  rejected: "bg-red-100 text-red-600",
  selected: "bg-teal-100 text-teal-600",
};

function getStatusStyle(status?: string): string {
  return statusStyles[(status || "").toLowerCase()] || "bg-slate-100 text-slate-600";
}

function getInitial(name?: string): string {
  return (name || "?").trim().charAt(0).toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `Applied on ${d.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  })}`;
}

interface Application {
  id: string | number;
  full_name?: string;
  email?: string;
  current_company?: string;
  status?: string;
  created_at?: string;
}

interface PageInfo {
  count: number;
  next: string | null;
  previous: string | null;
}

interface ApplicationsResponse {
  success?: boolean;
  count?: number;
  next?: string | null;
  previous?: string | null;
  applications?: Application[];
}

export default function MyApplication() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden px-[10px] py-4 sm:p-8 lg:p-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 sm:gap-10 lg:flex-row lg:justify-between lg:gap-8">
        <JobSearchHero />
        <MyApplicationsPanel />
      </div>
    </div>
  );
}

function JobSearchHero() {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 sm:items-stretch">
      {/* Fixed, small width on phone so it can never overflow the screen; grows from sm+ */}
      <div className="relative mx-auto h-[300px] w-[260px] overflow-hidden py-6 xs:h-[340px] xs:w-[300px] sm:h-[420px] sm:w-full sm:max-w-[360px]">
        <div className="absolute left-1/2 top-1/2 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E7EDFA] xs:h-[210px] xs:w-[210px] sm:h-[320px] sm:w-[320px]" />

        <div className="absolute left-0 top-2 z-10 flex flex-col items-start gap-1.5 rounded-2xl bg-white p-2.5 shadow-lg sm:top-6 sm:gap-2 sm:p-4">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#2F6FE0] sm:h-11 sm:w-11">
            <BriefcaseIcon />
            <CheckCircle2 className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white text-emerald-500 sm:h-4 sm:w-4" />
          </span>
          <p className="text-[10px] font-semibold leading-tight text-slate-900 sm:text-sm">
            Application
            <br />
            Submitted
          </p>
        </div>

        <div className="absolute right-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg sm:right-10 sm:h-12 sm:w-12">
          <Mail className="h-3.5 w-3.5 text-amber-400 sm:h-5 sm:w-5" />
        </div>

        <div className="absolute right-0 top-20 z-10 flex h-7 w-7 items-center justify-center rounded-2xl rounded-bl-none bg-white shadow-lg sm:top-32 sm:h-11 sm:w-11">
          <Search className="h-3.5 w-3.5 text-[#2F6FE0] sm:h-5 sm:w-5" />
        </div>

        <div className="absolute left-0 top-28 z-10 flex h-7 w-10 items-center justify-center gap-1 rounded-2xl rounded-bl-none bg-white shadow-lg sm:-left-2 sm:top-44 sm:h-10 sm:w-14">
          <MessageCircle className="h-3.5 w-3.5 text-slate-300" />
        </div>

        <div className="absolute right-6 top-0 z-10 sm:right-20">
          <Send className="h-4 w-4 -rotate-12 text-[#6E8FE8] sm:h-6 sm:w-6" />
        </div>

        <PersonIllustration />

        <div className="absolute left-0 bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 sm:-left-2 sm:bottom-4 sm:h-14 sm:w-14">
          <Sprout className="h-4 w-4 text-emerald-500 sm:h-7 sm:w-7" />
        </div>

        <div className="absolute left-9 bottom-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md sm:left-20 sm:bottom-2 sm:h-10 sm:w-10">
          <Coffee className="h-3.5 w-3.5 text-[#3A6FE0] sm:h-5 sm:w-5" />
        </div>

        <div className="absolute bottom-0 right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#E7EDFA] sm:right-2 sm:h-20 sm:w-20">
          <ClipboardCheck className="h-5 w-5 text-[#3A6FE0] sm:h-9 sm:w-9" />
          <CheckCircle2 className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 text-white sm:bottom-1 sm:right-1 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PersonIllustration() {
  return (
    <svg viewBox="0 0 320 340" className="relative z-[5] mx-auto h-[180px] w-auto xs:h-[220px] sm:h-[320px]" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="320" rx="150" ry="14" fill="#EEF2F9" />
      <rect x="80" y="180" width="130" height="14" rx="6" fill="#16264A" />
      <path d="M90 190 L210 190 L200 300 L100 300 Z" fill="#16264A" />
      <path d="M95 200 C 90 240 95 280 108 305 L212 305 C 224 280 228 240 220 200 C 195 185 120 185 95 200 Z" fill="#3A6FE0" />
      <path d="M100 220 C 70 235 55 255 60 275 L88 285 C 92 265 100 245 112 230 Z" fill="#3A6FE0" />
      <path d="M215 220 C 245 235 260 255 255 275 L227 285 C 223 265 215 245 203 230 Z" fill="#3A6FE0" />
      <circle cx="66" cy="280" r="9" fill="#F2B48C" />
      <circle cx="250" cy="280" r="9" fill="#F2B48C" />
      <rect x="140" y="150" width="30" height="26" rx="8" fill="#F2B48C" />
      <circle cx="155" cy="132" r="34" fill="#F7C9A3" />
      <path d="M122 128 C 116 92 136 68 155 68 C 178 68 198 92 190 132 C 188 116 180 106 172 112 C 172 98 162 88 155 88 C 146 88 136 98 134 112 C 126 106 124 116 122 128 Z" fill="#22283A" />
      <circle cx="145" cy="134" r="2.6" fill="#2A2A2A" />
      <circle cx="167" cy="134" r="2.6" fill="#2A2A2A" />
      <path d="M147 146 Q155 151 163 146" stroke="#C97C56" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M100 255 L215 255 L228 285 L88 285 Z" fill="#B8C4D9" />
      <path d="M108 210 L207 210 L215 255 L100 255 Z" fill="#D6DEEC" />
      <rect x="122" y="220" width="70" height="24" rx="2" fill="#9FB3D6" opacity="0.6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Right side: My Applications panel — server-side paginated,         */
/*  searched, and status-filtered via the Django API                   */
/* ------------------------------------------------------------------ */

function MyApplicationsPanel() {
  const [statusFilter, setStatusFilter] = useState<string>("All Status");
  const [open, setOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState<string>("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ count: 0, next: null, previous: null });
  const pageSize = 5;

  // close status dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        e.target instanceof Node &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // MyApplicationsAPIView now supports server-side pagination, status
  // filtering (?status=) and search (?search=) on top of always scoping
  // results to the logged-in user.
  const fetchApplications = useCallback(
    async (signal: AbortSignal, pageNum: number, status: string, search: string) => {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("access") : null;

        if (!token) {
          throw new Error("You're not logged in. Please log in to view your applications.");
        }

        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("page_size", String(pageSize));
        if (status && status !== "All Status") params.set("status", status);
        if (search) params.set("search", search);

        const res = await fetch(`${LIST_URL}?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal,
        });

        if (res.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data: ApplicationsResponse = await res.json();
        // backend returns { success, count, next, previous, applications: [...] }
        setApplications(Array.isArray(data.applications) ? data.applications : []);
        setPageInfo({
          count: data.count ?? 0,
          next: data.next ?? null,
          previous: data.previous ?? null,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name !== "AbortError") {
            setError(err.message || "Something went wrong while loading applications.");
            setApplications([]);
            setPageInfo({ count: 0, next: null, previous: null });
          }
        } else {
          setError("Something went wrong while loading applications.");
          setApplications([]);
          setPageInfo({ count: 0, next: null, previous: null });
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // When search or status changes: debounce, reset to page 1, refetch.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setPage(1);
      fetchApplications(controller.signal, 1, statusFilter, query);
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query]);

  // When page changes (and only page), refetch without resetting filters.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const controller = new AbortController();
    fetchApplications(controller.signal, page, statusFilter, query);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(pageInfo.count / pageSize));

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">My Applications</h2>
          <div className="mt-2 h-1 w-10 rounded-full bg-[#2F6FE0]" />
        </div>

        {/* Status dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:px-3.5 sm:text-sm"
          >
            {statusFilter}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 z-20 mt-2 w-44 max-w-[calc(100vw-32px)] rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setStatusFilter(option);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  {option}
                  {option === statusFilter && <Check className="h-4 w-4 text-[#2F6FE0]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search box — hits the backend `search` param */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or company..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F6FE0]/30"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading applications...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* List */}
      {!loading && !error && (
        <>
          <div className="flex flex-col gap-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 sm:gap-4 sm:p-4"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-bold text-[#2F6FE0] sm:h-12 sm:w-12 sm:text-lg">
                  {getInitial(app.full_name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{app.full_name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {app.current_company || app.email}
                  </p>
                  <p className="truncate text-xs text-slate-400">{formatDate(app.created_at)}</p>
                </div>

                {/* Status + chevron */}
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize sm:px-3 sm:text-xs ${getStatusStyle(app.status)}`}
                  >
                    {app.status}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 sm:block" />
                </div>
              </div>
            ))}

            {applications.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                No applications found{query ? ` for "${query}"` : ""}.
              </p>
            )}
          </div>

          {/* Pagination controls */}
          {pageInfo.count > 0 && (
            <div className="mt-4 flex flex-col items-center gap-3 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:justify-between sm:gap-0">
              <button
                type="button"
                disabled={!pageInfo.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="order-first text-center text-xs text-slate-400 sm:order-none sm:text-sm">
                Page {page} of {totalPages} · {pageInfo.count} totals
              </span>

              <button
                type="button"
                disabled={!pageInfo.next}
                onClick={() => setPage((p) => p + 1)}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:w-auto"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}