"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock3,
  IndianRupee,
  CalendarDays,
  UploadCloud,
  Globe,
  Lightbulb,
  ShieldCheck,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// All job/page data lives in one object — swap this out to reuse the form
// for any other listing without touching the JSX below.
// ---------------------------------------------------------------------------
const JOB_DATA = {
  title: "React Developer",
  subtitle: "Fill in your details and submit your application",
  company: {
    name: "Meta",
    location: "Hyderabad, India",
    // Generated placeholder avatar (no external branding/IP)
    logo: "https://api.dicebear.com/9.x/initials/svg?seed=Meta&backgroundColor=2563eb&textColor=ffffff&fontWeight=700",
  },
  summary: [
    { icon: Briefcase, label: "Job Type", value: "Full-time" },
    { icon: Clock3, label: "Experience", value: "2-4 Years" },
    { icon: IndianRupee, label: "Salary", value: "₹8 - ₹15 LPA" },
    { icon: CalendarDays, label: "Posted On", value: "2 days ago" },
  ],
  whyJoin: [
    "Work with cutting-edge technologies",
    "Collaborative and inclusive environment",
    "Great learning and growth opportunities",
    "Competitive salary and benefits",
  ],
  tips: [
    "Tailor your resume to the job description",
    "Highlight relevant skills and experience",
    "Include links to your portfolio or projects",
    "Write a concise and impactful cover letter",
  ],
  experienceOptions: ["0-1 Years", "1-2 Years", "2-4 Years", "4-6 Years", "6+ Years"],
  noticePeriodOptions: ["Immediate", "15 Days", "30 Days", "60 Days", "90 Days"],
};

const MAX_COVER_LETTER_LENGTH = 1000;

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
type LabelProps = {
  required?: boolean;
  children: ReactNode;
};

function Label({ required = false, children }: LabelProps) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

type InputProps = {
  icon?: LucideIcon;
  className?: string;
} & React.ComponentPropsWithoutRef<"input">;

function Input({ icon: Icon, className = "", ...props }: InputProps) {
  return (
    <div className="relative">
      <input
        {...props}
        className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          Icon ? "pl-9" : ""
        } ${className}`}
      />
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
    </div>
  );
}

type SelectProps = {
  options: string[];
  placeholder: string;
  className?: string;
} & React.ComponentPropsWithoutRef<"select">;

function Select({ options, placeholder, className = "", value = "", ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        value={value}
        className={`w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
      >
        <option value="" disabled className="text-slate-400">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Jobform() {
  const [agreed, setAgreed] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resume, setResume] = useState<File | null>(null);

  const params = useParams();
  const id = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [job, setJob] = useState<Job | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    current_location: "",
    linkedin: "",
    portfolio: "",
    total_experience: "",
    current_role: "",
    current_company: "",
    cover_letter: "",
    notice_period: "",
    expected_salary: "",
  });

  const summaryItems = job
    ? [
        { icon: Briefcase, label: "Job Type", value: job.job_type },
        { icon: Clock3, label: "Experience", value: job.experience_level },
        { icon: IndianRupee, label: "Salary", value: job.salary_range },
        {
          icon: CalendarDays,
          label: "Posted On",
          value: new Date(job.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        },
      ]
    : [];

    const API = process.env.NEXT_PUBLIC_API;

  useEffect(() => {
    async function getJob() {
      if (!id) {
        setLoading(false);
        setError("Job id is missing.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/api/jobs/${id}/`);

        if (!res.ok) {
          throw new Error(`Failed to fetch job: ${res.status}`);
        }

        const data = await res.json();
        setJob(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load job details.");
      } finally {
        setLoading(false);
      }
    }

    getJob();
  }, [id]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading job details...</div>;
  }

  if (error || !job) {
    return <div className="text-sm text-red-500">{error || "Job data not available."}</div>;
  }



  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!agreed || !job) return;

    const data = new FormData();

    data.append("job", String(job.id));
    data.append("full_name", formData.full_name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("current_location", formData.current_location);
    data.append("linkedin", formData.linkedin);
    data.append("portfolio", formData.portfolio);
    data.append("total_experience", formData.total_experience);
    data.append("current_role", formData.current_role);
    data.append("current_company", formData.current_company);
    data.append("cover_letter", formData.cover_letter);
    data.append("notice_period", formData.notice_period);
    data.append("expected_salary", formData.expected_salary);

    if (resume) {
      data.append("resume", resume);
    }

    try {
      const response = await fetch(`${API}/api/apply/`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Application Submitted Successfully");
        console.log(result);
        router.push("/main/dashboard");
      } else {
        console.log(result);
        alert("Something went wrong");
      }
    } catch (error) {
      console.log(error);
      alert("Network error while submitting application.");
    }
  };

  
  
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Back link */}
        <a   
          onClick={() => router.push("/main/dashboard")}
          href="#"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </a>

        {/* Page heading */}
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Apply for {job.job_title || JOB_DATA.title}
        </h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">{JOB_DATA.subtitle}</p>

        {/* Two column responsive layout */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* LEFT — form (spans 2 of 3 columns on large screens) */}
          <div className="space-y-6 lg:col-span-2">
            <SectionCard title="Personal Information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label required>Full Name</Label>
                <Input
                  placeholder="Enter your full name"
                  required
                  value={formData.full_name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
                </div>
                <div>
                  <Label required>Email Address</Label>
                 <Input
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={formData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                </div>

                <div>
                  <Label required>Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex w-20 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm">
                      🇮🇳 +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      required
                      className="flex-1"
                      value={formData.phone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label required>Current Location</Label>
                  <Input
                    icon={MapPin}
                    placeholder="Enter your city"
                    required
                    value={formData.current_location}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, current_location: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>LinkedIn Profile</Label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={formData.linkedin}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, linkedin: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Portfolio / Website</Label>
                  <Input
                    icon={Globe}
                    type="url"
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolio}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, portfolio: e.target.value })
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Work Experience">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label required>Total Experience</Label>
                  <Select
                    placeholder="Select experience"
                    options={JOB_DATA.experienceOptions}
                    required
                    value={formData.total_experience}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, total_experience: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Current Role</Label>
                  <Input
                    placeholder="Enter your current role"
                    value={formData.current_role}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, current_role: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Current Company</Label>
                  <Input
                    placeholder="Enter your current company"
                    value={formData.current_company}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, current_company: e.target.value })
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Resume & Cover Letter">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label required>Upload Resume</Label>
                  <label className="flex h-[124px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-center transition hover:bg-slate-100">
                    <UploadCloud className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {fileName || "Click to upload or drag and drop"}
                    </span>
                    <span className="text-xs text-slate-400">
                      PDF, DOC, DOCX (Max. 5MB)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      required
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const selectedFile = e.target.files?.[0] ?? null;
                        setResume(selectedFile);
                        setFileName(selectedFile?.name ?? "");
                      }}
                    />
                  </label>
                </div>
                <div>
                  <Label>Cover Letter (Optional)</Label>
                  <textarea
                    value={formData.cover_letter}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                      if (e.target.value.length <= MAX_COVER_LETTER_LENGTH) {
                        setFormData({ ...formData, cover_letter: e.target.value });
                      }
                    }}
                    placeholder="Write a short cover letter..."
                    rows={4}
                    className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-1 text-right text-xs text-slate-400">
                    {formData.cover_letter.length} / {MAX_COVER_LETTER_LENGTH}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Additional Information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label required>Notice Period</Label>
                  <Select
                    placeholder="Select notice period"
                    options={JOB_DATA.noticePeriodOptions}
                    required
                    value={formData.notice_period}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, notice_period: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label required>Expected Salary (Annual)</Label>
                  <Input
                    icon={IndianRupee}
                    type="number"
                    placeholder="Enter expected salary"
                    required
                    value={formData.expected_salary}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, expected_salary: e.target.value })
                    }
                  />
                </div>
              </div>
            </SectionCard>

            {/* Terms + actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                />
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </label>

              <div className="flex gap-3 sm:justify-end">
                <button
                  type="button"
                   onClick={() => router.push("/main/dashboard")}
                  className="rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!agreed}
                  className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — job summary (sticky on large screens) */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <SectionCard title="Job Summary">
              <div className="mb-4 flex items-center gap-3">
                <img
                  src={job.logo || JOB_DATA.company.logo}
                  alt={`${job.company_name} logo`}
                  className="h-11 w-11 rounded-lg object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {job.job_title}
                  </div>
                  <div className="text-xs text-slate-500">{job.company_name}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                {summaryItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <span className="font-medium text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Why join us?">
              <ul className="space-y-2.5">
                {JOB_DATA.whyJoin.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-green-500">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-800">
                <Lightbulb className="h-4 w-4" />
                Tips for a strong application
              </div>
              <ol className="list-decimal space-y-1.5 pl-4 text-sm text-blue-800/90">
                {JOB_DATA.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                <ShieldCheck className="h-4 w-4" />
                Your data is secure
              </div>
              <p className="mt-1 text-xs text-green-700/90">
                Your information is safe with us and will only be used for this
                application.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}