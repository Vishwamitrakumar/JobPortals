"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Eye,
  MoreVertical,
  Search,
  RefreshCcw,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import axios from "axios";
// ---------------------------------------------------------------------------
// API config — change API_BASE if your Django server runs somewhere else.
// ---------------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API;
const LIST_URL = `${API_BASE}/api/admin/applications/`;
const EXPORT_URL = `${API_BASE}/api/applications/export-excel/`;

// Status pill colors
const statusStyles = {
  Pending: "bg-amber-50 text-amber-600",
  Reviewed: "bg-blue-50 text-blue-600",
  Shortlisted: "bg-green-50 text-green-600",
  Selected: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-600",
};
const statusOptions = ["Pending", "Reviewed", "Shortlisted", "interview", "Selected", "Rejected"];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",
  "bg-teal-100 text-teal-600",
  "bg-indigo-100 text-indigo-600",
  "bg-pink-100 text-pink-600",
  "bg-cyan-100 text-cyan-600",
  "bg-orange-100 text-orange-600",
];

function colorForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(iso) {
  if (!iso) return { date: "-", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: iso, time: "" };
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

export default function JobApplicants() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openId, setOpenId] = useState(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // debounced value actually sent to API

  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const [exporting, setExporting] = useState(false);

  const debounceRef = useRef(null);

  // FIX: localStorage is a browser-only API. Reading it directly in the
  // component body (`const token = localStorage.getItem("access")`) runs
  // during Next.js server-side prerendering too, where `localStorage`
  // doesn't exist — that's exactly what caused:
  //   "ReferenceError: localStorage is not defined"
  // during `next build`. The fix: keep the token in state and only read
  // localStorage inside useEffect, which only ever runs in the browser.
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("access"));
  }, []);

  // Debounce the search box -> searchQuery (waits 400ms after typing stops)
  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  // Fetch a page of applicants from the Django API
  const fetchApplicants = useCallback(async (page, search) => {
    // Guard: don't fire the request until we've actually read the token
    // from localStorage on the client.
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);

      const res = await fetch(
        `${LIST_URL}?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();

      const results = Array.isArray(data.results) ? data.results : [];
      setRecords(
        results.map((r) => ({
          ...r,
          name: r.full_name || "Unnamed",
          notes: r.notes || "",
          initials: (r.full_name || "?").charAt(0).toUpperCase(),
          color: colorForName(r.full_name || ""),
        }))
      );
      setCount(typeof data.count === "number" ? data.count : results.length);
      // DRF keeps page size constant across pages — infer it from page 1
      if (page === 1 && results.length > 0) setPageSize(results.length);
    } catch (err) {
      console.error(err);
      setError(
        "Couldn't load applicants. Make sure the Django server is running at " + API_BASE + "."
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchApplicants(currentPage, searchQuery);
  }, [currentPage, searchQuery, token, fetchApplicants]);

  const totalPages = Math.max(1, Math.ceil(count / (pageSize || 5)));

  const handleReset = () => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
    setOpenId(null);
  };

  const openPanel = (record) => {
    if (openId === record.id) {
      setOpenId(null);
      return;
    }

    setOpenId(record.id);
    setDraftStatus(record.status);
    setDraftNotes(record.notes || "");

    setInterviewDate(record.interview_date || "");
    setInterviewTime(record.interview_time || "");
  };

  // Update status/notes. Tries a PATCH to the API; falls back to a local-only
  // update if your backend doesn't expose an update endpoint yet.
  const handleUpdate = async () => {
    setSavingStatus(true);

    try {
      const response = await axios.patch(
        `${LIST_URL}${openId}/`,
        {
          status: draftStatus,
          notes: draftNotes,
          interview_date:
            draftStatus.toLowerCase() === "interview"
              ? interviewDate
              : null,

          interview_time:
            draftStatus.toLowerCase() === "interview"
              ? interviewTime
              : null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);

      // Latest data reload
      await fetchApplicants(currentPage, searchQuery);

      setOpenId(null);
    } catch (error) {
      console.error("Status Update Error:", error.response?.data || error.message);
      alert(
        error.response?.data?.message ||
        "Status update failed."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  // Downloads the Excel export from the Django endpoint (keeps current search filter)
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const url = params.toString() ? `${EXPORT_URL}?${params.toString()}` : EXPORT_URL;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);
      const blob = await res.blob();

      const a = document.createElement("a");
      const objectUrl = window.URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = "applications.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error(err);
      alert("Couldn't export the Excel file. Check that the export API is reachable.");
    } finally {
      setExporting(false);
    }
  };

  const activeRecord = records.find((r) => r.id === openId);

  const getPageNumbers = () => {
    const pages = [];
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push("ellipsis-start");
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push("ellipsis-end");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-xl border border-gray-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email or role..."
            className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <Button type="button" variant="outline" className="h-9 gap-2 text-gray-600" onClick={handleReset}>
          <RefreshCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button
          type="button"
          className="h-9 gap-2 bg-gray-900 text-white hover:bg-gray-800"
          onClick={handleExportExcel}
          disabled={exporting}
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {exporting ? "Exporting..." : "Export Excel"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-left">
              <th className="px-4 py-3 font-medium">Applicant</th>
              <th className="px-4 py-3 font-medium">Role / Experience</th>
              <th className="px-4 py-3 font-medium">Applied On</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading applicants...
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No applicants match "{searchQuery}".
                </td>
              </tr>
            )}
            {!loading &&
              records.map((record) => {
                const applied = formatDate(record.created_at);
                return (
                  <tr key={record.id} className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-medium ${record.color}`}>
                          {record.initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.name}</p>
                          <p className="text-gray-500 text-xs">{record.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{record.current_role || "-"}</p>
                      <p className="text-gray-500 text-xs">
                        {record.total_experience || "-"}
                        {record.current_company ? ` · ${record.current_company}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{applied.date}</p>
                      <p className="text-xs text-gray-400">{applied.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[record.status] || "bg-gray-50 text-gray-600"}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={record.resume || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 ${!record.resume ? "opacity-30 pointer-events-none" : ""}`}
                          title="View resume"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={record.resume || "#"}
                          download
                          className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 ${!record.resume ? "opacity-30 pointer-events-none" : ""}`}
                          title="Download resume"
                        >
                          <Download className="h-4 w-4" />
                        </a>

                        <Popover
                          open={openId === record.id}
                          onOpenChange={(isOpen) => {
                            if (!isOpen) setOpenId(null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                              onClick={() => openPanel(record)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>

                          <PopoverContent align="end" className="w-80 p-4">
                            {activeRecord && activeRecord.id === record.id && (
                              <div className="space-y-4">
                                <div>
                                  <p className="font-medium text-gray-900">Update Applicant Status</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${activeRecord.color}`}>
                                      {activeRecord.initials}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{activeRecord.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {activeRecord.current_role || "-"} {activeRecord.current_company ? `· ${activeRecord.current_company}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Applied on {formatDate(activeRecord.created_at).date}
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-500">Select status</label>
                                  <Select value={draftStatus} onValueChange={setDraftStatus}>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>

                                  </Select>

                                  {/* Interview Date & Time */}
                                  {draftStatus.toLowerCase() === "interview" && (
                                    <div className="grid grid-cols-2 gap-3">

                                      {/* Interview Date */}
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500">
                                          Interview Date
                                        </label>

                                        <input
                                          type="date"
                                          value={interviewDate}
                                          onChange={(e) => setInterviewDate(e.target.value)}
                                          min={new Date().toISOString().split("T")[0]}
                                          className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                                        />
                                      </div>

                                      {/* Interview Time */}
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500">
                                          Interview Time
                                        </label>

                                        <input
                                          type="time"
                                          value={interviewTime}
                                          onChange={(e) => setInterviewTime(e.target.value)}
                                          className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                                        />
                                      </div>

                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-500">Notes (optional)</label>
                                  <Textarea
                                    value={draftNotes}
                                    onChange={(e) => setDraftNotes(e.target.value)}
                                    placeholder="Add notes about this applicant..."
                                    maxLength={300}
                                    className="min-h-[70px] text-sm"
                                  />
                                  <p className="text-[11px] text-gray-400 text-right">{draftNotes.length}/300</p>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenId(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleUpdate}
                                    disabled={savingStatus}
                                  >
                                    {savingStatus ? "Saving..." : "Update Status"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Footer: result count + pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p className="text-xs text-gray-500">
          {count === 0
            ? "No results"
            : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, count)} of ${count} results`}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((page, idx) =>
            typeof page === "number" ? (
              <button
                key={page}
                type="button"
                className={`h-8 w-8 rounded-md text-xs border ${page === currentPage ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                onClick={() => setCurrentPage(page)}
                disabled={loading}
              >
                {page}
              </button>
            ) : (
              <span key={page + idx} className="px-1 text-gray-400 text-xs">
                ...
              </span>
            )
          )}

          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}