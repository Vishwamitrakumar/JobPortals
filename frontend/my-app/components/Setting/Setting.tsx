"use client";

import * as React from "react";
import {
  User,
  Lock,
  Mail,
  Bell,
  Shield,
  Bookmark,
  Trash2,
  Camera,
  Save,
  Eye,
  EyeOff,
  Briefcase,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Toaster, toast } from "@/components/ui/toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// ======================================================
// TYPES
// ======================================================

type MessageType = "success" | "error" | "";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  job_title: string;
  experience: string;
  about: string;
  dob: string;
  gender: string;
  linkedin: string;
  portfolio: string;
  github: string;
  current_salary: string;
  expected_salary: string;
  notice_period: string;
  profile_image?: string;
}

const FIELD_LABELS: Record<keyof Profile, string> = {
  full_name: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  location: "Location",
  job_title: "Current Job Title",
  experience: "Experience",
  about: "About Me",
  dob: "Date of Birth",
  gender: "Gender",
  linkedin: "LinkedIn Profile",
  portfolio: "Portfolio / Website",
  github: "GitHub Profile",
  current_salary: "Current Salary",
  expected_salary: "Expected Salary",
  notice_period: "Notice Period",
  profile_image: "Profile Photo",
};

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

interface Settings {
  jobRecommendations: boolean;
  applicationUpdates: boolean;
  newsletter: boolean;

  pushNotifications: boolean;
  jobAlerts: boolean;
  applicationStatus: boolean;

  profileVisibility: string;
  showEmailToEmployers: boolean;
}


// ======================================================
// COMPONENT
// ======================================================

export default function Setting() {
  // ----------------------------------------------------
  // PROFILE
  // ----------------------------------------------------

  const [profile, setProfile] = React.useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    job_title: "",
    experience: "",
    about: "",
    dob: "",
    gender: "",
    linkedin: "",
    portfolio: "",
    github: "",
    current_salary: "",
    expected_salary: "",
    notice_period: "",
    profile_image: "",
  });

  // ----------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------

  const [settings, setSettings] = React.useState<Settings>({
    jobRecommendations: true,
    applicationUpdates: true,
    newsletter: false,

    pushNotifications: true,
    jobAlerts: true,
    applicationStatus: true,

    profileVisibility: "public",
    showEmailToEmployers: false,
  });

  // ----------------------------------------------------
  // PASSWORD
  // ----------------------------------------------------

  const [currentPassword, setCurrentPassword] =
    React.useState("");

  const [newPassword, setNewPassword] =
    React.useState("");

  const [confirmPassword, setConfirmPassword] =
    React.useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    React.useState(false);

  const [showNewPassword, setShowNewPassword] =
    React.useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    React.useState(false);

  // ----------------------------------------------------
  // PHOTO
  // ----------------------------------------------------

  const [profilePhoto, setProfilePhoto] =
    React.useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    React.useState<string>("");

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------

  const [profileLoading, setProfileLoading] =
    React.useState(false);

  const [passwordLoading, setPasswordLoading] =
    React.useState(false);

  const [deleteLoading, setDeleteLoading] =
    React.useState(false);

  const [pageLoading, setPageLoading] =
    React.useState(true);

  // ----------------------------------------------------
  // DELETE DIALOG
  // ----------------------------------------------------

  const [deleteDialogOpen, setDeleteDialogOpen] =
    React.useState(false);



  const getToken = () => {
    if (typeof window === "undefined") {
      return "";
    }

    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      ""
    );
  };

  const API = process.env.NEXT_PUBLIC_API;


  // Same required-field validation logic used by MyProfile.
  const getEmptyFields = (): string[] => {
    return (Object.keys(profile) as Array<keyof Profile>)
      .filter((key) => key !== "profile_image")
      .filter(
        (key) =>
          !profile[key] ||
          String(profile[key]).trim() === ""
      )
      .map((key) => FIELD_LABELS[key]);
  };

  const showMessage = (
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

  // ======================================================
  // UPDATE PROFILE STATE
  // ======================================================

  const updateProfile = (
    field: keyof Profile,
    value: string
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // ======================================================
  // LOAD PROFILE
  // ======================================================

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = getToken();

        if (!token) {
          setPageLoading(false);
          return;
        }

        const response = await fetch(
          `${API}/api/profile/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

        const responseText = await response.text();

        let parsed: any = null;

        try {
          parsed = responseText
            ? JSON.parse(responseText)
            : null;
        } catch {
          throw new Error("Invalid server response");
        }

        // Backend response:
        // {
        //   profile: {...},
        //   profile_strength: {...}
        // }
        const data = parsed?.profile ?? parsed;

        if (!data) {
          return;
        }

        // =========================
        // DATABASE PROFILE DATA
        // =========================

        setProfile({
          full_name: String(data.full_name || ""),
          email: String(data.email || ""),
          phone: String(data.phone || ""),
          location: String(data.location || ""),

          job_title: String(data.job_title || ""),
          experience: String(data.experience || ""),
          about: String(data.about || ""),

          dob: String(data.dob || ""),
          gender: String(data.gender || ""),

          linkedin: String(data.linkedin || ""),
          portfolio: String(data.portfolio || ""),
          github: String(data.github || ""),

          current_salary: String(data.current_salary || ""),
          expected_salary: String(data.expected_salary || ""),
          notice_period: String(data.notice_period || ""),

          profile_image: String(data.profile_image || ""),
        });

        // =========================
        // PROFILE IMAGE
        // =========================

        if (data.profile_image) {
          const imageUrl = String(data.profile_image);

          setPhotoPreview(
            imageUrl.startsWith("http")
              ? imageUrl
              : `${API}${imageUrl}`
          );
        } else {
          setPhotoPreview("");
        }

      } catch (error) {
        console.error("Profile GET Error:", error);

        showMessage(
          "error",
          "Error",
          "Failed to load profile."
        );
      } finally {
        setPageLoading(false);
      }
    };

    loadProfile();
  }, []);


  // ======================================================
  // PROFILE PHOTO
  // ======================================================

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        "error",
        "Error",
        "Please select JPG, PNG or GIF image."
      );

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage(
        "error",
        "Error",
        "Profile image must be less than 2MB."
      );

      return;
    }

    setProfilePhoto(file);

    const preview = URL.createObjectURL(file);

    setPhotoPreview(preview);
  };


  // ======================================================
  // SAVE PROFILE
  // ======================================================

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);

      const token = getToken();

      if (!token) {
        showMessage(
          "error",
          "Error",
          "Please login first."
        );

        return;
      }

      // Same validation behavior as MyProfile:
      // do not call the API until every profile field is filled.
      const emptyFields = getEmptyFields();

      if (emptyFields.length > 0) {
        showMessage(
          "error",
          "Error",
          "Please fill all input fields."
        );
        return;
      }

      const formData = new FormData();

      formData.append("full_name", profile.full_name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("location", profile.location);
      formData.append("job_title", profile.job_title);
      formData.append("experience", profile.experience);
      formData.append("about", profile.about);
      formData.append("dob", profile.dob);
      formData.append("gender", profile.gender);
      formData.append("linkedin", profile.linkedin);
      formData.append("portfolio", profile.portfolio);
      formData.append("github", profile.github);
      formData.append("current_salary", profile.current_salary);
      formData.append("expected_salary", profile.expected_salary);
      formData.append("notice_period", profile.notice_period);

      if (profilePhoto) {
        formData.append("profile_image", profilePhoto);
      }
      const response = await fetch(
        `${API}/api/profile/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          data?.error ||
          "Failed to update profile"
        );
      }

      showMessage(
        "success",
        "Success",
        "Profile updated successfully."
      );

    } catch (error) {
      console.error(error);

      showMessage(
        "error",
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };


  // ======================================================
  // CHANGE PASSWORD
  // ======================================================

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showMessage(
        "error",
        "Error",
        "Enter your current password."
      );

      return;
    }

    if (!newPassword) {
      showMessage(
        "error",
        "Error",
        "Enter a new password."
      );

      return;
    }

    if (newPassword.length < 8) {
      showMessage(
        "error",
        "Error",
        "New password must contain at least 8 characters."
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        "error",
        "Error",
        "New passwords do not match."
      );

      return;
    }

    try {
      setPasswordLoading(true);

      const token = getToken();

      const response = await fetch(
        `${API}/api/change-password/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          data?.error ||
          "Failed to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      showMessage(
        "success",
        "Success",
        "Password updated successfully."
      );

    } catch (error) {
      console.error(error);

      showMessage(
        "error",
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };


  // ======================================================
  // DELETE ACCOUNT
  // ======================================================

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);

      const token = getToken();

      if (!token) {
        showMessage(
          "error",
          "Error",
          "Please login first."
        );

        return;
      }

      const response = await fetch(`${API}/api/delete-account/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data =
        response.status !== 204
          ? await response.json()
          : {};

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          data?.error ||
          "Failed to delete account."
        );
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      window.location.href = "/login";

    } catch (error) {
      console.error(error);

      showMessage(
        "error",
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to delete account."
      );

      setDeleteDialogOpen(false);

    } finally {
      setDeleteLoading(false);
    }
  };


  const handleSavedJobs = () => {
    window.location.href = "/main/Saved_Job";
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }


  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="w-full space-y-6 pb-10">

      {/* ==================================================
          ACCOUNT SETTINGS
      ================================================== */}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">


        {/* ==================================================
            LEFT SETTINGS MENU
        ================================================== */}

        <div className="rounded-xl border bg-white p-3 shadow-sm h-[530px]">

          <div className="space-y-1">

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-600"
            >
              <User className="h-5 w-5" />
              Account Settings
            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <User className="h-5 w-5" />
              Profile Information
            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Lock className="h-5 w-5" />
              Change Password
            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Mail className="h-5 w-5" />
              Email Preferences
            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Bell className="h-5 w-5" />
              Notification Settings
            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Shield className="h-5 w-5" />
              Privacy Settings
            </button>


            <button
              type="button"
              onClick={handleSavedJobs}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Bookmark className="h-5 w-5" />
              Saved Jobs
            </button>


            <button
              type="button"
              onClick={() =>
                setDeleteDialogOpen(true)
              }
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
              Delete Account
            </button>

          </div>
        </div>


        {/* ==================================================
            RIGHT CONTENT
        ================================================== */}

        <div className="space-y-6">


          {/* ==================================================
              PERSONAL + ADDITIONAL INFORMATION
          ================================================== */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage your personal, professional and contact information.
                All fields are required.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[120px_1fr]">

              {/* PROFILE PHOTO */}

              <div className="flex flex-col items-center">

                <div className="relative">

                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-slate-50 text-3xl font-medium text-slate-500">

                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {profile.full_name
                          ? profile.full_name.charAt(0).toUpperCase()
                          : "V"}
                      </span>
                    )}

                  </div>

                  <label
                    htmlFor="profile-photo"
                    className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-slate-50"
                  >
                    <Camera className="h-4 w-4 text-slate-600" />

                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>

                </div>

                <label
                  htmlFor="profile-photo"
                  className="mt-3 cursor-pointer text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Change Photo
                </label>

                <p className="mt-1 text-center text-[11px] text-slate-400">
                  JPG, PNG or GIF.
                  <br />
                  Max size 2MB.
                </p>

              </div>

              {/* ALL PROFILE + ADDITIONAL FIELDS */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* FULL NAME */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="full_name">
                    Full Name
                  </RequiredLabel>

                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) =>
                      updateProfile("full_name", e.target.value)
                    }
                    placeholder="Enter full name"
                  />
                </div>

                {/* EMAIL */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="email">
                    Email Address
                  </RequiredLabel>

                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-slate-50"
                  />
                </div>

                {/* PHONE */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="phone">
                    Phone Number
                  </RequiredLabel>

                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      updateProfile("phone", e.target.value)
                    }
                    placeholder="+91 9876543210"
                  />
                </div>

                {/* LOCATION */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="location">
                    Location
                  </RequiredLabel>

                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) =>
                      updateProfile("location", e.target.value)
                    }
                    placeholder="Jaipur, Rajasthan, India"
                  />
                </div>

                {/* CURRENT JOB TITLE */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="job_title">
                    Current Job Title
                  </RequiredLabel>

                  <Input
                    id="job_title"
                    value={profile.job_title}
                    onChange={(e) =>
                      updateProfile(
                        "job_title",
                        e.target.value
                      )
                    }
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                {/* EXPERIENCE */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="experience">
                    Experience (Years)
                  </RequiredLabel>

                  <Select
                    value={profile.experience}
                    onValueChange={(value) =>
                      updateProfile("experience", value)
                    }
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

                {/* DATE OF BIRTH */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="dob">
                    Date of Birth
                  </RequiredLabel>

                  <Input
                    id="dob"
                    type="date"
                    value={profile.dob}
                    onChange={(e) =>
                      updateProfile("dob", e.target.value)
                    }
                  />
                </div>

                {/* GENDER */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="gender">
                    Gender
                  </RequiredLabel>

                  <Select
                    value={profile.gender}
                    onValueChange={(value) =>
                      updateProfile("gender", value)
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Male">
                        Male
                      </SelectItem>
                      <SelectItem value="Female">
                        Female
                      </SelectItem>
                      <SelectItem value="Other">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* LINKEDIN */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="linkedin">
                    LinkedIn Profile
                  </RequiredLabel>

                  <Input
                    id="linkedin"
                    value={profile.linkedin}
                    onChange={(e) =>
                      updateProfile(
                        "linkedin",
                        e.target.value
                      )
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                {/* PORTFOLIO */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="portfolio">
                    Portfolio / Website
                  </RequiredLabel>

                  <Input
                    id="portfolio"
                    value={profile.portfolio}
                    onChange={(e) =>
                      updateProfile(
                        "portfolio",
                        e.target.value
                      )
                    }
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                {/* GITHUB */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="github">
                    GitHub Profile
                  </RequiredLabel>

                  <Input
                    id="github"
                    value={profile.github}
                    onChange={(e) =>
                      updateProfile(
                        "github",
                        e.target.value
                      )
                    }
                    placeholder="https://github.com/username"
                  />
                </div>

                {/* CURRENT SALARY */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="current_salary">
                    Current Salary (Annual)
                  </RequiredLabel>

                  <Input
                    id="current_salary"
                    type="number"
                    value={profile.current_salary}
                    onChange={(e) =>
                      updateProfile(
                        "current_salary",
                        e.target.value
                      )
                    }
                    placeholder="e.g. 600000"
                  />
                </div>

                {/* EXPECTED SALARY */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="expected_salary">
                    Expected Salary (Annual)
                  </RequiredLabel>

                  <Input
                    id="expected_salary"
                    type="number"
                    value={profile.expected_salary}
                    onChange={(e) =>
                      updateProfile(
                        "expected_salary",
                        e.target.value
                      )
                    }
                    placeholder="e.g. 800000"
                  />
                </div>

                {/* NOTICE PERIOD */}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="notice_period">
                    Notice Period
                  </RequiredLabel>

                  <Select
                    value={profile.notice_period}
                    onValueChange={(value) =>
                      updateProfile("notice_period", value)
                    }
                  >
                    <SelectTrigger id="notice_period">
                      <SelectValue placeholder="Select notice period" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="immediate">
                        Immediate
                      </SelectItem>
                      <SelectItem value="15">
                        15 Days
                      </SelectItem>
                      <SelectItem value="30">
                        30 Days
                      </SelectItem>
                      <SelectItem value="60">
                        60 Days
                      </SelectItem>
                      <SelectItem value="90">
                        90 Days
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ABOUT */}

                <div className="space-y-2 md:col-span-2">
                  <RequiredLabel htmlFor="about">
                    About Me
                  </RequiredLabel>

                  <Textarea
                    id="about"
                    value={profile.about}
                    onChange={(e) =>
                      updateProfile("about", e.target.value)
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="Write a short summary about yourself, your experience and skills..."
                  />

                  <div className="text-right text-xs text-slate-400">
                    {profile.about.length}/500
                  </div>
                </div>

              </div>

            </div>

            {/* SAVE */}

            <div className="mt-6 flex justify-end">

              <Button
                onClick={handleSaveProfile}
                disabled={profileLoading}
                className="gap-2"
              >
                {profileLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {profileLoading
                  ? "Saving..."
                  : "Save Changes"}
              </Button>

            </div>

          </section>



          {/* ==================================================
              CHANGE PASSWORD
          ================================================== */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-slate-900">
                Change Password
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Make sure to use a strong password you don't use elsewhere.
              </p>

            </div>


            <div className="space-y-5">


              {/* CURRENT PASSWORD */}

              <div className="space-y-2">

                <Label>
                  Current Password
                </Label>

                <div className="relative">

                  <Input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter current password"
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >

                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}

                  </button>

                </div>

              </div>


              <div className="grid gap-5 md:grid-cols-2">


                {/* NEW PASSWORD */}

                <div className="space-y-2">

                  <Label>
                    New Password
                  </Label>

                  <div className="relative">

                    <Input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter new password"
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >

                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}

                    </button>

                  </div>

                </div>


                {/* CONFIRM PASSWORD */}

                <div className="space-y-2">

                  <Label>
                    Confirm New Password
                  </Label>

                  <div className="relative">

                    <Input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Confirm new password"
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >

                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}

                    </button>

                  </div>

                </div>

              </div>


              <div className="flex justify-end">

                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="gap-2"
                >

                  {passwordLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {passwordLoading
                    ? "Updating..."
                    : "Update Password"}

                </Button>

              </div>

            </div>

          </section>


          {/* ==================================================
              EMAIL PREFERENCES
          ================================================== */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-5">

              <h2 className="text-lg font-semibold text-slate-900">
                Email Preferences
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose what type of emails you want to receive.
              </p>

            </div>


            <div className="space-y-5">


              <SettingSwitch
                icon={<Briefcase className="h-5 w-5" />}
                title="Job Recommendations"
                description="Get emails about jobs that match your profile"
                checked={
                  settings.jobRecommendations
                }
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    jobRecommendations: value,
                  }))
                }
              />


              <SettingSwitch
                icon={<Bell className="h-5 w-5" />}
                title="Application Updates"
                description="Receive updates about your applications"
                checked={
                  settings.applicationUpdates
                }
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    applicationUpdates: value,
                  }))
                }
              />


              <SettingSwitch
                icon={<Mail className="h-5 w-5" />}
                title="Newsletter & Tips"
                description="Get tips and news to help you find a better job"
                checked={
                  settings.newsletter
                }
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    newsletter: value,
                  }))
                }
              />

            </div>

          </section>


          {/* ==================================================
              NOTIFICATION SETTINGS
          ================================================== */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-5">

              <h2 className="text-lg font-semibold text-slate-900">
                Notification Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage how you want to be notified.
              </p>

            </div>


            <div className="space-y-5">


              <SettingSwitch
                icon={<Bell className="h-5 w-5" />}
                title="Push Notifications"
                description="Receive push notifications in browser"
                checked={
                  settings.pushNotifications
                }
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    pushNotifications: value,
                  }))
                }
              />


              <SettingSwitch
                icon={<Briefcase className="h-5 w-5" />}
                title="Job Alerts"
                description="Get notified about new job alerts"
                checked={
                  settings.jobAlerts
                }
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    jobAlerts: value,
                  }))
                }
              />


              <SettingSwitch
                icon={<Shield className="h-5 w-5" />}
                title="Application Status"
                description="Get notified when your application status changes"
                checked={
                  settings.applicationStatus
                }
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    applicationStatus: value,
                  }))
                }
              />

            </div>

          </section>


          {/* ==================================================
              PRIVACY SETTINGS
          ================================================== */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-5">

              <h2 className="text-lg font-semibold text-slate-900">
                Privacy Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your privacy and profile visibility.
              </p>

            </div>


            <div className="space-y-5">


              {/* PROFILE VISIBILITY */}

              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                <div>

                  <p className="text-sm font-medium text-slate-800">
                    Profile Visibility
                  </p>

                  <p className="text-xs text-slate-500">
                    Choose who can view your profile
                  </p>

                </div>


                <Select
                  value={
                    settings.profileVisibility
                  }
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      profileVisibility: value,
                    }))
                  }
                >

                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="public">
                      Public
                    </SelectItem>

                    <SelectItem value="employers">
                      Employers Only
                    </SelectItem>

                    <SelectItem value="private">
                      Private
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>


              {/* EMAIL VISIBILITY */}

              <SettingSwitch
                icon={<Mail className="h-5 w-5" />}
                title="Show Email to Employers"
                description="Allow employers to view your email address"
                checked={
                  settings.showEmailToEmployers
                }
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    showEmailToEmployers: value,
                  }))
                }
              />

            </div>

          </section>


          {/* ==================================================
              SAVED JOBS
          ================================================== */}

          <section className="rounded-xl border bg-white p-5 shadow-sm">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-lg font-semibold text-slate-900">
                  Saved Jobs
                </h2>

                <p className="text-sm text-slate-500">
                  Manage your saved jobs and alerts.
                </p>

              </div>


              <Button
                variant="outline"
                onClick={handleSavedJobs}
                className="gap-2"
              >

                View Saved Jobs

                <span>→</span>

              </Button>

            </div>

          </section>


          {/* ==================================================
              DELETE ACCOUNT
          ================================================== */}

          <section className="rounded-xl border border-red-200 bg-red-50 p-5">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-lg font-semibold text-red-900">
                  Delete Account
                </h2>

                <p className="text-sm text-red-600">
                  Once you delete your account, there is no going back.
                  Please be certain.
                </p>

              </div>


              <Button
                variant="destructive"
                onClick={() =>
                  setDeleteDialogOpen(true)
                }
                className="gap-2"
              >

                <Trash2 className="h-4 w-4" />

                Delete My Account

              </Button>

            </div>

          </section>

        </div>

      </div>


      {/* ==================================================
          DELETE ACCOUNT DIALOG
      ================================================== */}

      <Toaster />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Delete your account?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. Your profile,
              applications, saved jobs and other account
              data may be permanently deleted.
            </AlertDialogDescription>

          </AlertDialogHeader>


          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={deleteLoading}
            >
              Cancel
            </AlertDialogCancel>


            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeleteAccount();
              }}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >

              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {deleteLoading
                ? "Deleting..."
                : "Yes, Delete Account"}

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>
  );
}


// ======================================================
// REUSABLE SWITCH COMPONENT
// ======================================================

interface SettingSwitchProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

function SettingSwitch({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
}: SettingSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">

      <div className="flex items-center gap-3">

        {icon && (
          <div className="text-slate-500">
            {icon}
          </div>
        )}

        <div>

          <p className="text-sm font-medium text-slate-800">
            {title}
          </p>

          <p className="text-xs text-slate-500">
            {description}
          </p>

        </div>

      </div>


      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />

    </div>
  );
}