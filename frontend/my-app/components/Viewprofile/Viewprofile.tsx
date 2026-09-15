"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster, toast } from "@/components/ui/toast";
import {
  Eye,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Home,
  ChevronRight,
  ChevronLeft,
  User,
  Wrench,
  Briefcase,
  GraduationCap,
  Calendar,
  FileText,
  ExternalLink,
  Inbox,
} from "lucide-react";

// Same shape the backend returns for a profile row. Kept separate from the
// edit page's ProfileFormData because this page only ever reads data — it
// never builds a FormData payload to send back.
interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  job_title: string;
  experience: string;
  about: string;

  experience_company: string;
  experience_role: string;
  experience_start_date: string;
  experience_end_date: string;
  experience_description: string;

  degree: string;
  institution: string;
  field_of_study: string;
  graduation_year: string | number;
  cgpa: string;

  skills: string;

  dob: string;
  gender: string;
  linkedin: string;
  portfolio: string;
  github: string;
  current_salary: string;
  expected_salary: string;
  notice_period: string;

  profile_image?: string;
  profile_strength?: {
    percentage: number;
    status: string;
  };
}

const API = process.env.NEXT_PUBLIC_API;

// The backend can return the profile in a few different shapes:
//  - a single object, a plain array, or a DRF-paginated { results: [...] }.
// This normalizes all three down to a single object (or null), same as the
// edit page does, so this page works no matter which shape the API sends.
function extractProfileObject(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object") return null;
  if (Array.isArray(parsed)) return (parsed[0] as Record<string, unknown>) ?? null;
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(obj.results)) {
    return (obj.results[0] as Record<string, unknown>) ?? null;
  }
  if (obj.profile && typeof obj.profile === "object" && !Array.isArray(obj.profile)) {
    return obj.profile as Record<string, unknown>;
  }
  return obj;
}

function statusFromPercentage(percentage: number): string {
  if (percentage >= 90) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 40) return "Average";
  return "Incomplete";
}

function CircularProgress({
  percentage,
  colorClassName,
}: {
  percentage: number;
  colorClassName: string;
}) {
  const size = 92;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`fill-none transition-all duration-700 ease-out ${colorClassName}`}
        />
      </svg>
      <span className="absolute text-lg font-bold">{clamped}%</span>
    </div>
  );
}

// A small pulsing gray block, the base unit every skeleton piece below is
// built from.
function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

// Full-page skeleton that mirrors the real layout (breadcrumb, header,
// identity card, completeness card, info grid) instead of a bare spinner —
// this way nothing "jumps" in size once the real data arrives.
function ViewProfileSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Breadcrumb */}
        <Skel className="h-4 w-48" />

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skel className="h-7 w-40" />
            <Skel className="h-4 w-80 max-w-full" />
          </div>
          <Skel className="h-9 w-40 rounded-md" />
        </div>

        {/* Identity card */}
        <Card className="border-none p-4 shadow-sm ring-1 ring-border/60 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Skel className="h-20 w-20 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skel className="h-5 w-48" />
              <Skel className="h-4 w-32" />
              <Skel className="h-4 w-64 max-w-full" />
              <Skel className="mt-2 h-4 w-full max-w-md" />
              <Skel className="h-4 w-3/4 max-w-md" />
            </div>
            <Skel className="h-9 w-32 shrink-0 rounded-md" />
          </div>
        </Card>

        {/* Completeness */}
        <Card className="flex flex-col gap-4 border-none p-4 shadow-sm ring-1 ring-border/60 sm:flex-row sm:items-center sm:p-6">
          <Skel className="h-[92px] w-[92px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skel className="h-4 w-40" />
            <Skel className="h-3 w-64 max-w-full" />
            <Skel className="mt-1 h-2 w-full rounded-full" />
          </div>
        </Card>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-3 border-none p-4 shadow-sm ring-1 ring-border/60 sm:p-6">
              <Skel className="h-4 w-36" />
              <Skel className="h-3 w-full" />
              <Skel className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ViewProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strength, setStrength] = useState({ percentage: 0, status: "Incomplete" });

  // ---- Fetch the logged-in user's profile with the GET API ----
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access");

      if (!token) {
        toast.add({
          type: "error",
          title: "Error",
          description: "Please login to view your profile.",
        });
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API}/api/profile/`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            toast.add({
              type: "error",
              title: "No Profile Found",
              description: "Please complete your profile first.",
            });
            router.push("/main/Profile");
            return;
          }
          toast.add({
            type: "error",
            title: "Error",
            description: "Unable to load profile data.",
          });
          return;
        }

        const responseText = await response.text();
        let parsed: unknown = null;
        try {
          parsed = responseText ? JSON.parse(responseText) : null;
        } catch {
          parsed = null;
        }

        const currentProfile = extractProfileObject(parsed);
        if (!currentProfile) return;

        setProfile(currentProfile as unknown as Profile);

        if (currentProfile.profile_image) {
          const img = String(currentProfile.profile_image);
          setAvatarUrl(img.startsWith("http") ? img : `${API}${img}`);
        }

        if (
          currentProfile.profile_strength &&
          typeof currentProfile.profile_strength === "object"
        ) {
          const ps = currentProfile.profile_strength as {
            percentage?: number;
            status?: string;
          };
          setStrength({
            percentage: Number(ps.percentage ?? 0),
            status: String(ps.status ?? "Incomplete"),
          });
        } else {
          // Fall back to a quick client-side estimate if the backend
          // doesn't send profile_strength on this endpoint.
          const filled = [
            currentProfile.full_name && currentProfile.email && currentProfile.phone && currentProfile.location,
            currentProfile.experience_company || currentProfile.experience_role,
            currentProfile.degree || currentProfile.institution,
            currentProfile.skills,
          ].filter(Boolean).length;
          const pct = Math.round((filled / 4) * 100);
          setStrength({ percentage: pct, status: statusFromPercentage(pct) });
        }
      } catch (error) {
        console.error(error);
        toast.add({
          type: "error",
          title: "Error",
          description: "Unable to load profile data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strengthBarColor =
    strength.percentage >= 90
      ? "bg-emerald-500"
      : strength.percentage >= 70
        ? "bg-blue-500"
        : strength.percentage >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  const strengthRingColor =
    strength.percentage >= 90
      ? "stroke-emerald-500"
      : strength.percentage >= 70
        ? "stroke-blue-600"
        : strength.percentage >= 40
          ? "stroke-amber-500"
          : "stroke-red-500";

  if (isLoading) {
    return <ViewProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a profile to show.
        </p>
        <Button onClick={() => router.push("/main/Profile")}>Go to Edit Profile</Button>
        <Toaster />
      </div>
    );
  }

  const skillsList = (profile.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Icon "chip" — a soft colored circle behind each section's icon, used
  // consistently across the identity card and every info card below.
  const IconChip = ({
    icon: Icon,
    className = "",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    className?: string;
  }) => (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );

  const ViewSectionHeader = ({
    icon: Icon,
    title,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <IconChip icon={Icon} />
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50">
        <Eye className="h-3.5 w-3.5" />
        View
      </button>
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );

  // Consistent "nothing here yet" placeholder used across every empty
  // section, instead of a single flat sentence.
  const EmptyState = ({
    icon: Icon,
    message,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    message: string;
  }) => (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-center">
      <Icon className="h-5 w-5 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  const cardClass =
    "border-none shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md p-4 sm:p-6";

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            className="transition-colors hover:text-foreground"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            className="transition-colors hover:text-foreground"
            onClick={() => router.push("/main/Profile")}
          >
            Profile
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">View Profile</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">View Profile</h1>
            <p className="text-sm text-muted-foreground">
              Here is your complete profile information. Keep it updated to get better job
              opportunities.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-fit gap-2 shadow-sm"
            onClick={() => router.push("/main/Profile")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Edit Profile
          </Button>
        </div>

        {/* Identity card */}
        <Card className={cardClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 ring-2 ring-blue-100">
                <AvatarImage src={avatarUrl ?? undefined} alt="Profile picture" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-semibold text-white">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
            </div>

            <div className="flex-1 space-y-1.5">
              <h2 className="text-lg font-bold tracking-tight">
                {profile.full_name || "Your Name"}
              </h2>
              {profile.job_title && (
                <p className="text-sm font-medium text-blue-600">{profile.job_title}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {profile.phone}
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email}
                  </span>
                )}
              </div>
              {profile.about && (
                <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                  {profile.about}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              className="w-fit shrink-0 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => router.push("/main/Profile")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Profile completeness */}
        <Card className={`flex flex-col gap-4 sm:flex-row sm:items-center ${cardClass}`}>
          <CircularProgress percentage={strength.percentage} colorClassName={strengthRingColor} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold tracking-tight">Profile Completeness</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {strength.percentage >= 90
                ? "Your profile is excellent and fully visible to recruiters."
                : strength.percentage >= 70
                  ? "Your profile is looking good! Add more details to increase your visibility."
                  : strength.percentage >= 40
                    ? "You're halfway there — fill in a few more sections."
                    : "Your profile needs more information to attract recruiters."}
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${strengthBarColor}`}
                  style={{ width: `${strength.percentage}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {strength.percentage}% ({strength.status})
              </span>
            </div>
          </div>
        </Card>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className={cardClass}>
            <ViewSectionHeader icon={User} title="Personal Information" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <InfoRow label="Full Name" value={profile.full_name} />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={profile.phone} />
              <InfoRow label="Location" value={profile.location} />
              {profile.dob && <InfoRow label="Date of Birth" value={profile.dob} />}
              {profile.gender && <InfoRow label="Gender" value={profile.gender} />}
            </div>
          </Card>

          <Card className={cardClass}>
            <ViewSectionHeader icon={Wrench} title="Skills" />
            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="rounded-md border-none bg-blue-50 font-medium text-blue-700 hover:bg-blue-100"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <EmptyState icon={Wrench} message="No skills added yet." />
            )}
          </Card>

          <Card className={cardClass}>
            <ViewSectionHeader icon={Briefcase} title="Work Experience" />
            {profile.experience_company || profile.experience_role ? (
              <div className="relative border-l-2 border-blue-200 pl-4">
                <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                <p className="text-sm font-semibold">{profile.experience_company}</p>
                <p className="text-sm text-muted-foreground">{profile.experience_role}</p>
                {(profile.experience_start_date || profile.experience_end_date) && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {profile.experience_start_date || "—"} – {profile.experience_end_date || "Present"}
                  </p>
                )}
                {profile.experience_description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {profile.experience_description}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState icon={Briefcase} message="No work experience added yet." />
            )}
          </Card>

          <Card className={cardClass}>
            <ViewSectionHeader icon={GraduationCap} title="Education" />
            {profile.degree || profile.institution ? (
              <div>
                <p className="text-sm font-semibold">{profile.degree}</p>
                <p className="text-sm text-muted-foreground">{profile.field_of_study}</p>
                <p className="text-sm text-muted-foreground">{profile.institution}</p>
                {(profile.graduation_year || profile.cgpa) && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {profile.graduation_year && <>{profile.graduation_year}</>}
                    {profile.graduation_year && profile.cgpa && " · "}
                    {profile.cgpa && <>CGPA: {profile.cgpa}</>}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState icon={GraduationCap} message="No education details added yet." />
            )}
          </Card>

          <Card className={`lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-8 ${cardClass}`}>
            <div>
              <ViewSectionHeader icon={FileText} title="Additional Information" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <InfoRow
                  label="Current Salary"
                  value={profile.current_salary ? `₹${profile.current_salary} (PA)` : ""}
                />
                <InfoRow
                  label="Expected Salary"
                  value={profile.expected_salary ? `₹${profile.expected_salary} (PA)` : ""}
                />
                <InfoRow
                  label="Notice Period"
                  value={
                    profile.notice_period
                      ? profile.notice_period === "immediate"
                        ? "Immediate"
                        : `${profile.notice_period} Days`
                      : ""
                  }
                />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    LinkedIn
                  </p>
                  {profile.linkedin ? (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      {profile.linkedin.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm font-medium">—</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    Portfolio
                  </p>
                  {profile.portfolio ? (
                    <a
                      href={profile.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      {profile.portfolio.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm font-medium">—</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    GitHub
                  </p>
                  {profile.github ? (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      {profile.github.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm font-medium">—</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <ViewSectionHeader icon={User} title="About Me" />
              {profile.about ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
              ) : (
                <EmptyState icon={User} message="No summary added yet." />
              )}
            </div>
          </Card>
        </div>

        <Toaster />
      </div>
    </div>
  );
}