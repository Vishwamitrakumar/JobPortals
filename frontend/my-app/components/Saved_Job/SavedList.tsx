"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark,
  Search,
  MapPin,
  BriefcaseBusiness,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  ArrowUpRight,
  CalendarDays,
  X,
  BookmarkX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// ======================================================
// TYPES
// ======================================================

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

  company_logo?: string;
}


// ======================================================
// PAGE
// ======================================================

export default function SavedList() {
  const [jobs, setJobs] = React.useState<SavedJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [location, setLocation] = React.useState("all");
  const [jobType, setJobType] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("recent");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // ======================================================
  // GET SAVED JOBS
  // ======================================================

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access")
          : null;

      const API_URL = process.env.NEXT_PUBLIC_API;

      const response = await fetch(
        `${API_URL}/api/saved-jobs/?page=${currentPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch saved jobs (${response.status})`
        );
      }

      const data = await response.json();

      console.log("Saved Jobs API:", data);

      // Pagination response
      if (data.results?.success) {
        setJobs(data.results.jobs || []);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 6));
      } else {
        setJobs([]);
        setTotalCount(0);
        setTotalPages(1);
      }

    } catch (error) {
      console.error(error);
      setError("Unable to load saved jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  React.useEffect(() => {
    fetchSavedJobs();
  }, [currentPage]);


  // ======================================================
  // REMOVE SAVED JOB
  // ======================================================

  const removeSavedJob = async (jobId: number) => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access")
          : null;

      const API_URL = process.env.NEXT_PUBLIC_API;

      const response = await fetch(
        `${API_URL}/api/jobs/${jobId}/unsave/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",

            ...(token
              ? {
                Authorization: `Bearer ${token}`,
              }
              : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove saved job");
      }

      // Remove from UI immediately
      setJobs((previousJobs) =>
        previousJobs.filter(
          (job) => job.job_id !== jobId
        )
      );
    } catch (error) {
      console.error(error);
    }
  };


  // ======================================================
  // SELECT HANDLERS
  // Some Select implementations (e.g. Base UI) call onValueChange
  // with `string | null`, but our state setters are typed as
  // `string`. These wrappers absorb the `null` case with a
  // sensible fallback instead of passing the raw setter directly.
  // ======================================================

  const handleLocationChange = (value: string | null) => {
    setLocation(value ?? "all");
  };

  const handleJobTypeChange = (value: string | null) => {
    setJobType(value ?? "all");
  };

  const handleSortByChange = (value: string | null) => {
    setSortBy(value ?? "recent");
  };


  // ======================================================
  // FILTER JOBS
  // ======================================================

  const filteredJobs = React.useMemo(() => {
    let result = [...jobs];

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.company?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query)
      );
    }

    // Location
    if (location !== "all") {
      result = result.filter(
        (job) =>
          job.location?.toLowerCase() ===
          location.toLowerCase()
      );
    }

    // Job Type
    if (jobType !== "all") {
      result = result.filter(
        (job) =>
          job.job_type?.toLowerCase() ===
          jobType.toLowerCase()
      );
    }

    // Sort
    if (sortBy === "recent") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
    }

    if (sortBy === "title") {
      result.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }

    return result;
  }, [
    jobs,
    search,
    location,
    jobType,
    sortBy,
  ]);


  // ======================================================
  // CLEAR SEARCH
  // ======================================================

  const clearSearch = () => {
    setSearch("");
    setLocation("all");
    setJobType("all");
  };


  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date: string) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  const getLogoUrl = (logo?: string) => {
    if (!logo) return null;

    if (logo.startsWith("http")) {
      return logo;
    }

    return `${process.env.NEXT_PUBLIC_API}/media/${logo}`;
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] px-5 py-8 md:px-8">

        <div className="mx-auto max-w-[1400px]">

          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 w-52 animate-pulse rounded-lg bg-slate-200" />

            <div className="mt-3 h-5 w-64 animate-pulse rounded bg-slate-200" />
          </div>

          {/* Filter Skeleton */}
          <div className="mb-8 h-24 animate-pulse rounded-2xl bg-white shadow-sm" />

          {/* Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[320px] animate-pulse rounded-2xl bg-white"
              />
            ))}

          </div>

        </div>

      </div>
    );
  }



  return (
    <div className="min-h-screen px-5 py-7 md:px-8 lg:px-10">

      <div className="mx-auto max-w-[1400px]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-7 flex items-start justify-between">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#081b3a] md:text-4xl">
                Saved Jobs
              </h1>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <Bookmark
                  size={22}
                  className="fill-blue-600 text-blue-600"
                />
              </div>

            </div>

            <p className="mt-2 font-serif text-base text-slate-500">
              Jobs you've saved for later
            </p>

          </div>


          {/* Decorative icon */}
          <div className="hidden items-center justify-center md:flex">

            <div className="relative">

              <div className="absolute -left-4 top-1 text-yellow-400">
                ✦
              </div>

              <div className="flex h-16 w-20 items-center justify-center rounded-2xl bg-blue-50">
                <Bookmark
                  size={42}
                  className="fill-blue-500 text-blue-500"
                />
              </div>

              <div className="absolute -right-3 -top-2 text-red-400">
                ♥
              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}


        {/* ==================================================
            FILTER BOX
        ================================================== */}

        <Card className="mb-7 rounded-2xl border-slate-200 bg-white shadow-sm">

          <CardContent className="p-4">

            <div className="flex flex-col gap-3 lg:flex-row">

              {/* Search */}

              <div className="relative flex-1">

                <Search
                  size={19}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                />

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search saved jobs..."
                  className="h-14 rounded-xl border-slate-200 pl-11 pr-10 font-serif text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-blue-100"
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={17} />
                  </button>
                )}

              </div>


              {/* Location */}

              <Select
                value={location}
                onValueChange={handleLocationChange}
              >

                <SelectTrigger className="h-14 w-full rounded-xl border-slate-200 font-serif shadow-none lg:w-[190px]">
                  <div className="flex items-center gap-2">

                    <MapPin
                      size={18}
                      className="text-slate-500"
                    />

                    <SelectValue placeholder="All Locations" />

                  </div>
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    All Locations
                  </SelectItem>

                  <SelectItem value="Jaipur">
                    Jaipur
                  </SelectItem>

                  <SelectItem value="Delhi">
                    Delhi
                  </SelectItem>

                  <SelectItem value="Bangalore">
                    Bangalore
                  </SelectItem>

                  <SelectItem value="Mumbai">
                    Mumbai
                  </SelectItem>

                </SelectContent>

              </Select>


              {/* Job Type */}

              <Select
                value={jobType}
                onValueChange={handleJobTypeChange}
              >

                <SelectTrigger className="h-14 w-full rounded-xl border-slate-200 font-serif shadow-none lg:w-[180px]">

                  <div className="flex items-center gap-2">

                    <BriefcaseBusiness
                      size={18}
                      className="text-slate-500"
                    />

                    <SelectValue placeholder="Job Type" />

                  </div>

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    Job Type
                  </SelectItem>

                  <SelectItem value="Full-time">
                    Full-time
                  </SelectItem>

                  <SelectItem value="Part-time">
                    Part-time
                  </SelectItem>

                  <SelectItem value="Internship">
                    Internship
                  </SelectItem>

                  <SelectItem value="Contract">
                    Contract
                  </SelectItem>

                </SelectContent>

              </Select>



              {/* Refresh */}

              <Button
                onClick={fetchSavedJobs}
                className="h-14 rounded-xl bg-blue-600 px-6 font-serif font-semibold text-white shadow-none hover:bg-blue-700"
              >

                <RefreshCw size={17} />

                Refresh

              </Button>

            </div>

          </CardContent>

        </Card>


        {/* ==================================================
            RESULT HEADER
        ================================================== */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="font-serif text-[15px] text-slate-600">

            Showing{" "}

            <span className="font-bold text-blue-600">
              {filteredJobs.length}
            </span>{" "}

            saved jobs

          </p>


          {/* Sort */}

          <div className="flex items-center gap-2">

            <span className="font-serif text-sm text-slate-500">
              Sort by:
            </span>

            <Select
              value={sortBy}
              onValueChange={handleSortByChange}
            >

              <SelectTrigger className="h-10 w-[145px] rounded-lg border-slate-200 bg-white font-serif shadow-none">

                <SelectValue />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="recent">
                  Recently Saved
                </SelectItem>

                <SelectItem value="oldest">
                  Oldest Saved
                </SelectItem>

                <SelectItem value="title">
                  Job Title
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

        </div>


        {/* ==================================================
            JOB CARDS
        ================================================== */}

        {filteredJobs.length > 0 ? (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredJobs.map((job) => (

              <Card
                key={job.id}
                className="group relative overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >

                {/* Accent bar */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-sky-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                {/* Card Header */}

                <CardHeader className="p-5 pb-3">

                  <div className="flex items-start justify-between">

                    {/* Company Logo */}

                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                      {job.company_logo ? (
                        <img
                          src={getLogoUrl(job.company_logo) || ""}
                          alt={job.company}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-blue-600">
                          {job.company?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                      )}

                    </div>


                    {/* Saved Button */}

                    <button
                      onClick={() =>
                        removeSavedJob(job.job_id)
                      }
                      title="Remove from saved"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >

                      <Bookmark
                        size={19}
                        className="fill-current"
                      />

                    </button>

                  </div>

                </CardHeader>


                {/* Card Content */}

                <CardContent className="px-5 pb-4">

                  {/* Company */}

                  <h2 className="font-serif text-[18px] font-bold text-[#071b3a]">
                    {job.company}
                  </h2>


                  {/* Title */}

                  <h3 className="mt-1.5 font-serif text-[16px] font-bold text-blue-600">
                    {job.title}
                  </h3>


                  {/* Tags */}

                  <div className="mt-4 flex flex-wrap gap-2">

                    {job.job_type && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                        {job.job_type}
                      </span>
                    )}

                    {job.level && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                        {job.level}
                      </span>
                    )}

                    {job.category && (
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
                        {job.category}
                      </span>
                    )}

                  </div>


                  {/* Location */}

                  <div className="mt-5 flex items-center gap-2 text-slate-500">

                    <MapPin
                      size={16}
                      className="shrink-0"
                    />

                    <span className="font-serif text-sm">
                      {job.location}
                    </span>

                  </div>

                </CardContent>


                {/* Card Footer */}

                <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-4">

                  {/* Saved Date */}

                  <div className="flex items-center gap-2 text-slate-500">

                    <CalendarDays size={15} />

                    <span className="font-serif text-xs">
                      Saved on{" "}
                      {formatDate(job.created_at)}
                    </span>

                  </div>


                  {/* Apply Now */}

                  <Link
                    href={`/main/Apply/${job.job_id}`}
                    className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 font-serif text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:gap-2.5 hover:bg-blue-700 hover:shadow-md"
                  >

                    Apply Now

                    <ArrowUpRight
                      size={16}
                    />

                  </Link>

                </CardFooter>

              </Card>

            ))}

          </div>

        ) : (

          /* ==================================================
             EMPTY STATE
          ================================================== */

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">

            <CardContent className="flex flex-col items-center justify-center py-20 text-center">

              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">

                <BookmarkX
                  size={34}
                  className="text-blue-500"
                />

              </div>

              <h2 className="font-serif text-2xl font-bold text-[#071b3a]">
                {jobs.length === 0
                  ? "No saved jobs"
                  : "No jobs found"}
              </h2>

              <p className="mt-2 max-w-md font-serif text-sm leading-6 text-slate-500">

                {jobs.length === 0
                  ? "You haven't saved any jobs yet. Browse jobs and bookmark the ones you're interested in."
                  : "Try changing your search or filters to find your saved jobs."}

              </p>

              {jobs.length === 0 ? (

                <Button

                  className="mt-6 rounded-xl bg-blue-600 font-serif hover:bg-blue-700"
                >

                  <Link href="/main/BrowseJobs" className="flex items-center gap-1.5">

                    Browse Jobs

                    <ArrowUpRight size={17} />

                  </Link>

                </Button>

              ) : (

                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-6 rounded-xl font-serif"
                >
                  Clear Filters
                </Button>

              )}

            </CardContent>

          </Card>

        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">

            {/* Previous */}
            <Button
              variant="outline"
              disabled={currentPage === 1 || loading}
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
              className="h-10 rounded-lg px-4"
            >
              Previous
            </Button>

            {/* Page Numbers */}
            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                disabled={loading}
                onClick={() => setCurrentPage(page)}
                className={`h-10 min-w-10 rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50"
                }`}
              >
                {page}
              </Button>
            ))}

            {/* Next */}
            <Button
              variant="outline"
              disabled={currentPage === totalPages || loading}
              onClick={() =>
                setCurrentPage((page) => page + 1)
              }
              className="h-10 rounded-lg px-4"
            >
              Next
            </Button>

          </div>
        )}

      </div>

    </div>
  );
}