"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Sparkles,
  Crown,
  RefreshCw,
  ChevronRight,
  Eye,
  Download,
  MoreVertical,
  CheckCircle2,
  BriefcaseBusiness,
  GraduationCap,
  Code2,
  ClipboardList,
  WandSparkles,
  ArrowRight,
  X,
  FileUp,
  Plus,
  LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

/* --------------------------------------------------
   TYPES
-------------------------------------------------- */

interface RawSuggestion {
  type?: string;
  title: string;
  description: string;
  impact?: string;
}

interface NormalizedSuggestion {
  title: string;
  description: string;
  impact: string;
  icon: LucideIcon;
  impactClass: string;
}

interface ScoreBreakdownItem {
  label: string;
  score: number;
}

interface UploadedMeta {
  name: string;
  uploadedAt: string;
  sizeKB: number;
}

interface GeneratedResume {
  id: string | number;
  name: string;
  role: string;
  date: string;
  score: number;
}

interface RawGeneratedResume {
  id: string | number;
  name?: string;
  file_name?: string;
  role?: string;
  target_role?: string;
  date?: string;
  created_at?: string;
  ats_score?: number;
  score?: number;
}

interface ApiFetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/* --------------------------------------------------
   API CONFIG
   NEXT_PUBLIC_API = http://127.0.0.1:8000 (no /api suffix)
   Adjust API_BASE below if your Django urls.py is NOT
   included under "/api/" in your root urlconf.
-------------------------------------------------- */

const API_ROOT = process.env.NEXT_PUBLIC_API || "";
const API_BASE = `${API_ROOT}/api`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  // Don't force Content-Type when sending FormData (browser sets boundary itself)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // token invalid/expired -> force re-login
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Request failed: ${res.status}`);
  }

  return res;
}

/* Map icons for suggestion "type"/"title" coming from backend, with a safe fallback */
const SUGGESTION_ICON_MAP: Record<string, LucideIcon> = {
  keywords: Sparkles,
  experience: BriefcaseBusiness,
  skills: Code2,
  formatting: ClipboardList,
};

const SUGGESTION_IMPACT_CLASS: Record<string, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-orange-50 text-orange-600",
  Low: "bg-green-50 text-green-600",
};

function normalizeSuggestion(item: RawSuggestion): NormalizedSuggestion {
  const impactKey = (item.impact || "Low").toString().split(" ")[0]; // "High Impact" -> "High"
  return {
    title: item.title,
    description: item.description,
    impact: item.impact?.includes("Impact") ? item.impact : `${item.impact} Impact`,
    icon: SUGGESTION_ICON_MAP[item.type ?? ""] || Sparkles,
    impactClass: SUGGESTION_IMPACT_CLASS[impactKey] || "bg-slate-50 text-slate-600",
  };
}

/* --------------------------------------------------
   SCORE CIRCLE
-------------------------------------------------- */

function ATSScore({ score = 0 }: { score?: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="currentColor"
          strokeWidth="9"
          fill="none"
          className="text-slate-100"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="currentColor"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-500"
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-4xl font-bold text-slate-900">
          {score}
          <span className="text-2xl">%</span>
        </div>
        <p className="text-xs font-medium text-slate-500">ATS Score</p>
        <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
          {score >= 80 ? "Good Match" : score >= 50 ? "Average Match" : "Needs Work"}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------
   RESUME COMPONENT
-------------------------------------------------- */

export default function Resume() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [authChecked, setAuthChecked] = useState<boolean>(false);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [showBuilder, setShowBuilder] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);

  const [atsScore, setAtsScore] = useState<number>(0);
  const [scoreData, setScoreData] = useState<ScoreBreakdownItem[]>([]);
  const [suggestions, setSuggestions] = useState<NormalizedSuggestion[]>([]);
  const [uploadedMeta, setUploadedMeta] = useState<UploadedMeta | null>(null);

  // Stores the ID of the analyzed resume record returned by the backend.
  // This is what /resume/generate/ actually needs (resume_id), not the raw file again.
  const [resumeId, setResumeId] = useState<string | number | null>(null);

  const [generatedResumes, setGeneratedResumes] = useState<GeneratedResume[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  const [targetRole, setTargetRole] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  /* ---------------- LOAD GENERATED RESUMES ---------------- */
  const loadGeneratedResumes = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await apiFetch("/resume/generated/", { method: "GET" });
      const data = await res.json();
      const list: RawGeneratedResume[] = Array.isArray(data) ? data : data.results || [];

      setGeneratedResumes(
        list.map((r): GeneratedResume => ({
          id: r.id,
          name: r.name || r.file_name || `Resume_${r.id}.pdf`,
          role: r.role || r.target_role || "-",
          date:
            r.date ||
            (r.created_at
              ? new Date(r.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-"),
          score: r.ats_score ?? r.score ?? 0,
        }))
      );
    } catch (err) {
      console.error("Failed to load generated resumes:", err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      loadGeneratedResumes();
    }
  }, [authChecked, loadGeneratedResumes]);

  /* ---------------- UPLOAD + ANALYZE ---------------- */
  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload PDF or DOC/DOCX file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Maximum file size is 5MB.");
      return;
    }

    setUploading(true);
    setResumeFile(file);

    try {
      const formData = new FormData();
      // IMPORTANT: field name must match whatever your Django view
      // reads via request.FILES.get(...). If you get
      // "Resume file is required.", make sure this matches your view exactly
      // ("resume" vs "file").
      formData.append("file", file);

      const res = await apiFetch("/resume/analyze/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setAtsScore(data.ats_score ?? 0);

      setScoreData(
        Object.entries(data.score_breakdown || {}).map(([label, score]) => ({
          label,
          score: Number(score),
        }))
      );

      setSuggestions((data.suggestions || []).map((s: RawSuggestion) => normalizeSuggestion(s)));

      // Capture the resume record ID from the analyze response.
      // Check your Django serializer/response to confirm the exact key
      // (commonly "id" or "resume_id").
      setResumeId(data.id ?? data.resume_id ?? null);

      setUploadedMeta({
        name: data.file_name || file.name,
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        sizeKB: Math.round(file.size / 1024),
      });
    } catch (err) {
      console.error("Analyze failed:", err);
      alert("Could not analyze resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (): void => {
    setResumeFile(null);
    setUploadedMeta(null);
    setAtsScore(0);
    setScoreData([]);
    setSuggestions([]);
    setResumeId(null); // reset so a stale ID can't be sent to /generate/

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ---------------- GENERATE RESUME ---------------- */
  const handleGenerateResume = async (): Promise<void> => {
    if (!targetRole || !jobDescription) {
      alert("Please fill target role and job description.");
      return;
    }

    // /resume/generate/ needs a resume_id (an already analyzed resume),
    // not a fresh file. If the user hasn't analyzed a resume yet, stop here
    // instead of sending an incomplete request that the backend will reject.
    if (!resumeId) {
      alert("Please upload and analyze a resume first.");
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append("target_role", targetRole);
      formData.append("job_description", jobDescription);
      // send the resume_id instead of re-uploading the file.
      formData.append("resume_id", String(resumeId));

      await apiFetch("/resume/generate/", {
        method: "POST",
        body: formData,
      });

      setShowBuilder(false);
      setTargetRole("");
      setJobDescription("");

      // refresh the list so the newly generated resume shows up
      await loadGeneratedResumes();
    } catch (err) {
      console.error("Generate failed:", err);
      alert("Could not generate resume. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  /* ---------------- VIEW / DOWNLOAD ---------------- */
  const handleView = async (id: string | number): Promise<void> => {
    try {
      const res = await apiFetch(`/resume/generated/${id}/`, { method: "GET" });
      const data = await res.json();
      if (data.file_url) {
        window.open(data.file_url, "_blank");
      }
    } catch (err) {
      console.error("View failed:", err);
    }
  };

  const handleDownload = async (id: string | number, name?: string): Promise<void> => {
    try {
      const res = await apiFetch(`/resume/generated/${id}/download/`, {
        method: "GET",
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name || `resume_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Could not download resume.");
    }
  };

  if (!authChecked) {
    return null; // or a spinner, kept minimal to not touch UI/CSS
  }

  return (
    <div className="min-h-screen  px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Resume
            </h1>

            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Optimize your resume for ATS and create professional
              resumes that get you hired.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Upgrade */}
            <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-white shadow-sm">
              <CardContent className="flex items-center gap-3 p-3 sm:min-w-[260px]">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <Crown className="h-5 w-5 text-purple-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Upgrade Your Resume
                  </p>

                  <p className="text-xs text-slate-500">
                    Get AI-powered suggestions
                  </p>
                </div>

                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Upgrade
                </Button>

              </CardContent>
            </Card>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleUploadClick}
              className="flex min-h-[76px] min-w-[240px] items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-white px-4 text-left transition hover:border-blue-400 hover:bg-blue-50/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                {uploading ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <Upload className="h-5 w-5 text-blue-600" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Upload New Resume
                </p>

                <p className="text-xs text-slate-500">
                  PDF, DOCX (Max 5MB)
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Uploaded file */}
        {resumeFile && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <FileUp className="h-5 w-5 text-blue-600" />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {resumeFile.name}
                </p>

                <p className="text-xs text-slate-500">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ==================================================
            ATS + SUGGESTIONS
        ================================================== */}

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">

          {/* ATS CHECKER */}

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                ATS Checker
              </CardTitle>
            </CardHeader>

            <CardContent>

              {/* Resume File */}
              <div className="mb-6 flex items-center justify-between rounded-xl border bg-slate-50 p-3">

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {uploadedMeta?.name || resumeFile?.name || "No resume uploaded yet"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {uploadedMeta
                        ? `Uploaded on ${uploadedMeta.uploadedAt} • ${uploadedMeta.sizeKB} KB`
                        : "Upload a resume to see your ATS score"}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  className="ml-2 shrink-0"
                >
                  Re-upload
                </Button>
              </div>

              {/* Score */}
              <div className="grid items-center gap-8 md:grid-cols-[180px_1fr]">

                <div className="flex justify-center">
                  <ATSScore score={atsScore} />
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-semibold text-slate-800">
                    Score Breakdown
                  </h3>

                  <div className="space-y-4">
                    {scoreData.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Upload a resume to see the breakdown.
                      </p>
                    )}

                    {scoreData.map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-slate-500">
                            {item.label}
                          </span>

                          <span className="font-semibold text-slate-700">
                            {item.score}%
                          </span>
                        </div>

                        <Progress
                          value={item.score}
                          className="h-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Success message */}
              {scoreData.length > 0 && (
                <div className="mt-6 flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">

                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                  <p className="text-xs leading-5 text-emerald-700">
                    Good job! Your resume has a good ATS score.
                    Follow the suggestions below to improve it further.
                  </p>

                </div>
              )}
            </CardContent>
          </Card>

          {/* ==================================================
              IMPROVEMENTS
          ================================================== */}

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Improve Your Score
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">

              <div className="divide-y rounded-xl border">

                {suggestions.length === 0 && (
                  <p className="p-4 text-xs text-slate-400">
                    No suggestions yet. Upload a resume to get AI feedback.
                  </p>
                )}

                {suggestions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.title}
                      className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
                    >

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <Icon className="h-5 w-5 text-emerald-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`hidden shrink-0 sm:inline-flex ${item.impactClass}`}
                      >
                        {item.impact}
                      </Badge>

                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />

                    </button>
                  );
                })}

              </div>

              <Button
                variant="outline"
                className="mt-4 w-full"
              >
                View Detailed Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* ==================================================
            AI RESUME BUILDER + PREVIEW
        ================================================== */}

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* BUILDER */}

          <Card className="border-slate-200 shadow-sm">

            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <CardTitle className="text-lg">
                    AI Resume Builder
                  </CardTitle>

                  <p className="mt-1 text-xs text-slate-500">
                    Create a professional resume tailored to your target job with AI
                  </p>
                </div>

                <Button
                  onClick={() => setShowBuilder(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create New Resume
                </Button>

              </div>
            </CardHeader>

            <CardContent>

              {/* Steps */}

              <div className="mb-7 grid gap-5 md:grid-cols-3">

                <BuilderStep
                  number="1"
                  icon={Upload}
                  title="Upload Resume"
                  description="Upload your current resume in PDF or DOCX format"
                />

                <BuilderStep
                  number="2"
                  icon={ClipboardList}
                  title="Add Job Description"
                  description="Paste the job description to customize your resume"
                />

                <BuilderStep
                  number="3"
                  icon={WandSparkles}
                  title="Generate Resume"
                  description="AI will optimize your resume for the specific role"
                />

              </div>

              {/* Generated resumes */}

              <div className="overflow-hidden rounded-xl border">

                <div className="border-b bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Generated Resumes
                  </h3>
                </div>

                {/* Desktop Header */}
                <div className="hidden grid-cols-[2fr_1.5fr_1fr_0.8fr_100px] gap-3 border-b px-4 py-3 text-xs font-semibold text-slate-500 md:grid">
                  <span>Resume Name</span>
                  <span>Target Role</span>
                  <span>Created On</span>
                  <span>ATS Score</span>
                  <span>Actions</span>
                </div>

                {loadingList && (
                  <p className="p-4 text-xs text-slate-400">Loading...</p>
                )}

                {!loadingList && generatedResumes.length === 0 && (
                  <p className="p-4 text-xs text-slate-400">
                    No resumes generated yet.
                  </p>
                )}

                {generatedResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="grid gap-3 border-b px-4 py-4 md:grid-cols-[2fr_1.5fr_1fr_0.8fr_100px] md:items-center"
                  >

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <FileText className="h-4 w-4 text-red-500" />
                      </div>

                      <span className="truncate text-sm font-medium text-slate-700">
                        {resume.name}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500">
                      {resume.role}
                    </span>

                    <span className="text-xs text-slate-500">
                      {resume.date}
                    </span>

                    <div>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-4 border-emerald-100 text-xs font-bold text-emerald-600">
                        {resume.score}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(resume.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(resume.id, resume.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                    </div>

                  </div>
                ))}

                <button className="flex w-full items-center justify-center gap-2 py-4 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                  View All Generated Resumes
                  <ArrowRight className="h-4 w-4" />
                </button>

              </div>
            </CardContent>
          </Card>

          {/* ==================================================
              RESUME PREVIEW
          ================================================== */}

          <Card className="border-slate-200 shadow-sm">

            <CardHeader>
              <CardTitle className="text-lg">
                Resume Preview
              </CardTitle>
            </CardHeader>

            <CardContent>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

                <div className="p-4 text-center">

                  <h2 className="text-sm font-bold text-slate-900">
                    RAHUL KUMAR
                  </h2>

                  <p className="mt-1 text-[8px] text-blue-600">
                    Software Engineer
                  </p>

                  <p className="mt-1 text-[7px] text-slate-400">
                    rahul@example.com | +91 98765 43210
                  </p>

                </div>

                <div className="space-y-4 px-5 pb-6">

                  <PreviewSection
                    title="SUMMARY"
                    text="Software Engineer with experience building scalable web applications using modern technologies."
                  />

                  <PreviewSection
                    title="EXPERIENCE"
                    text="Software Engineer • ABC Company • 2022 - Present"
                  />

                  <PreviewSection
                    title="SKILLS"
                    text="JavaScript • React • Node.js • Python • Django • SQL"
                  />

                  <PreviewSection
                    title="EDUCATION"
                    text="B.Tech in Computer Science • 2021"
                  />

                </div>
              </div>

              <Button
                variant="outline"
                className="mt-4 w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </Button>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* ==================================================
          CREATE RESUME MODAL
      ================================================== */}

      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

          <Card className="w-full max-w-2xl">

            <CardHeader>
              <div className="flex items-center justify-between">

                <div>
                  <CardTitle>
                    Create AI Resume
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    Generate a resume specifically for your target job.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBuilder(false)}
                >
                  <X className="h-5 w-5" />
                </Button>

              </div>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* Warn the user inline if they haven't analyzed a resume yet,
                  since /resume/generate/ requires resumeId */}
              {!resumeId && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  You haven't analyzed a resume yet. Please upload and analyze
                  a resume first (top-right "Upload New Resume") before generating.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Target Job Role
                </label>

                <Input
                  placeholder="e.g. Full Stack Developer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Job Description
                </label>

                <textarea
                  rows={7}
                  placeholder="Paste the job description here..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-indigo-50 p-4">
                <div className="flex gap-3">

                  <Sparkles className="h-5 w-5 text-indigo-600" />

                  <div>
                    <p className="text-sm font-semibold text-indigo-900">
                      AI Optimization
                    </p>

                    <p className="mt-1 text-xs text-indigo-700">
                      AI will analyze your resume and job description
                      and optimize keywords, skills and experience.
                    </p>
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-3">

                <Button
                  variant="outline"
                  onClick={() => setShowBuilder(false)}
                  disabled={generating}
                >
                  Cancel
                </Button>

                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleGenerateResume}
                  disabled={generating || !resumeId}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generating ? "Generating..." : "Generate Resume"}
                </Button>

              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------
   BUILDER STEP
-------------------------------------------------- */

interface BuilderStepProps {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

function BuilderStep({
  number,
  icon: Icon,
  title,
  description,
}: BuilderStepProps) {
  return (
    <div className="flex gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800">
          {number}. {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

    </div>
  );
}

/* --------------------------------------------------
   PREVIEW SECTION
-------------------------------------------------- */

interface PreviewSectionProps {
  title: string;
  text: string;
}

function PreviewSection({ title, text }: PreviewSectionProps) {
  return (
    <div>
      <h4 className="mb-1 border-b pb-1 text-[8px] font-bold text-slate-700">
        {title}
      </h4>

      <p className="text-[7px] leading-3 text-slate-500">
        {text}
      </p>
    </div>
  );
}