"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
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

// ==================================================
// COMPONENT
// ==================================================

const ApplicationOverview = () => {
  const [applications, setApplications] = useState<Application[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // ==================================================
  // FETCH APPLICATIONS
  // ==================================================

  const fetchApplications = useCallback(
    async (signal: AbortSignal) => {
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
        // API REQUEST
        // --------------------------------------------

        const res = await fetch(LIST_URL, {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          signal,
        });

        // --------------------------------------------
        // 401 ERROR
        // --------------------------------------------

        if (res.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        // --------------------------------------------
        // OTHER ERROR
        // --------------------------------------------

        if (!res.ok) {
          throw new Error(
            `Request failed with status ${res.status}`
          );
        }

        // --------------------------------------------
        // RESPONSE
        // --------------------------------------------

        const data = await res.json();

        /*
          Expected backend response:

          {
            success: true,
            applications: [...]
          }
        */

        setApplications(
          Array.isArray(data.applications)
            ? data.applications
            : []
        );
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

    fetchApplications(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchApplications]);

  // ==================================================
  // CURRENT MONTH APPLICATIONS
  // ==================================================

  const thisMonthApplications = useMemo(() => {
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return applications.filter((application) => {
      const rawDate =
        application.created_at ||
        application.createdAt;

      if (!rawDate) {
        return false;
      }

      const createdDate = new Date(rawDate);

      if (isNaN(createdDate.getTime())) {
        return false;
      }

      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      );
    });
  }, [applications]);

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

    thisMonthApplications.forEach((application) => {
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
  }, [thisMonthApplications]);

  // ==================================================
  // TOTAL APPLICATIONS
  // ==================================================

  const totalApplications =
    thisMonthApplications.length;

  // ==================================================
  // CHART DATA
  // ==================================================

  const chartData = useMemo<ChartData[]>(() => {
    const grouped: Record<string, number> = {};

    thisMonthApplications.forEach((application) => {
      const rawDate =
        application.created_at ||
        application.createdAt;

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

          label: dateObj.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            }
          ),

          applications: count,
        };
      });
  }, [thisMonthApplications]);

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
            this month
          </p>
        </div>

        {/* Month Dropdown */}

        <button
          type="button"
          className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-slate-50 hover:shadow"
        >
          <span>This Month</span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-500"
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
              No applications found this month
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