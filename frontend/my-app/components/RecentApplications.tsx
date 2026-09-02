"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API || "";
const LIST_URL = `${API_BASE}/api/my-applications/`;

function badge(status: string) {
  switch (status) {
    case "Interview":
      return "bg-purple-100 text-purple-600";
    case "Shortlisted":
      return "bg-green-100 text-green-600";
    case "Rejected":
      return "bg-red-100 text-red-600";
    case "Pending":
      return "bg-yellow-100 text-yellow-600";
    default:
      return "bg-blue-100 text-blue-600";
  }
}

function companyLogo(name: string) {
  const colors = ["🟢", "🟦", "🟠", "🔵", "🟣", "🟡", "🔴"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

interface Job {
  id: number;
  company: string;
  role: string;
  status: string;
  date: string;
}

export default function RecentApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      if (!token) {
        throw new Error("You're not logged in. Please log in to view your applications.");
      }

      const res = await fetch(LIST_URL, {
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

      const data = await res.json();
      // backend returns { success: true, applications: [...] }
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong while loading applications.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchApplications(controller.signal);
    return () => controller.abort();
  }, [fetchApplications]);

  // Normalize backend records into the shape the UI expects.
  // Adjust the field names below (job.company_name, job.title, etc.)
  // to match your actual API response structure.
  const jobs: Job[] = applications.map((app) => {
    const job = app.job || {};
    return {
      id: app.id,
      company: job.company_name || job.company || app.company_name || "Unknown Company",
      role: job.title || job.job_title || app.job_title || "Unknown Role",
      status: app.status || "Applied",
      date: formatDate(app.created_at || app.applied_on),
    };
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row justify-between">
        <CardTitle>Recent Applications</CardTitle>
        <button className="text-sm text-blue-600">View All</button>
      </CardHeader>

      <CardContent>
        {loading && (
          <p className="py-6 text-center text-sm text-slate-500">
            Loading applications...
          </p>
        )}

        {!loading && error && (
          <p className="py-6 text-center text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            No applications yet.
          </p>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <div className="space-y-3 md:hidden">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{companyLogo(job.company)}</span>
                      <div>
                        <p className="font-semibold">{job.company}</p>
                        <p className="text-sm text-slate-500">{job.role}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge className={badge(job.status)}>{job.status}</Badge>
                    <span className="text-sm text-slate-500">{job.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="py-3">Company</th>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="flex items-center gap-3 py-4">
                        <span className="text-2xl">{companyLogo(job.company)}</span>
                        {job.company}
                      </td>
                      <td>{job.role}</td>
                      <td>
                        <Badge className={badge(job.status)}>{job.status}</Badge>
                      </td>
                      <td>{job.date}</td>
                      <td>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}