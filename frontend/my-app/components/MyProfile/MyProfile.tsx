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
import { Eye, Camera, Save, X, Calendar } from "lucide-react";

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  experience: string;
  about: string;
  dob: string;
  gender: string;
  linkedin: string;
  portfolio: string;
  github: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
}

const initialFormData: ProfileFormData = {
  fullName: "Vishwamitra Kumar",
  email: "kumarvishwamitra14@gmail.com",
  phone: "+91 9876543210",
  location: "Jaipur, Rajasthan, India",
  jobTitle: "",
  experience: "",
  about: "",
  dob: "",
  gender: "",
  linkedin: "",
  portfolio: "",
  github: "",
  currentSalary: "",
  expectedSalary: "",
  noticePeriod: "",
};

// Human-readable labels used in the "please fill all fields" message
const FIELD_LABELS: Record<keyof ProfileFormData, string> = {
  fullName: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  location: "Location",
  jobTitle: "Current Job Title",
  experience: "Experience",
  about: "About Me",
  dob: "Date of Birth",
  gender: "Gender",
  linkedin: "LinkedIn Profile",
  portfolio: "Portfolio / Website",
  github: "GitHub Profile",
  currentSalary: "Current Salary",
  expectedSalary: "Expected Salary",
  noticePeriod: "Notice Period",
};

// Small helper so every label renders with a consistent red asterisk.
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

const API = process.env.NEXT_PUBLIC_API;

export default function MyProfile() {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
  };

  // Returns the list of empty required fields (human-readable labels).
  const getEmptyFields = (): string[] => {
    return (Object.keys(formData) as Array<keyof ProfileFormData>)
      .filter((key) => !formData[key] || String(formData[key]).trim() === "")
      .map((key) => FIELD_LABELS[key]);
  };

  // ---- Fetch the logged-in user's own profile ----
  // Backend uses IsAuthenticated + request.user, so GET /api/profile/
  // returns a single profile object (not a list). No client-side
  // matching by userId is needed or safe.
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
          // e.g. profile not created yet for this user, or auth expired.
          if (response.status !== 404) {
            showProfileToast("error", "Error", "Unable to load profile data.");
          }
          return;
        }

        const responseText = await response.text();
        let currentProfile: Record<string, unknown> | null = null;

        try {
          currentProfile = responseText ? JSON.parse(responseText) : null;
        } catch {
          currentProfile = null;
        }

        if (!currentProfile || typeof currentProfile !== "object") {
          return;
        }

        setFormData({
          fullName: String(currentProfile.full_name || ""),
          email: String(currentProfile.email || ""),
          phone: String(currentProfile.phone || ""),
          location: String(currentProfile.location || ""),
          jobTitle: String(currentProfile.job_title || ""),
          experience: String(currentProfile.experience || ""),
          about: String(currentProfile.about || ""),
          dob: String(currentProfile.dob || ""),
          gender: String(currentProfile.gender || ""),
          linkedin: String(currentProfile.linkedin || ""),
          portfolio: String(currentProfile.portfolio || ""),
          github: String(currentProfile.github || ""),
          currentSalary: String(currentProfile.current_salary || ""),
          expectedSalary: String(currentProfile.expected_salary || ""),
          noticePeriod: String(currentProfile.notice_period || ""),
        });

        if (currentProfile.profile_image) {
          setAvatarUrl(`${API}${currentProfile.profile_image}`);
        }
      } catch (error) {
        console.error(error);
        showProfileToast("error", "Error", "Unable to load profile data.");
      }
    };

    fetchProfile();
  }, []);

  // ---- Save profile ----
  const handleSave = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      showProfileToast("error", "Error", "Please login to save your profile.");
      return;
    }

    // Validation: every field is required. If anything is empty, stop here
    // and tell the user, instead of hitting the API.
    const emptyFields = getEmptyFields();
    if (emptyFields.length > 0) {
      showProfileToast(
        "error",
        "Missing Information",
        "Please fill all input fields."
      );
      return;
    }

    setIsSaving(true);

    try {
      const data = new FormData();

      data.append("full_name", formData.fullName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("location", formData.location);
      data.append("job_title", formData.jobTitle);
      data.append("experience", formData.experience);
      data.append("about", formData.about);
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

      // Use the same base URL as GET (env var), not a hardcoded host.
      const response = await fetch(`${API}/api/profile/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

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
        // Server returned HTML (e.g. Django debug error page) instead of JSON.
        responseData = { detail: "Server error occurred. Please try again later." };
      }

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

      showProfileToast("success", "Success", "Profile saved successfully!");
    } catch (error) {
      console.error(error);
      showProfileToast("error", "Error", "Something went wrong while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

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

        {/* Personal Information */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">Personal Information</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2 md:w-40">
              <div className="relative">
                <Avatar className="h-28 w-28 border">
                  <AvatarImage src={avatarUrl ?? undefined} alt="Profile picture" />
                  <AvatarFallback className="text-3xl font-medium">V</AvatarFallback>
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

              <div className="space-y-1.5">
                <RequiredLabel htmlFor="jobTitle">Current Job Title</RequiredLabel>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="experience">Experience (Years)</RequiredLabel>
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
                <RequiredLabel htmlFor="about">About Me</RequiredLabel>
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

        {/* Additional Information */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">Additional Information</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="dob">Date of Birth</RequiredLabel>
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
              <RequiredLabel htmlFor="gender">Gender</RequiredLabel>
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
              <RequiredLabel htmlFor="linkedin">LinkedIn Profile</RequiredLabel>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedin}
                onChange={(e) => updateField("linkedin", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <RequiredLabel htmlFor="portfolio">Portfolio / Website</RequiredLabel>
              <Input
                id="portfolio"
                placeholder="https://yourwebsite.com"
                value={formData.portfolio}
                onChange={(e) => updateField("portfolio", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <RequiredLabel htmlFor="github">GitHub Profile</RequiredLabel>
              <Input
                id="github"
                placeholder="https://github.com/username"
                value={formData.github}
                onChange={(e) => updateField("github", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <RequiredLabel htmlFor="currentSalary">Current Salary (Annual)</RequiredLabel>
              <Input
                id="currentSalary"
                type="number"
                placeholder="e.g. 600000"
                value={formData.currentSalary}
                onChange={(e) => updateField("currentSalary", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <RequiredLabel htmlFor="expectedSalary">Expected Salary (Annual)</RequiredLabel>
              <Input
                id="expectedSalary"
                type="number"
                placeholder="e.g. 800000"
                value={formData.expectedSalary}
                onChange={(e) => updateField("expectedSalary", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <RequiredLabel htmlFor="noticePeriod">Notice Period</RequiredLabel>
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