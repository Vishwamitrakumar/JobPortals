"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  Clock3,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";

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

const API_URL = `${process.env.NEXT_PUBLIC_API}/api/jobs`;

/* -------------------------------------------------------
   Time Ago
------------------------------------------------------- */

function timeAgo(dateString: string) {
  const created = new Date(dateString).getTime();
  const now = Date.now();

  const diffMs = now - created;

  if (diffMs < 0) {
    return "Just now";
  }

  const diffDays = Math.floor(
    diffMs / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    const diffHours = Math.floor(
      diffMs / (1000 * 60 * 60)
    );

    if (diffHours === 0) {
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

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const weeks = Math.floor(diffDays / 7);

  if (weeks === 1) {
    return "1 week ago";
  }

  return `${weeks} weeks ago`;
}

/* -------------------------------------------------------
   Company Logo
------------------------------------------------------- */

function CompanyLogo({ job }: { job: Job }) {
  const [errored, setErrored] = useState(false);

  if (!job.logo || errored) {
    return (
      <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-bold text-blue-600">
        {job.company_name?.charAt(0)?.toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2">
      <img
        src={job.logo}
        alt={`${job.company_name} logo`}
        onError={() => setErrored(true)}
        className="h-full w-full rounded-xl object-contain"
      />
    </div>
  );
}

/* -------------------------------------------------------
   Salary Parser
------------------------------------------------------- */

function getSalaryNumber(salary: string) {
  if (!salary) return 0;

  const numbers = salary.match(/\d+(\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    return 0;
  }

  return Number(numbers[0]);
}

/* -------------------------------------------------------
   Job Card
------------------------------------------------------- */

function JobCard({ job }: { job: Job }) {
  return (
    <div
      className="
        group
        relative
        flex
        min-h-[405px]
        flex-col
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-[0_4px_20px_rgba(15,23,42,0.04)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-[0_15px_40px_rgba(37,99,235,0.12)]
      "
    >
      {/* Logo + Bookmark */}

      <div className="flex items-start justify-between">
        <CompanyLogo job={job} />

        <button
          type="button"
          aria-label={`Save ${job.job_title}`}
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            border
            border-slate-200
            bg-white
            text-slate-400
            transition
            hover:border-blue-200
            hover:bg-blue-50
            hover:text-blue-600
          "
        >
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      {/* Company + Position */}

      <div className="mt-5">
        <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-slate-900">
          {job.company_name}
        </h3>

        <p className="mt-1 line-clamp-1 text-[17px] font-semibold text-blue-600">
          {job.job_title}
        </p>
      </div>

      {/* Tags */}

      <div className="mt-5 flex flex-wrap gap-2">
        {job.job_type && (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
            {job.job_type}
          </span>
        )}

        {job.experience_level && (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
            {job.experience_level}
          </span>
        )}

        {job.job_category && (
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600">
            {job.job_category}
          </span>
        )}
      </div>

      {/* Location + Posted */}

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-[18px] w-[18px] shrink-0 text-slate-400" />

          <span className="line-clamp-1">
            {job.location || "Remote"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock3 className="h-[18px] w-[18px] shrink-0 text-slate-400" />

          <span>{timeAgo(job.created_at)}</span>
        </div>
      </div>

      {/* Bottom */}

      <div className="mt-auto border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-3">

          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-emerald-600">
              {job.salary_range
                ? `₹ ${job.salary_range}`
                : "Salary not disclosed"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {job.openings || 0}{" "}
              {job.openings === 1
                ? "Opening"
                : "Openings"}
            </p>
          </div>

          <Link
            href={`/main/Apply/${job.id}`}
            className="shrink-0"
          >
            <Button
              className="
                h-12
                rounded-xl
                bg-blue-600
                px-5
                font-semibold
                text-white
                shadow-sm
                transition-all
                hover:bg-blue-700
                hover:shadow-md
              "
            >
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */

export default function Company() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /* Search */

  const [search, setSearch] = useState("");

  /* Filters */

  const [location, setLocation] = useState("all");

  const [salary, setSalary] = useState("all");

  const [jobType, setJobType] = useState("all");

  const [experience, setExperience] = useState("all");

  const [category, setCategory] = useState("all");

  /* -------------------------------------------------------
     Fetch Jobs
  ------------------------------------------------------- */

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_URL);

      if (!res.ok) {
        throw new Error(
          `Request failed with status ${res.status}`
        );
      }

      const data: Job[] = await res.json();

      setJobs(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load jobs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /* -------------------------------------------------------
     Dynamic Filter Options
  ------------------------------------------------------- */

  const locations = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .map((job) => job.location)
          .filter(Boolean)
      )
    );
  }, [jobs]);

  const jobTypes = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .map((job) => job.job_type)
          .filter(Boolean)
      )
    );
  }, [jobs]);

  const experiences = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .map((job) => job.experience_level)
          .filter(Boolean)
      )
    );
  }, [jobs]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .map((job) => job.job_category)
          .filter(Boolean)
      )
    );
  }, [jobs]);

  /* -------------------------------------------------------
     Filter Jobs
  ------------------------------------------------------- */

  const filteredJobs = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return jobs.filter((job) => {

      /* Search */

      const matchesSearch =
        !searchValue ||
        job.job_title
          ?.toLowerCase()
          .includes(searchValue) ||
        job.company_name
          ?.toLowerCase()
          .includes(searchValue) ||
        job.key_skills
          ?.toLowerCase()
          .includes(searchValue) ||
        job.job_category
          ?.toLowerCase()
          .includes(searchValue);

      /* Location */

      const matchesLocation =
        location === "all" ||
        job.location === location;

      /* Job Type */

      const matchesJobType =
        jobType === "all" ||
        job.job_type === jobType;

      /* Experience */

      const matchesExperience =
        experience === "all" ||
        job.experience_level === experience;

      /* Category */

      const matchesCategory =
        category === "all" ||
        job.job_category === category;

      /* Salary */

      const salaryNumber =
        getSalaryNumber(job.salary_range);

      let matchesSalary = true;

      if (salary === "0-6") {
        matchesSalary = salaryNumber <= 6;
      }

      if (salary === "6-10") {
        matchesSalary =
          salaryNumber > 6 &&
          salaryNumber <= 10;
      }

      if (salary === "10-20") {
        matchesSalary =
          salaryNumber > 10 &&
          salaryNumber <= 20;
      }

      if (salary === "20+") {
        matchesSalary = salaryNumber > 20;
      }

      return (
        matchesSearch &&
        matchesLocation &&
        matchesJobType &&
        matchesExperience &&
        matchesCategory &&
        matchesSalary
      );
    });
  }, [
    jobs,
    search,
    location,
    salary,
    jobType,
    experience,
    category,
  ]);

  /* -------------------------------------------------------
     Active Filter Count
  ------------------------------------------------------- */

  const activeFilters =
    [
      location !== "all",
      salary !== "all",
      jobType !== "all",
      experience !== "all",
      category !== "all",
    ].filter(Boolean).length;

  /* -------------------------------------------------------
     Clear Filters
  ------------------------------------------------------- */

  const clearFilters = () => {
    setSearch("");
    setLocation("all");
    setSalary("all");
    setJobType("all");
    setExperience("all");
    setCategory("all");
  };

  return (
    <section className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1450px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-7 flex items-end justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Recommended Jobs
              </h1>

              <Sparkles className="h-6 w-6 fill-amber-400 text-amber-400" />

            </div>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Jobs that may be a good match for you
            </p>

          </div>

          <Link
            href="/main/BrowseJobs"
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            View All Jobs
            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>


        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">

          <div className="flex flex-col gap-3 xl:flex-row">

            {/* Search */}

            <div className="relative flex-1">

              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by job title, skills or company"
                className="
                  h-14
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-12
                  pr-4
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-50
                "
              />

            </div>


            {/* Location */}

            <div className="relative xl:w-[175px]">

              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <select
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                className="
                  h-14
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-12
                  pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-50
                "
              >

                <option value="all">
                  All Locations
                </option>

                {locations.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>


            {/* Salary */}

            <div className="relative xl:w-[150px]">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-500">
                ₹
              </span>

              <select
                value={salary}
                onChange={(e) =>
                  setSalary(e.target.value)
                }
                className="
                  h-14
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-10
                  pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-50
                "
              >

                <option value="all">
                  Salary
                </option>

                <option value="0-6">
                  ₹ 0 - 6 LPA
                </option>

                <option value="6-10">
                  ₹ 6 - 10 LPA
                </option>

                <option value="10-20">
                  ₹ 10 - 20 LPA
                </option>

                <option value="20+">
                  ₹ 20+ LPA
                </option>

              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>


            {/* Job Type */}

            <div className="relative xl:w-[150px]">

              <BriefcaseBusiness className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <select
                value={jobType}
                onChange={(e) =>
                  setJobType(e.target.value)
                }
                className="
                  h-14
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-12
                  pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-50
                "
              >

                <option value="all">
                  Job Type
                </option>

                {jobTypes.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>


            {/* More Filters */}

            <div className="relative xl:w-[190px]">

              <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <select
                value={experience}
                onChange={(e) =>
                  setExperience(e.target.value)
                }
                className="
                  h-14
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-12
                  pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-50
                "
              >

                <option value="all">
                  More Filters
                </option>

                {experiences.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>


            {/* Refresh */}

            <button
              type="button"
              onClick={clearFilters}
              className="
                flex
                h-14
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-700
              "
            >

              <RefreshCw className="h-4 w-4" />

              Refresh

            </button>

          </div>

        </div>


        {/* =================================================
            ACTIVE FILTERS
        ================================================= */}

        {activeFilters > 0 && (

          <div className="mt-5 flex flex-wrap items-center gap-2">

            <span className="mr-1 text-sm font-medium text-slate-600">
              Active Filters:
            </span>


            {location !== "all" && (
              <FilterTag
                text={location}
                onRemove={() =>
                  setLocation("all")
                }
              />
            )}


            {salary !== "all" && (
              <FilterTag
                text={
                  salary === "0-6"
                    ? "₹ 0 - ₹ 6 LPA"
                    : salary === "6-10"
                    ? "₹ 6 - ₹ 10 LPA"
                    : salary === "10-20"
                    ? "₹ 10 - ₹ 20 LPA"
                    : "₹ 20+ LPA"
                }
                onRemove={() =>
                  setSalary("all")
                }
              />
            )}


            {jobType !== "all" && (
              <FilterTag
                text={jobType}
                onRemove={() =>
                  setJobType("all")
                }
              />
            )}


            {experience !== "all" && (
              <FilterTag
                text={experience}
                onRemove={() =>
                  setExperience("all")
                }
              />
            )}


            {category !== "all" && (
              <FilterTag
                text={category}
                onRemove={() =>
                  setCategory("all")
                }
              />
            )}


            <button
              type="button"
              onClick={clearFilters}
              className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear All
            </button>

          </div>

        )}


        {/* =================================================
            RESULT COUNT
        ================================================= */}

        {!loading && !error && (

          <div className="mb-4 mt-6 flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredJobs.length}
              </span>{" "}
              jobs
            </p>

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-[405px] animate-pulse rounded-3xl border border-slate-200 bg-white"
                />
              )
            )}

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            Couldn't load jobs: {error}
          </div>

        )}


        {/* =================================================
            NO RESULTS
        ================================================= */}

        {!loading &&
          !error &&
          filteredJobs.length === 0 && (

            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">

                <BriefcaseBusiness className="h-8 w-8 text-blue-600" />

              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                No matching jobs
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Try changing your search or filters
                to find more opportunities.
              </p>

              <Button
                onClick={clearFilters}
                variant="outline"
                className="mt-5 rounded-xl"
              >
                Clear Filters
              </Button>

            </div>

          )}


        {/* =================================================
            JOB GRID
        ================================================= */}

        {!loading &&
          !error &&
          filteredJobs.length > 0 && (

            <div
              className="
                grid
                grid-cols-1
                gap-5
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >

              {filteredJobs.map((job) => (

                <JobCard
                  key={job.id}
                  job={job}
                />

              ))}

            </div>

          )}

      </div>

    </section>
  );
}


/* -------------------------------------------------------
   Filter Tag
------------------------------------------------------- */

function FilterTag({
  text,
  onRemove,
}: {
  text: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-blue-100
        bg-blue-50
        px-3
        py-1.5
        text-sm
        font-medium
        text-blue-700
      "
    >

      {text}

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full hover:bg-blue-100"
      >
        <X className="h-4 w-4" />
      </button>

    </span>
  );
}