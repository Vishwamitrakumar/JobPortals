"use client";

import { useState, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const API_BASE = "http://127.0.0.1:8000";
const INTERVIEW_URL = `${API_BASE}/api/apply/`;

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-black",
  "bg-green-500",
  "bg-purple-600",
  "bg-rose-500",
  "bg-orange-500",
];

function getColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function formatInterviewDate(date: string) {
  if (!date) return "-";

  const d = new Date(`${date}T00:00:00`);

  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatInterviewTime(time: string) {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");

  const d = new Date();
  d.setHours(Number(hours), Number(minutes), 0, 0);

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UpcomingInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 5;

  const fetchInterviews = async (page: number) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access");

      if (!token) {
        setError("Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${INTERVIEW_URL}?page=${page}&page_size=${PAGE_SIZE}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      console.log("My Applications API:", data);

      /*
        DRF pagination normally returns:

        {
          count: 10,
          next: "...",
          previous: null,
          results: [...]
        }
      */

      let results = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      /*
        Only show applications whose status is Interview
      */
      results = results.filter(
        (item: any) =>
          String(item.status || "").toLowerCase() === "interview"
      );

      setInterviews(results);

      setTotalCount(
        typeof data.count === "number"
          ? data.count
          : results.length
      );
    } catch (err) {
      console.error("Interview API Error:", err);

      setError("Unable to load upcoming interviews.");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(currentPage);
  }, [currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / PAGE_SIZE)
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((page) => page - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((page) => page + 1);
    }
  };

  /*
    Empty state
  */
  if (!loading && interviews.length === 0 && !error) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Upcoming Interviews
          </h2>
        </CardHeader>

        <CardContent>
          <div className="py-8 text-center text-sm text-slate-500">
            No upcoming interviews found.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <h2 className="text-lg font-semibold">
          Upcoming Interviews
        </h2>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-8 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Interviews */}
        {!loading &&
          !error &&
          interviews.map((item, index) => {

            /*
              Job information can come in different shapes
              depending on your serializer.
            */

            const company =
              item.company_name ||
              item.job?.company_name ||
              item.job_details?.company_name ||
              "Company";

            const role =
              item.job_title ||
              item.job?.job_title ||
              item.job_details?.job_title ||
              item.current_role ||
              "Job Position";

            const logo =
              company.charAt(0).toUpperCase();

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-b pb-4 last:border-none sm:flex-row sm:items-center sm:justify-between"
              >

                {/* Left side */}
                <div className="flex gap-4">

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${getColor(
                      index
                    )} text-xl font-bold text-white`}
                  >
                    {logo}
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {company}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {role}
                    </p>
                  </div>

                </div>

                {/* Right side */}
                <div className="text-left sm:text-right">

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4" />

                    {formatInterviewDate(
                      item.interview_date
                    )}
                  </div>

                  <p className="mt-1 text-sm">
                    {formatInterviewTime(
                      item.interview_time
                    )}
                  </p>

                </div>

              </div>
            );
          })}

        {/* Pagination */}
        {!loading &&
          !error &&
          interviews.length > 0 && (
            <div className="flex items-center justify-between pt-2">

              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>
          )}

      </CardContent>
    </Card>
  );
}