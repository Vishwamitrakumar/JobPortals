"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  MapPin,
  IndianRupee,
  CalendarDays,
  UploadCloud,
} from "lucide-react";
import { Toaster, toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const JOB_CATEGORIES = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
];

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Lead / Manager",
];

const DESCRIPTION_LIMIT = 3000;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function JobPost() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [description, setDescription] = useState("");
  const [keySkills, setKeySkills] = useState("");
  const [minQualification, setMinQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [deadline, setDeadline] = useState("");
  const [openings, setOpenings] = useState("");
  const [benefits, setBenefits] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const router = useRouter();
  const showJobToast = (type: "success" | "error", title: string, message: string) => {
    toast.add({
      type,
      title,
      description: message,
    });
  };

  const API = process.env.NEXT_PUBLIC_API;
  const accessToken = localStorage.getItem("access");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("job_title", jobTitle);
    formData.append("job_category", jobCategory);
    formData.append("job_type", jobType);
    formData.append("experience_level", experienceLevel);
    formData.append("location", location);
    formData.append("salary_range", salaryRange);
    formData.append("description", description);
    formData.append("key_skills", keySkills);
    formData.append("min_qualification", minQualification);
    formData.append("experience_years", experienceYears);
    formData.append("deadline", deadline);
    formData.append("openings", openings);
    formData.append("benefits", benefits);
    formData.append("company_name", companyName);

    if (logoFile) {
      formData.append("logo", logoFile);
    }


    try {
      const response = await fetch(`${API}/api/jobs/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showJobToast("success", "Success", "Job posted successfully!");
        console.log(data);
      } else {
        console.error(data);
        showJobToast("error", "Error", data?.detail || "Failed to post job.");
      }
    } catch (error) {
      console.error(error);
      showJobToast("error", "Error", "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen w-full ">

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          {/* Job Information */}
          <Section title="Job Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Job Title" required>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. React Developer"
                  className="input"
                />
              </Field>

              <Field label="Job Category" required>
                <SelectField
                  value={jobCategory}
                  onChange={setJobCategory}
                  placeholder="Select category"
                  options={JOB_CATEGORIES}
                />
              </Field>

              <Field label="Job Type" required>
                <SelectField
                  value={jobType}
                  onChange={setJobType}
                  placeholder="Select job type"
                  options={JOB_TYPES}
                />
              </Field>

              <Field label="Experience Level" required>
                <SelectField
                  value={experienceLevel}
                  onChange={setExperienceLevel}
                  placeholder="Select experience level"
                  options={EXPERIENCE_LEVELS}
                />
              </Field>

              <Field label="Location" required>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Jaipur, Rajasthan"
                    className="input pl-9"
                  />
                </div>
              </Field>

              <Field label="Salary Range">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. 5,00,000 - 8,00,000"
                    className="input pl-9"
                  />
                </div>
              </Field>
            </div>
          </Section>

          <Divider />

          {/* Job Description */}
          <Section title="Job Description">
            <Field label="Job Description" required>
              <textarea
                value={description}
                maxLength={DESCRIPTION_LIMIT}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a detailed description about the job role, responsibilities, and expectations..."
                className="h-32 w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F6FE0]/30"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {description.length} / {DESCRIPTION_LIMIT}
              </p>
            </Field>
          </Section>

          <Divider />

          {/* Requirements */}
          <Section title="Requirements">
            <div className="flex flex-col gap-4">
              <Field label="Key Skills (comma separated)" required>
                <input
                  type="text"
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  placeholder="e.g. React, JavaScript, TypeScript, Tailwind CSS"
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Minimum Qualification" required>
                  <input
                    type="text"
                    value={minQualification}
                    onChange={(e) => setMinQualification(e.target.value)}
                    placeholder="e.g. Bachelor's Degree in Computer Science"
                    className="input"
                  />
                </Field>

                <Field label="Experience (in years)" required>
                  <input
                    type="text"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 2+ years"
                    className="input"
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Divider />

          {/* Additional Information */}
          <Section title="Additional Information">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Application Deadline">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="input pl-9 text-slate-600"
                    />
                  </div>
                </Field>

                <Field label="Number of Openings">
                  <input
                    type="number"
                    min={1}
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    placeholder="e.g. 3"
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Benefits (Optional)">
                <input
                  type="text"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="e.g. Health Insurance, Flexible Timings, Work From Home"
                  className="input"
                />
              </Field>
            </div>
          </Section>

          <Divider />

          {/* Company Information */}
          <Section title="Company Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company Name" required>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tech Solutions Pvt. Ltd."
                  className="input"
                />
              </Field>

              <Field label="Company Logo (Optional)">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <UploadCloud className="h-4 w-4 text-slate-400" />
                  {logoFile ? logoFile.name : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={(e) =>
                      setLogoFile(e.target.files ? e.target.files[0] : null)
                    }
                  />
                </label>
                <p className="mt-1.5 text-xs text-slate-400">
                  JPG, PNG or SVG. Max size 2MB.
                </p>
              </Field>
            </div>
          </Section>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/main/dashboard")}
            className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#2F6FE0] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#265ec2]"
          >
            Post Job
          </button>
        </div>
      </form>

      <Toaster />

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #1a2333;
        }
        .input::placeholder {
          color: #94a3b8;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(47, 111, 224, 0.3);
          border-color: #2f6fe0;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable bits                                                      */
/* ------------------------------------------------------------------ */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-6 h-px w-full bg-slate-100" />;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pr-9 text-slate-600"
      >
        <option value="">{placeholder}</option>
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