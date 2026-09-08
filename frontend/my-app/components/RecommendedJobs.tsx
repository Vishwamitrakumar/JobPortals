"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import Link from "next/link";

// -----------------------------------------------------------------------------
// JOB TYPE
// -----------------------------------------------------------------------------

interface Job {
  id: number;
  job_title: string;
  job_category: string;
  job_type: string;
  experience_level: string;
  location: string;
  salary_range: string;
  description: string;
  key_skills: string;
  min_qualification: string;
  experience_years: string;
  deadline: string;
  openings: number;
  benefits: string;
  company_name: string;
  logo: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// SAVED JOB TYPE
// -----------------------------------------------------------------------------

interface SavedJob {
  id: number;
  job_id: number;
  created_at: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  level: string;
  category: string;
  logo: string;
}

interface SavedJobsListResponse {
  success: boolean;
  count: number;
  jobs: SavedJob[];
}

// -----------------------------------------------------------------------------
// API URL
// -----------------------------------------------------------------------------

const API_URL = `${process.env.NEXT_PUBLIC_API}/api/jobs`;
const SAVED_JOBS_URL = `${process.env.NEXT_PUBLIC_API}/api/saved-jobs/`;

// -----------------------------------------------------------------------------
// UI SETTINGS
// -----------------------------------------------------------------------------

const VISIBLE_CARDS = 2;
const CARD_HEIGHT = 104;

// How many extra cards to reveal every time the user scrolls near the
// bottom of the list. Keeping this small is what makes the "load on
// scroll" behaviour actually help performance (fewer DOM nodes / images
// mounted at once instead of rendering the entire jobs array up front).
const PAGE_SIZE = 5;

// -----------------------------------------------------------------------------
// TIME AGO
// -----------------------------------------------------------------------------

function timeAgo(dateString: string) {
  const created = new Date(dateString).getTime();
  const now = Date.now();

  const diffMs = now - created;

  if (Number.isNaN(created)) {
    return "";
  }

  const diffDays = Math.floor(
    diffMs / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    const diffHours = Math.floor(
      diffMs / (1000 * 60 * 60)
    );

    if (diffHours <= 0) {
      const diffMins = Math.max(
        1,
        Math.floor(diffMs / (1000 * 60))
      );

      return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    }

    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  return `${diffDays} days ago`;
}

// -----------------------------------------------------------------------------
// GET ACCESS TOKEN
// -----------------------------------------------------------------------------

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access");
}

// -----------------------------------------------------------------------------
// SAVE / UNSAVE JOB
// -----------------------------------------------------------------------------

async function saveOrUnsaveJob(
  jobId: number,
  action: "save" | "unsave"
) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("User is not logged in");
  }

  const response = await fetch(
    `${API_URL}/${jobId}/${action}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Failed to ${action} job. Status: ${response.status}`
    );
  }

  return data;
}

// -----------------------------------------------------------------------------
// SORT JOBS — NEWEST FIRST (DESCENDING BY created_at)
// -----------------------------------------------------------------------------

function sortJobsDescending(list: Job[]): Job[] {
  return [...list].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();

    // Push invalid/missing dates to the end instead of letting
    // NaN comparisons silently break the sort order.
    const safeA = Number.isNaN(timeA) ? -Infinity : timeA;
    const safeB = Number.isNaN(timeB) ? -Infinity : timeB;

    return safeB - safeA;
  });
}

// -----------------------------------------------------------------------------
// COMPANY LOGO
// -----------------------------------------------------------------------------

function CompanyLogo({ job }: { job: Job }) {
  const [errored, setErrored] = useState(false);

  if (!job.logo || errored) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-bold text-blue-600">
        {job.company_name?.charAt(0)?.toUpperCase() || "?"}
      </div>
    );
  }

  const logoUrl = job.logo.startsWith("http")
    ? job.logo
    : `${process.env.NEXT_PUBLIC_API}/media/${job.logo}`;

  return (
    <img
      src={logoUrl}
      alt={`${job.company_name} logo`}
      onError={() => setErrored(true)}
      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
      loading="lazy"
    />
  );
}

// -----------------------------------------------------------------------------
// SKELETON
// -----------------------------------------------------------------------------

function JobCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-200" />

        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-3 w-36 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
      </div>

      <div className="h-8 w-24 rounded-md bg-slate-200 sm:ml-auto" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export default function RecommendedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Saved job IDs
  const [savedJobs, setSavedJobs] = useState<Set<number>>(
    new Set()
  );

  // Pending API requests
  const [pendingJobs, setPendingJobs] = useState<Set<number>>(
    new Set()
  );

  // How many jobs are currently rendered on screen. Starts at PAGE_SIZE
  // and grows as the user scrolls, instead of mounting every job/card
  // (and every logo <img>) up front.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Scrollable list container (the same element that already had
  // overflow-y-auto) — we watch scroll position on this element.
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Invisible marker placed after the last rendered card. When it
  // enters the scroll container's viewport we reveal more cards.
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------------------------
  // LOAD JOBS + SAVED JOBS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken();

        // ---------------------------------------------------------------------
        // FETCH ALL JOBS
        // ---------------------------------------------------------------------

        const jobsRequest = fetch(API_URL);

        // ---------------------------------------------------------------------
        // FETCH SAVED JOBS
        // ---------------------------------------------------------------------

        const savedJobsRequest = token
          ? fetch(SAVED_JOBS_URL, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          : null;

        const [jobsResponse, savedResponse] =
          await Promise.all([
            jobsRequest,
            savedJobsRequest,
          ]);

        // ---------------------------------------------------------------------
        // JOBS RESPONSE
        // ---------------------------------------------------------------------

        if (!jobsResponse.ok) {
          throw new Error(
            `Jobs request failed: ${jobsResponse.status}`
          );
        }

        const jobsData = await jobsResponse.json();

        if (!Array.isArray(jobsData)) {
          throw new Error(
            "Jobs API did not return an array"
          );
        }

        // ---------------------------------------------------------------------
        // SAVED JOB RESPONSE
        //
        // Backend:
        //
        // {
        //   success: true,
        //   count: 3,
        //   jobs: [
        //     {
        //       id: 32,
        //       job_id: 1,
        //       title: "React Developer",
        //       ...
        //     }
        //   ]
        // }
        // ---------------------------------------------------------------------

        let savedIds = new Set<number>();

        if (savedResponse && savedResponse.ok) {
          const savedData: SavedJobsListResponse =
            await savedResponse.json();

          const savedJobsList = Array.isArray(
            savedData?.jobs
          )
            ? savedData.jobs
            : [];

          savedIds = new Set(
            savedJobsList
              .map((savedJob) => Number(savedJob.job_id))
              .filter(
                (id) =>
                  !Number.isNaN(id)
              )
          );
        } else if (
          savedResponse &&
          savedResponse.status === 401
        ) {
          console.warn(
            "Saved jobs request: user is not authenticated"
          );
        }

        // ---------------------------------------------------------------------
        // UPDATE STATE
        // ---------------------------------------------------------------------

        if (!cancelled) {
          // Newest jobs first.
          setJobs(sortJobsDescending(jobsData));
          setSavedJobs(savedIds);
          setVisibleCount(PAGE_SIZE);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load jobs"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // LOAD MORE ON SCROLL
  //
  // Uses an IntersectionObserver scoped to the scrollable card list, so
  // more cards are only mounted once the sentinel div at the bottom of
  // the currently rendered set scrolls into view.
  // ---------------------------------------------------------------------------

  const loadMore = useCallback(() => {
    setVisibleCount((previous) => {
      if (previous >= jobs.length) {
        return previous;
      }

      return Math.min(previous + PAGE_SIZE, jobs.length);
    });
  }, [jobs.length]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      {
        root,
        rootMargin: "100px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, jobs.length]);

  // ---------------------------------------------------------------------------
  // SAVE JOB
  // ---------------------------------------------------------------------------

  const handleSave = async (jobId: number) => {
    if (pendingJobs.has(jobId)) {
      return;
    }

    if (savedJobs.has(jobId)) {
      return;
    }

    // Optimistic UI
    setSavedJobs((previous) => {
      const next = new Set(previous);

      next.add(jobId);

      return next;
    });

    setPendingJobs((previous) => {
      const next = new Set(previous);

      next.add(jobId);

      return next;
    });

    try {
      await saveOrUnsaveJob(jobId, "save");
    } catch (err) {
      console.error("Save job error:", err);

      // Revert if API failed
      setSavedJobs((previous) => {
        const next = new Set(previous);

        next.delete(jobId);

        return next;
      });
    } finally {
      setPendingJobs((previous) => {
        const next = new Set(previous);

        next.delete(jobId);

        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // UNSAVE JOB
  // ---------------------------------------------------------------------------

  const handleUnsave = async (jobId: number) => {
    if (pendingJobs.has(jobId)) {
      return;
    }

    if (!savedJobs.has(jobId)) {
      return;
    }

    // Optimistic UI
    setSavedJobs((previous) => {
      const next = new Set(previous);

      next.delete(jobId);

      return next;
    });

    setPendingJobs((previous) => {
      const next = new Set(previous);

      next.add(jobId);

      return next;
    });

    try {
      await saveOrUnsaveJob(jobId, "unsave");
    } catch (err) {
      console.error("Unsave job error:", err);

      // Restore if API failed
      setSavedJobs((previous) => {
        const next = new Set(previous);

        next.add(jobId);

        return next;
      });
    } finally {
      setPendingJobs((previous) => {
        const next = new Set(previous);

        next.delete(jobId);

        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // BOOKMARK TOGGLE
  // ---------------------------------------------------------------------------

  const handleBookmarkClick = (jobId: number) => {
    if (pendingJobs.has(jobId)) {
      return;
    }

    if (savedJobs.has(jobId)) {
      handleUnsave(jobId);
    } else {
      handleSave(jobId);
    }
  };

  // ---------------------------------------------------------------------------
  // JOBS CURRENTLY RENDERED (windowed slice of the full, sorted list)
  // ---------------------------------------------------------------------------

  const visibleJobs = jobs.slice(0, visibleCount);
  const hasMore = visibleCount < jobs.length;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <Card className="rounded-2xl p-4 sm:p-6">

      {/* ------------------------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Recommended Jobs
        </h2>

        <Link
          href="/main/Company"
          className="text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          View All
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* JOB LIST */}
      {/* ------------------------------------------------------------------ */}

      <div
        ref={scrollContainerRef}
        className="mt-5 flex flex-col gap-4 overflow-y-auto pr-1"
        style={{
          maxHeight: VISIBLE_CARDS * CARD_HEIGHT,
        }}
      >

        {/* --------------------------------------------------------------- */}
        {/* LOADING */}
        {/* --------------------------------------------------------------- */}

        {loading && (
          <>
            <JobCardSkeleton />
            <JobCardSkeleton />
          </>
        )}

        {/* --------------------------------------------------------------- */}
        {/* ERROR */}
        {/* --------------------------------------------------------------- */}

        {!loading && error && (
          <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            Couldn&apos;t load jobs: {error}
          </p>
        )}

        {/* --------------------------------------------------------------- */}
        {/* EMPTY */}
        {/* --------------------------------------------------------------- */}

        {!loading &&
          !error &&
          jobs.length === 0 && (
            <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              No jobs available right now.
            </p>
          )}

        {/* --------------------------------------------------------------- */}
        {/* JOB CARDS */}
        {/* --------------------------------------------------------------- */}

        {!loading &&
          !error &&
          visibleJobs.map((job) => {
            const isSaved = savedJobs.has(job.id);

            const isPending =
              pendingJobs.has(job.id);

            return (
              <div
                key={job.id}
                className="
                  flex flex-col gap-4
                  rounded-xl
                  border border-slate-200
                  p-4
                  transition-all duration-200
                  hover:border-blue-300
                  hover:shadow-[0_0_0_1px_rgba(147,197,253,0.35)]
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                {/* ------------------------------------------------------ */}
                {/* JOB INFORMATION */}
                {/* ------------------------------------------------------ */}

                <div className="flex gap-4">

                  <CompanyLogo job={job} />

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {job.company_name}
                    </h3>

                    <p className="text-blue-600">
                      {job.job_title}
                    </p>

                    <p className="text-sm text-slate-400">
                      {job.location}
                    </p>

                    <p className="text-sm text-slate-400">
                      {timeAgo(job.created_at)}
                    </p>
                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* ACTIONS */}
                {/* ------------------------------------------------------ */}

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">

                  {/* -------------------------------------------------- */}
                  {/* BOOKMARK BUTTON */}
                  {/* -------------------------------------------------- */}

                  <button
                    type="button"
                    onClick={() =>
                      handleBookmarkClick(job.id)
                    }
                    disabled={isPending}
                    aria-label={
                      isSaved
                        ? "Remove saved job"
                        : "Save job"
                    }
                    title={
                      isSaved
                        ? "Remove from saved jobs"
                        : "Save job"
                    }
                    className={`
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-full
                      border
                      transition-all
                      duration-200
                      ${
                        isPending
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }
                      ${
                        isSaved
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                      }
                    `}
                  >
                    <Bookmark
                      className={`
                        h-5
                        w-5
                        transition-all
                        duration-200
                        ${
                          isSaved
                            ? "fill-blue-600 text-blue-600"
                            : "text-slate-400 hover:text-blue-600"
                        }
                      `}
                    />
                  </button>

                  {/* -------------------------------------------------- */}
                  {/* APPLY */}
                  {/* -------------------------------------------------- */}

                  <Button

                    variant="outline"
                    className="
                      transition-all
                      duration-200
                      hover:border-blue-300
                      hover:text-blue-300
                      hover:shadow-[0_0_0_1px_rgba(147,197,253,0.35)]
                    "
                  >
                    <Link
                      href={`/main/Apply/${job.id}`}
                    >
                      Apply Now
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}

        {/* --------------------------------------------------------------- */}
        {/* LOAD-MORE SENTINEL + INLINE LOADER */}
        {/* --------------------------------------------------------------- */}

        {!loading && !error && hasMore && (
          <>
            <div ref={sentinelRef} aria-hidden="true" />
            <JobCardSkeleton />
          </>
        )}
      </div>
    </Card>
  );
}