"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API || "";
const LIST_URL = `${API_BASE}/api/my-applications/`;

// Backend max_page_size is 100 (see MyApplicationsPagination), so we
// request the largest batch allowed and walk the "next" links to build
// the full history the overview/chart needs.
const FETCH_PAGE_SIZE = 100;

// ==================================================
// TYPES
// ==================================================

interface Application {
  id: number | string;
  status?: string;
  created_at?: string;
  createdAt?: string;
}

interface ChartData {
  date: string;
  label: string;
  applications: number;
}

interface ApplicationsPageResponse {
  success: boolean;
  count: number;
  next: string | null;
  previous: string | null;
  applications: Application[];
}

// ==================================================
// FILTER OPTIONS
// ==================================================

type FilterValue = "thisMonth" | "previousMonth" | "thisYear" | "all";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "thisMonth", label: "This Month" },
  { value: "previousMonth", label: "Previous Month" },
  { value: "thisYear", label: "This Year" },
  { value: "all", label: "All Time" },
];

const FILTER_SUFFIX: Record<FilterValue, string> = {
  thisMonth: "this month",
  previousMonth: "last month",
  thisYear: "this year",
  all: "overall",
};

// ==================================================
// COMPONENT
// ==================================================

const ApplicationOverview = () => {
  const [applications, setApplications] = useState<Application[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // FILTER STATE
  // --------------------------------------------------

  const [filter, setFilter] = useState<FilterValue>("thisMonth");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ==================================================
  // FETCH APPLICATIONS (walks every paginated page)
  // ==================================================

  const fetchApplications = useCallback(
    async (activeFilter: FilterValue, signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        // --------------------------------------------
        // GET ACCESS TOKEN
        // --------------------------------------------

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access")
            : null;

        if (!token) {
          throw new Error(
            "You're not logged in. Please log in to view your applications."
          );
        }

        // --------------------------------------------
        // WALK ALL PAGES
        //
        // Backend now applies the date-range filter itself via
        // ?range=, so this only loops if a filtered result set still
        // spans more than FETCH_PAGE_SIZE records.
        // --------------------------------------------

        let nextUrl: string | null = `${LIST_URL}?page_size=${FETCH_PAGE_SIZE}&range=${activeFilter}`;

        let allApplications: Application[] = [];

        while (nextUrl) {
          const res: Response = await fetch(nextUrl, {
            method: "GET",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            signal,
          });

          // ------------------------------------------
          // 401 ERROR
          // ------------------------------------------

          if (res.status === 401) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          // ------------------------------------------
          // OTHER ERROR
          // ------------------------------------------

          if (!res.ok) {
            throw new Error(
              `Request failed with status ${res.status}`
            );
          }

          // ------------------------------------------
          // RESPONSE
          // ------------------------------------------

          const data: ApplicationsPageResponse = await res.json();

          const pageApplications = Array.isArray(
            data.applications
          )
            ? data.applications
            : [];

          allApplications = allApplications.concat(
            pageApplications
          );

          nextUrl = data.next || null;
        }

        setApplications(allApplications);
      } catch (err: any) {
        // Ignore abort errors
        if (err?.name !== "AbortError") {
          setError(
            err?.message ||
              "Something went wrong while loading applications."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==================================================
  // FETCH ON COMPONENT MOUNT
  // ==================================================

  useEffect(() => {
    const controller = new AbortController();

    fetchApplications(filter, controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchApplications, filter]);

  // ==================================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ==================================================

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==================================================
  // FILTERED APPLICATIONS
  //
  // Backend already applies the date-range filter via ?range=,
  // so `applications` coming back is scoped to the active filter.
  // Kept as its own variable so the rest of the derived state below
  // doesn't need to change names.
  // ==================================================

  const filteredApplications = applications;

  // ==================================================
  // STATUS COUNTS
  // ==================================================

  const statusCounts = useMemo(() => {
    const counts = {
      Applied: 0,
      Shortlisted: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };

    filteredApplications.forEach((application) => {
      const status = application.status
        ?.trim()
        .toLowerCase();

      switch (status) {
        case "applied":
          counts.Applied++;
          break;

        case "shortlisted":
          counts.Shortlisted++;
          break;

        case "interview":
          counts.Interview++;
          break;

        case "offer":
          counts.Offer++;
          break;

        case "rejected":
          counts.Rejected++;
          break;

        default:
          break;
      }
    });

    return counts;
  }, [filteredApplications]);

  // ==================================================
  // TOTAL APPLICATIONS
  // ==================================================

  const totalApplications = filteredApplications.length;

  // ==================================================
  // CHART DATA
  // ==================================================

  const chartData = useMemo<ChartData[]>(() => {
    const grouped: Record<string, number> = {};

    filteredApplications.forEach((application) => {
      const rawDate =
        application.created_at || application.createdAt;

      if (!rawDate) {
        return;
      }

      const date = new Date(rawDate);

      if (isNaN(date.getTime())) {
        return;
      }

      // --------------------------------------------
      // CREATE LOCAL DATE KEY
      // --------------------------------------------

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      const key = `${year}-${month}-${day}`;

      // --------------------------------------------
      // GROUP APPLICATIONS BY DATE
      // --------------------------------------------

      grouped[key] =
        (grouped[key] || 0) + 1;
    });

    // ----------------------------------------------
    // SORT + FORMAT CHART DATA
    // ----------------------------------------------

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) =>
        dateA.localeCompare(dateB)
      )
      .map(([date, count]) => {
        const [year, month, day] =
          date.split("-").map(Number);

        const dateObj = new Date(
          year,
          month - 1,
          day
        );

        return {
          date,

          // "This Year" / "All Time" can span many months, so include
          // the year in the label to avoid ambiguous dates repeating.
          label: dateObj.toLocaleDateString(
            "en-US",
            filter === "thisYear" || filter === "all"
              ? {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                }
              : {
                  month: "short",
                  day: "numeric",
                }
          ),

          applications: count,
        };
      });
  }, [filteredApplications, filter]);

  // ==================================================
  // FILTER LABEL HELPERS
  // ==================================================

  const activeFilterLabel =
    FILTER_OPTIONS.find((option) => option.value === filter)
      ?.label || "This Month";

  const filterSuffix = FILTER_SUFFIX[filter];

  // ==================================================
  // LOADING UI
  // ==================================================

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        {/* Header Skeleton */}

        <div className="mb-6 flex items-center justify-between">
          <div className="h-7 w-52 animate-pulse rounded-md bg-slate-200" />

          <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200" />
        </div>

        {/* Chart Skeleton */}

        <div className="h-[300px] animate-pulse rounded-xl bg-slate-100 sm:h-[350px]" />

        {/* Cards Skeleton */}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-[62px] animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR UI
  // ==================================================

  if (error) {
    return (
      <div className="w-full rounded-2xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          {/* Error Icon */}

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-500">
            !
          </div>

          <h3 className="text-base font-semibold text-slate-800">
            Unable to load applications
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Title */}

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Applications Overview
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {totalApplications}{" "}
            {totalApplications === 1
              ? "application"
              : "applications"}{" "}
            {filterSuffix}
          </p>
        </div>

        {/* Filter Dropdown */}

        <div className="relative w-fit" ref={dropdownRef}>
          <button
            type="button"
            onClick={() =>
              setIsDropdownOpen((previous) => !previous)
            }
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-slate-50 hover:shadow"
          >
            <span>{activeFilterLabel}</span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19 9-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <ul
              role="listbox"
              className="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              {FILTER_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={filter === option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                      filter === option.value
                        ? "bg-blue-50 font-medium text-blue-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ==================================================
          CHART
      ================================================== */}

      <div className="h-[300px] w-full sm:h-[350px]">

        {chartData.length === 0 ? (

          // --------------------------------------------
          // NO DATA
          // --------------------------------------------

          <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3v18h18"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m7 16 4-4 3 3 5-6"
                />
              </svg>
            </div>

            <p className="text-sm font-semibold text-slate-700">
              No applications found {filterSuffix}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Your application activity will appear here.
            </p>
          </div>

        ) : (

          // --------------------------------------------
          // AREA CHART
          // --------------------------------------------

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={chartData}
              margin={{
                top: 15,
                right: 10,
                left: -15,
                bottom: 5,
              }}
            >

              {/* Gradient */}

              <defs>
                <linearGradient
                  id="applicationGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#2f6fed"
                    stopOpacity={0.2}
                  />

                  <stop
                    offset="100%"
                    stopColor="#2f6fed"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              {/* Grid */}

              <CartesianGrid
                stroke="#e5eaf1"
                strokeDasharray="4 5"
                vertical={false}
              />

              {/* X Axis */}

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#8b9bb3",
                  fontSize: 13,
                }}
                dy={10}
              />

              {/* Y Axis */}

              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#8b9bb3",
                  fontSize: 13,
                }}
                width={35}
              />

              {/* Tooltip */}

              <Tooltip
                cursor={{
                  stroke: "#cbd5e1",
                  strokeDasharray: "4 4",
                }}
                content={({
                  active,
                  payload,
                }) => {
                  if (
                    !active ||
                    !payload ||
                    payload.length === 0
                  ) {
                    return null;
                  }

                  const data =
                    payload[0]
                      .payload as ChartData;

                  return (
                    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-xl">

                      <p className="mb-1 text-xs font-medium text-slate-400">
                        {data.label}
                      </p>

                      <p className="text-sm font-semibold text-slate-900">
                        {data.applications}{" "}
                        {data.applications === 1
                          ? "application"
                          : "applications"}
                      </p>

                    </div>
                  );
                }}
              />

              {/* Area */}

              <Area
                type="monotone"
                dataKey="applications"
                stroke="#2f6fed"
                strokeWidth={3}
                fill="url(#applicationGradient)"
                dot={{
                  r: 5,
                  strokeWidth: 3,
                  stroke: "#2f6fed",
                  fill: "#ffffff",
                }}
                activeDot={{
                  r: 7,
                  strokeWidth: 3,
                  stroke: "#2f6fed",
                  fill: "#ffffff",
                }}
              />

            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ==================================================
          STATUS CARDS
      ================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

        {/* ==================================================
            APPLIED
        ================================================== */}

        <div className="group flex min-h-[62px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">

          <span className="h-3 w-3 shrink-0 rounded-full bg-blue-600" />

          <span className="text-lg font-semibold text-slate-900">
            {totalApplications}
          </span>

          <span className="text-sm text-slate-600">
            Applied
          </span>

        </div>

        {/* ==================================================
            SHORTLISTED
        ================================================== */}

        <div className="group flex min-h-[62px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-green-100 hover:shadow-md">

          <span className="h-3 w-3 shrink-0 rounded-full bg-green-500" />

          <span className="text-lg font-semibold text-slate-900">
            {statusCounts.Shortlisted}
          </span>

          <span className="text-sm text-slate-600">
            Shortlisted
          </span>

        </div>

        {/* ==================================================
            INTERVIEW
        ================================================== */}

        <div className="group flex min-h-[62px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-100 hover:shadow-md">

          <span className="h-3 w-3 shrink-0 rounded-full bg-purple-500" />

          <span className="text-lg font-semibold text-slate-900">
            {statusCounts.Interview}
          </span>

          <span className="text-sm text-slate-600">
            Interview
          </span>

        </div>

        {/* ==================================================
            OFFER
        ================================================== */}

        <div className="group flex min-h-[62px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-100 hover:shadow-md">

          <span className="h-3 w-3 shrink-0 rounded-full bg-amber-500" />

          <span className="text-lg font-semibold text-slate-900">
            {statusCounts.Offer}
          </span>

          <span className="text-sm text-slate-600">
            Offer
          </span>

        </div>

        {/* ==================================================
            REJECTED
        ================================================== */}

        <div className="group flex min-h-[62px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md">

          <span className="h-3 w-3 shrink-0 rounded-full bg-red-500" />

          <span className="text-lg font-semibold text-slate-900">
            {statusCounts.Rejected}
          </span>

          <span className="text-sm text-slate-600">
            Rejected
          </span>

        </div>

      </div>
    </div>
  );
};

export default ApplicationOverview;