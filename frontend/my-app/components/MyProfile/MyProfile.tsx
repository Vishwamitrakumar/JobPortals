"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster, toast } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  Camera,
  Save,
  X,
  Calendar,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface ProfileFormData {
  // Personal information (required on the backend)
  fullName: string;
  email: string;
  phone: string;
  location: string;

  // Personal information (optional on the backend)
  jobTitle: string;
  experience: string;
  about: string;

  // Work experience (all optional)
  experienceCompany: string;
  experienceRole: string;
  experienceStartDate: string;
  experienceEndDate: string;
  experienceDescription: string;

  // Education (all optional)
  degree: string;
  institution: string;
  fieldOfStudy: string;
  graduationYear: string;
  cgpa: string;

  // Skills (optional)
  skills: string;

  // Additional information (all optional)
  dob: string;
  gender: string;
  linkedin: string;
  portfolio: string;
  github: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
}

interface ProfileStrength {
  percentage: number;
  status: string;
  sections: {
    basic_information: boolean;
    work_experience: boolean;
    education: boolean;
    skills: boolean;
  };
}

// NOTE: previously this had hardcoded dummy values (a fake name/email/phone).
// That meant the form showed fake "already filled" data before the real
// profile was fetched (or if the fetch ever failed). Fields now start empty
// and get populated only from the actual API response.
const initialFormData: ProfileFormData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  jobTitle: "",
  experience: "",
  about: "",

  experienceCompany: "",
  experienceRole: "",
  experienceStartDate: "",
  experienceEndDate: "",
  experienceDescription: "",

  degree: "",
  institution: "",
  fieldOfStudy: "",
  graduationYear: "",
  cgpa: "",

  skills: "",

  dob: "",
  gender: "",
  linkedin: "",
  portfolio: "",
  github: "",
  currentSalary: "",
  expectedSalary: "",
  noticePeriod: "",
};

const defaultProfileStrength: ProfileStrength = {
  percentage: 0,
  status: "Incomplete",
  sections: {
    basic_information: false,
    work_experience: false,
    education: false,
    skills: false,
  },
};

// Only these are actually required on the Django model (no blank=True/null=True).
// Everything else is optional, so it should never get a red asterisk.
const REQUIRED_FIELDS: Array<keyof ProfileFormData> = [
  "fullName",
  "email",
  "phone",
  "location",
];

const FIELD_LABELS: Partial<Record<keyof ProfileFormData, string>> = {
  fullName: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  location: "Location",
};

// Red-asterisk label, used ONLY for fields that are actually required.
function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-500">*</span>
    </Label>
  );
}

function statusFromPercentage(percentage: number): string {
  if (percentage >= 90) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 40) return "Average";
  return "Incomplete";
}

const API = process.env.NEXT_PUBLIC_API;

// The backend can return the profile in a few different shapes depending on
// how the Django view is wired up:
//  - a single profile object:      { id, full_name, ... }
//  - a plain array:                [{ id, full_name, ... }, ...]
//  - a DRF-paginated response:     { count, results: [{ ... }, ...] }
// Previously the code only checked `typeof x === "object"`, which is also
// true for arrays — so when the backend returned an array, every field read
// like `currentProfile.full_name` came back undefined and the form stayed
// blank even though the row existed in the DB. This normalizes all three
// shapes down to a single profile object (or null).
function extractProfileObject(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  if (Array.isArray(parsed)) {
    return (parsed[0] as Record<string, unknown>) ?? null;
  }

  const obj = parsed as Record<string, unknown>;

  if (Array.isArray(obj.results)) {
    const results = obj.results as unknown[];
    return (results[0] as Record<string, unknown>) ?? null;
  }

  // Some viewsets nest the object under a "profile" key.
  if (obj.profile && typeof obj.profile === "object" && !Array.isArray(obj.profile)) {
    return obj.profile as Record<string, unknown>;
  }

  return obj;
}

export default function MyProfile() {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileStrength, setProfileStrength] = useState<ProfileStrength>(
    defaultProfileStrength
  );

  // Tracks whether a profile row already exists in the DB for this user.
  // Populated after the initial GET. Used to decide PUT (update) vs
  // POST (create) when saving.
  const [profileExists, setProfileExists] = useState(false);

  // Education section still stays collapsed until the user checks the box,
  // OR the fetched profile already has data in it.
  const [showEducation, setShowEducation] = useState(false);

  // Add Work Experience is no longer an independent toggle — it shows
  // automatically only while "Current Salary" (Additional Information) has
  // a value, and hides again the moment that field is cleared.
  const showWorkExperience = Boolean(formData.currentSalary.trim());

  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showProfileToast = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    toast.add({
      type,
      title,
      description: message,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setAvatarUrl(null);
    setSelectedFile(null);
    setShowEducation(false);
  };

  // Only the truly-required fields are checked before saving.
  const getEmptyFields = (): string[] => {
    return REQUIRED_FIELDS.filter(
      (key) => !formData[key] || String(formData[key]).trim() === ""
    ).map((key) => FIELD_LABELS[key] ?? key);
  };

  // Recompute profile strength on the client whenever the backend doesn't
  // send one (or as an instant preview while the user is editing).
  const computeProfileStrength = (data: ProfileFormData): ProfileStrength => {
    const basic_information = Boolean(
      data.fullName.trim() &&
      data.email.trim() &&
      data.phone.trim() &&
      data.location.trim()
    );
    const work_experience = Boolean(
      data.experienceCompany.trim() || data.experienceRole.trim()
    );
    const education = Boolean(
      data.degree.trim() || data.institution.trim()
    );
    const skills = Boolean(data.skills.trim());

    const sections = { basic_information, work_experience, education, skills };
    const filledCount = Object.values(sections).filter(Boolean).length;
    const percentage = Math.round((filledCount / 4) * 100);

    return {
      percentage,
      status: statusFromPercentage(percentage),
      sections,
    };
  };

  useEffect(() => {
    setProfileStrength(computeProfileStrength(formData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const applyProfileResponse = (currentProfile: Record<string, unknown>) => {
    const experienceCompany = String(currentProfile.experience_company || "");
    const experienceRole = String(currentProfile.experience_role || "");
    const experienceStartDate = String(currentProfile.experience_start_date || "");
    const experienceEndDate = String(currentProfile.experience_end_date || "");
    const experienceDescription = String(currentProfile.experience_description || "");

    const degree = String(currentProfile.degree || "");
    const institution = String(currentProfile.institution || "");
    const fieldOfStudy = String(currentProfile.field_of_study || "");
    const graduationYear =
      currentProfile.graduation_year !== null &&
        currentProfile.graduation_year !== undefined
        ? String(currentProfile.graduation_year)
        : "";
    const cgpa = String(currentProfile.cgpa || "");

    // This same setFormData runs whether the profile is being created
    // for the first time or already exists — GET always returns
    // whatever was last saved, so editing/updating just pre-fills
    // these same fields with the DB values.
    setFormData({
      fullName: String(currentProfile.full_name || ""),
      email: String(currentProfile.email || ""),
      phone: String(currentProfile.phone || ""),
      location: String(currentProfile.location || ""),
      jobTitle: String(currentProfile.job_title || ""),
      experience: String(currentProfile.experience || ""),
      about: String(currentProfile.about || ""),

      experienceCompany,
      experienceRole,
      experienceStartDate,
      experienceEndDate,
      experienceDescription,

      degree,
      institution,
      fieldOfStudy,
      graduationYear,
      cgpa,

      skills: String(currentProfile.skills || ""),

      dob: String(currentProfile.dob || ""),
      gender: String(currentProfile.gender || ""),
      linkedin: String(currentProfile.linkedin || ""),
      portfolio: String(currentProfile.portfolio || ""),
      github: String(currentProfile.github || ""),
      currentSalary: String(currentProfile.current_salary || ""),
      expectedSalary: String(currentProfile.expected_salary || ""),
      noticePeriod: String(currentProfile.notice_period || ""),
    });

    // Auto-expand the Education card when the profile already has data
    // saved in it, so an update flow shows what's already there instead of
    // hiding it behind an unchecked box. (Work Experience visibility is
    // derived from currentSalary and needs no manual handling here.)
    setShowEducation(
      Boolean(degree || institution || fieldOfStudy || graduationYear || cgpa)
    );

    if (currentProfile.profile_image) {
      const img = String(currentProfile.profile_image);
      // Handle both relative ("/media/...") and absolute (already-full URL) paths.
      setAvatarUrl(img.startsWith("http") ? img : `${API}${img}`);
    }

    // Use the backend-computed profile strength if it's present,
    // e.g. { percentage, status, sections: {...} }.
    if (
      currentProfile.profile_strength &&
      typeof currentProfile.profile_strength === "object"
    ) {
      const ps = currentProfile.profile_strength as Partial<ProfileStrength>;
      setProfileStrength({
        percentage: Number(ps.percentage ?? 0),
        status: String(ps.status ?? "Incomplete"),
        sections: {
          basic_information: Boolean(ps.sections?.basic_information),
          work_experience: Boolean(ps.sections?.work_experience),
          education: Boolean(ps.sections?.education),
          skills: Boolean(ps.sections?.skills),
        },
      });
    }
  };

  // ---- Fetch the logged-in user's own profile ----
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access");

      if (!token) {
        showProfileToast("error", "Error", "Please login to load your profile.");
        return;
      }

      try {
        const response = await fetch(`${API}/api/profile/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status !== 404) {
            showProfileToast("error", "Error", "Unable to load profile data.");
          }
          // 404 just means the user hasn't created a profile yet — leave
          // profileExists as false so the next save uses POST.
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

        if (!currentProfile) {
          return;
        }

        // A real profile record came back from the DB — future saves
        // should update it (PUT), not try to create a new one.
        setProfileExists(true);
        applyProfileResponse(currentProfile);
      } catch (error) {
        console.error(error);
        showProfileToast("error", "Error", "Unable to load profile data.");
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Save profile (creates the row the first time, updates it after) ----
  const handleSave = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      showProfileToast("error", "Error", "Please login to save your profile.");
      return;
    }

    // Only the required fields block saving; everything else is optional.
    const emptyFields = getEmptyFields();
    if (emptyFields.length > 0) {
      showProfileToast(
        "error",
        "Missing Information",
        `Please fill: ${emptyFields.join(", ")}`
      );
      return;
    }

    setIsSaving(true);

    const buildFormData = () => {
      const data = new FormData();

      data.append("full_name", formData.fullName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("location", formData.location);
      data.append("job_title", formData.jobTitle);
      data.append("experience", formData.experience);
      data.append("about", formData.about);

      data.append("experience_company", formData.experienceCompany);
      data.append("experience_role", formData.experienceRole);
      data.append("experience_start_date", formData.experienceStartDate);
      data.append("experience_end_date", formData.experienceEndDate);
      data.append("experience_description", formData.experienceDescription);

      data.append("degree", formData.degree);
      data.append("institution", formData.institution);
      data.append("field_of_study", formData.fieldOfStudy);
      data.append("graduation_year", formData.graduationYear);
      data.append("cgpa", formData.cgpa);

      data.append("skills", formData.skills);

      data.append("dob", formData.dob);
      data.append("gender", formData.gender);
      data.append("linkedin", formData.linkedin);
      data.append("portfolio", formData.portfolio);
      data.append("github", formData.github);
      data.append("current_salary", formData.currentSalary);
      data.append("expected_salary", formData.expectedSalary);
      data.append("notice_period", formData.noticePeriod);

      if (selectedFile) {
        data.append("profile_image", selectedFile);
      }

      return data;
    };

    const parseResponse = async (response: Response) => {
      const contentType = response.headers.get("content-type") || "";
      const responseText = await response.text();
      let responseData: Record<string, unknown> = {};

      if (contentType.includes("application/json")) {
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch {
          responseData = { detail: "Unexpected server response." };
        }
      } else {
        responseData = { detail: "Server error occurred. Please try again later." };
      }

      return responseData;
    };

    try {
      // Use PUT to update an existing profile, POST to create the first one.
      // If we're not sure yet (profileExists could be stale) and PUT comes
      // back 404/405, fall back to POST automatically instead of failing.
      let method: "PUT" | "POST" = profileExists ? "PUT" : "POST";
      let response = await fetch(`${API}/api/profile/`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: buildFormData(),
      });

      if (!response.ok && (response.status === 404 || response.status === 405)) {
        method = method === "PUT" ? "POST" : "PUT";
        response = await fetch(`${API}/api/profile/`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: buildFormData(),
        });
      }

      const responseData = await parseResponse(response);

      if (!response.ok) {
        console.error(responseData);
        showProfileToast(
          "error",
          "Error",
          String(
            (responseData?.detail as string | undefined) ||
            (responseData?.message as string | undefined) ||
            "Failed to save profile"
          )
        );
        return;
      }

      // Save succeeded — a row now definitely exists in the DB.
      setProfileExists(true);
      setSelectedFile(null);

      // Re-apply whatever the server persisted (e.g. final image URL,
      // any server-side normalization) so the fields reflect the DB state.
      const savedProfile = extractProfileObject(responseData);
      if (savedProfile && Object.keys(savedProfile).length) {
        applyProfileResponse(savedProfile);
      }

      const strengthSource = savedProfile ?? responseData;
      if (
        strengthSource?.profile_strength &&
        typeof strengthSource.profile_strength === "object"
      ) {
        const ps = strengthSource.profile_strength as Partial<ProfileStrength>;
        setProfileStrength({
          percentage: Number(ps.percentage ?? 0),
          status: String(ps.status ?? "Incomplete"),
          sections: {
            basic_information: Boolean(ps.sections?.basic_information),
            work_experience: Boolean(ps.sections?.work_experience),
            education: Boolean(ps.sections?.education),
            skills: Boolean(ps.sections?.skills),
          },
        });
      }

      showProfileToast("success", "Success", "Profile saved successfully!");
    } catch (error) {
      console.error(error);
      showProfileToast("error", "Error", "Something went wrong while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const strengthBarColor =
    profileStrength.percentage >= 90
      ? "bg-emerald-500"
      : profileStrength.percentage >= 70
        ? "bg-blue-500"
        : profileStrength.percentage >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  const strengthSectionItems: Array<{ key: keyof ProfileStrength["sections"]; label: string }> = [
    { key: "basic_information", label: "Basic Information" },
    { key: "work_experience", label: "Work Experience" },
    { key: "education", label: "Education" },
    { key: "skills", label: "Skills" },
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal information and account settings.
            </p>
          </div>
          <Button variant="outline" className="w-fit gap-2">
            <Eye className="h-4 w-4" />
            View Profile
          </Button>
        </div>

        {/* Profile Strength */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold">Profile Strength</h2>
            </div>
            <span className="text-sm font-medium">
              {profileStrength.percentage}%{" "}
              <span className="text-muted-foreground">({profileStrength.status})</span>
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${strengthBarColor}`}
              style={{ width: `${profileStrength.percentage}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {strengthSectionItems.map((item) => {
              const done = profileStrength.sections[item.key];
              return (
                <div key={item.key} className="flex items-center gap-2 text-sm">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={done ? "" : "text-muted-foreground"}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">Personal Information</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2 md:w-40">
              <div className="relative">
                <Avatar className="h-28 w-28 border">
                  <AvatarImage src={avatarUrl ?? undefined} alt="Profile picture" />
                  <AvatarFallback className="text-3xl font-medium">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-background text-primary shadow-sm hover:bg-muted"
                >
                  <Camera className="h-4 w-4 " />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <p className="text-center text-sm font-medium">Upload Profile Picture</p>
              <p className="text-center text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="fullName">Full Name</RequiredLabel>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="email">Email Address</RequiredLabel>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <RequiredLabel htmlFor="phone">Phone Number</RequiredLabel>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="location">Location</RequiredLabel>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>

              {/* Optional — no red asterisk */}
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Current Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experience">Experience (Years)</Label>
                <Select
                  value={formData.experience || ""}
                  onValueChange={(value) => updateField("experience", value ?? "")}
                >
                  <SelectTrigger id="experience">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0 - 1 years</SelectItem>
                    <SelectItem value="1-3">1 - 3 years</SelectItem>
                    <SelectItem value="3-5">3 - 5 years</SelectItem>
                    <SelectItem value="5-10">5 - 10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="about">About Me</Label>
                <textarea
                  id="about"
                  maxLength={500}
                  value={formData.about}
                  onChange={(e) => updateField("about", e.target.value)}
                  placeholder="Write a short summary about yourself, your experience and skills..."
                  className="min-h-[100px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {formData.about.length}/500
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Education — collapsed until the checkbox is checked */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="toggleEducation"
              checked={showEducation}
              onCheckedChange={(checked) => setShowEducation(checked === true)}
            />
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <Label htmlFor="toggleEducation" className="cursor-pointer text-sm font-semibold">
              Add Education
            </Label>
          </div>

          {showEducation && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  placeholder="e.g. B.Tech"
                  value={formData.degree}
                  onChange={(e) => updateField("degree", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  placeholder="e.g. IIT Jaipur"
                  value={formData.institution}
                  onChange={(e) => updateField("institution", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fieldOfStudy">Field of Study</Label>
                <Input
                  id="fieldOfStudy"
                  placeholder="e.g. Computer Science"
                  value={formData.fieldOfStudy}
                  onChange={(e) => updateField("fieldOfStudy", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  placeholder="e.g. 2023"
                  value={formData.graduationYear}
                  onChange={(e) => updateField("graduationYear", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cgpa">CGPA</Label>
                <Input
                  id="cgpa"
                  placeholder="e.g. 8.5"
                  value={formData.cgpa}
                  onChange={(e) => updateField("cgpa", e.target.value)}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Skills — optional */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">Skills</h2>
          <div className="space-y-1.5">
            <Label htmlFor="skills">Skills</Label>
            <textarea
              id="skills"
              value={formData.skills}
              onChange={(e) => updateField("skills", e.target.value)}
              placeholder="e.g. Python, Django, React, SQL (comma separated)"
              className="min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </Card>

        {/* Additional Information — all optional */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">Additional Information</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of Birth</Label>
              <div className="relative">
                <Input
                  id="dob"
                  type="date"
                  className="pr-8"
                  value={formData.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                />
                <Calendar className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) => updateField("gender", value ?? "")}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedin}
                onChange={(e) => updateField("linkedin", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portfolio">Portfolio / Website</Label>
              <Input
                id="portfolio"
                placeholder="https://yourwebsite.com"
                value={formData.portfolio}
                onChange={(e) => updateField("portfolio", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="github">GitHub Profile</Label>
              <Input
                id="github"
                placeholder="https://github.com/username"
                value={formData.github}
                onChange={(e) => updateField("github", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currentSalary">Current Salary (Annual)</Label>
              <Input
                id="currentSalary"
                type="number"
                placeholder="e.g. 600000"
                value={formData.currentSalary}
                onChange={(e) => updateField("currentSalary", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expectedSalary">Expected Salary (Annual)</Label>
              <Input
                id="expectedSalary"
                type="number"
                placeholder="e.g. 800000"
                value={formData.expectedSalary}
                onChange={(e) => updateField("expectedSalary", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="noticePeriod">Notice Period</Label>
              <Select
                value={formData.noticePeriod || ""}
                onValueChange={(value) => updateField("noticePeriod", value ?? "")}
              >
                <SelectTrigger id="noticePeriod">
                  <SelectValue placeholder="Select notice period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="15">15 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>


        {showWorkExperience && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-semibold">
                Add Work Experience
              </Label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="experienceCompany">Company</Label>
                <Input
                  id="experienceCompany"
                  placeholder="e.g. Acme Corp"
                  value={formData.experienceCompany}
                  onChange={(e) => updateField("experienceCompany", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experienceRole">Role / Title</Label>
                <Input
                  id="experienceRole"
                  placeholder="e.g. Backend Developer"
                  value={formData.experienceRole}
                  onChange={(e) => updateField("experienceRole", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experienceStartDate">Start Date</Label>
                <Input
                  id="experienceStartDate"
                  type="date"
                  value={formData.experienceStartDate}
                  onChange={(e) => updateField("experienceStartDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experienceEndDate">End Date</Label>
                <Input
                  id="experienceEndDate"
                  type="date"
                  value={formData.experienceEndDate}
                  onChange={(e) => updateField("experienceEndDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="experienceDescription">Description</Label>
                <textarea
                  id="experienceDescription"
                  value={formData.experienceDescription}
                  onChange={(e) => updateField("experienceDescription", e.target.value)}
                  placeholder="What did you work on in this role?"
                  className="min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </Card>
        )}


        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="gap-2" onClick={handleCancel}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            className="gap-2 bg-blue-600 text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 focus-visible:ring-blue-600 disabled:opacity-70"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        <Toaster />
      </div>
    </div>
  );
}