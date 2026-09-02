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
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
  phone_number: string;
  location: string;
  current_job_title: string;
  experience_years: string;
  about_me: string;

  date_of_birth: string;
  gender: string;

  linkedin_profile: string;
  portfolio_website: string;
  github_profile: string;

  current_salary: string;
  expected_salary: string;
  notice_period: string;
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
    phone_number: "",
    location: "",
    current_job_title: "",
    experience_years: "",
    about_me: "",

    date_of_birth: "",
    gender: "",

    linkedin_profile: "",
    portfolio_website: "",
    github_profile: "",

    current_salary: "",
    expected_salary: "",
    notice_period: "",
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

  // ----------------------------------------------------
  // MESSAGE
  // ----------------------------------------------------

  const [message, setMessage] =
    React.useState("");

  const [messageType, setMessageType] =
    React.useState<MessageType>("");


  // ======================================================
  // TOKEN
  // ======================================================

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


  // ======================================================
  // MESSAGE
  // ======================================================

  const showMessage = (
    text: string,
    type: "success" | "error"
  ) => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
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
          "http://127.0.0.1:8000/api/profile/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

        const data = await response.json();

        setProfile({
          full_name:
            data.full_name ??
            data.name ??
            "",

          email:
            data.email ??
            "",

          phone_number:
            data.phone_number ??
            data.phone ??
            "",

          location:
            data.location ??
            "",

          current_job_title:
            data.current_job_title ??
            "",

          experience_years:
            data.experience_years != null
              ? String(data.experience_years)
              : "",

          about_me:
            data.about_me ??
            "",

          date_of_birth:
            data.date_of_birth ??
            "",

          gender:
            data.gender ??
            "",

          linkedin_profile:
            data.linkedin_profile ??
            "",

          portfolio_website:
            data.portfolio_website ??
            "",

          github_profile:
            data.github_profile ??
            "",

          current_salary:
            data.current_salary != null
              ? String(data.current_salary)
              : "",

          expected_salary:
            data.expected_salary != null
              ? String(data.expected_salary)
              : "",

          notice_period:
            data.notice_period ??
            "",
        });

        if (data.profile_photo) {
          setPhotoPreview(data.profile_photo);
        }

      } catch (error) {
        console.error(error);

        showMessage(
          "Failed to load profile.",
          "error"
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
        "Please select JPG, PNG or GIF image.",
        "error"
      );

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage(
        "Profile image must be less than 2MB.",
        "error"
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
          "Please login first.",
          "error"
        );

        return;
      }

      const formData = new FormData();

      formData.append(
        "full_name",
        profile.full_name
      );

      formData.append(
        "phone_number",
        profile.phone_number
      );

      formData.append(
        "location",
        profile.location
      );

      formData.append(
        "current_job_title",
        profile.current_job_title
      );

      formData.append(
        "experience_years",
        profile.experience_years
      );

      formData.append(
        "about_me",
        profile.about_me
      );

      formData.append(
        "date_of_birth",
        profile.date_of_birth
      );

      formData.append(
        "gender",
        profile.gender
      );

      formData.append(
        "linkedin_profile",
        profile.linkedin_profile
      );

      formData.append(
        "portfolio_website",
        profile.portfolio_website
      );

      formData.append(
        "github_profile",
        profile.github_profile
      );

      formData.append(
        "current_salary",
        profile.current_salary
      );

      formData.append(
        "expected_salary",
        profile.expected_salary
      );

      formData.append(
        "notice_period",
        profile.notice_period
      );

      if (profilePhoto) {
        formData.append(
          "profile_photo",
          profilePhoto
        );
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/profile/",
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
        "Profile updated successfully.",
        "success"
      );

    } catch (error) {
      console.error(error);

      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to update profile.",
        "error"
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
        "Enter your current password.",
        "error"
      );

      return;
    }

    if (!newPassword) {
      showMessage(
        "Enter a new password.",
        "error"
      );

      return;
    }

    if (newPassword.length < 8) {
      showMessage(
        "New password must contain at least 8 characters.",
        "error"
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        "New passwords do not match.",
        "error"
      );

      return;
    }

    try {
      setPasswordLoading(true);

      const token = getToken();

      const response = await fetch(
        "http://127.0.0.1:8000/api/change-password/",
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
        "Password updated successfully.",
        "success"
      );

    } catch (error) {
      console.error(error);

      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to change password.",
        "error"
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
          "Please login first.",
          "error"
        );

        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/account/delete/",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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
        error instanceof Error
          ? error.message
          : "Failed to delete account.",
        "error"
      );

      setDeleteDialogOpen(false);

    } finally {
      setDeleteLoading(false);
    }
  };


  // ======================================================
  // SAVED JOBS
  // ======================================================

  const handleSavedJobs = () => {
    window.location.href = "/main/saved-jobs";
  };


  // ======================================================
  // LOADING SCREEN
  // ======================================================

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
          GLOBAL MESSAGE
      ================================================== */}

      {message && (
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0" />
          )}

          <span>{message}</span>
        </div>
      )}


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
              PERSONAL INFORMATION
          ================================================== */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="text-xl font-semibold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your personal details and how others see you.
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
                          ? profile.full_name
                              .charAt(0)
                              .toUpperCase()
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


              {/* PROFILE FIELDS */}

              <div className="grid gap-5 md:grid-cols-2">


                {/* FULL NAME */}

                <div className="space-y-2">

                  <Label htmlFor="full_name">
                    Full Name
                  </Label>

                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) =>
                      updateProfile(
                        "full_name",
                        e.target.value
                      )
                    }
                    placeholder="Enter full name"
                  />

                </div>


                {/* EMAIL */}

                <div className="space-y-2">

                  <Label htmlFor="email">
                    Email Address
                  </Label>

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

                  <Label htmlFor="phone">
                    Phone Number
                  </Label>

                  <Input
                    id="phone"
                    value={profile.phone_number}
                    onChange={(e) =>
                      updateProfile(
                        "phone_number",
                        e.target.value
                      )
                    }
                    placeholder="+91 9876543210"
                  />

                </div>


                {/* LOCATION */}

                <div className="space-y-2">

                  <Label htmlFor="location">
                    Location
                  </Label>

                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) =>
                      updateProfile(
                        "location",
                        e.target.value
                      )
                    }
                    placeholder="Jaipur, Rajasthan, India"
                  />

                </div>


                {/* JOB TITLE */}

                <div className="space-y-2">

                  <Label htmlFor="job-title">
                    Current Job Title
                  </Label>

                  <Input
                    id="job-title"
                    value={profile.current_job_title}
                    onChange={(e) =>
                      updateProfile(
                        "current_job_title",
                        e.target.value
                      )
                    }
                    placeholder="e.g. Software Engineer"
                  />

                </div>


                {/* EXPERIENCE */}

                <div className="space-y-2">

                  <Label>
                    Experience (Years)
                  </Label>

                  <Select
                    value={profile.experience_years}
                    onValueChange={(value) =>
                      updateProfile(
                        "experience_years",
                        value
                      )
                    }
                  >

                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="0">
                        Fresher
                      </SelectItem>

                      <SelectItem value="1">
                        1 Year
                      </SelectItem>

                      <SelectItem value="2">
                        2 Years
                      </SelectItem>

                      <SelectItem value="3">
                        3 Years
                      </SelectItem>

                      <SelectItem value="4">
                        4 Years
                      </SelectItem>

                      <SelectItem value="5">
                        5+ Years
                      </SelectItem>

                      <SelectItem value="10">
                        10+ Years
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>


                {/* ABOUT */}

                <div className="space-y-2 md:col-span-2">

                  <Label htmlFor="about">
                    About Me
                  </Label>

                  <Textarea
                    id="about"
                    value={profile.about_me}
                    onChange={(e) =>
                      updateProfile(
                        "about_me",
                        e.target.value
                      )
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="Write a short summary about yourself, your experience and skills..."
                  />

                  <div className="text-right text-xs text-slate-400">
                    {profile.about_me.length}/500
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
              ADDITIONAL INFORMATION
          ================================================== */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-slate-900">
                Additional Information
              </h2>

            </div>


            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">


              {/* DOB */}

              <div className="space-y-2">

                <Label htmlFor="dob">
                  Date of Birth
                </Label>

                <Input
                  id="dob"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) =>
                    updateProfile(
                      "date_of_birth",
                      e.target.value
                    )
                  }
                />

              </div>


              {/* GENDER */}

              <div className="space-y-2">

                <Label>
                  Gender
                </Label>

                <Select
                  value={profile.gender}
                  onValueChange={(value) =>
                    updateProfile(
                      "gender",
                      value
                    )
                  }
                >

                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="male">
                      Male
                    </SelectItem>

                    <SelectItem value="female">
                      Female
                    </SelectItem>

                    <SelectItem value="other">
                      Other
                    </SelectItem>

                    <SelectItem value="prefer_not_to_say">
                      Prefer not to say
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>


              {/* LINKEDIN */}

              <div className="space-y-2">

                <Label htmlFor="linkedin">
                  LinkedIn Profile
                </Label>

                <Input
                  id="linkedin"
                  value={profile.linkedin_profile}
                  onChange={(e) =>
                    updateProfile(
                      "linkedin_profile",
                      e.target.value
                    )
                  }
                  placeholder="https://linkedin.com/in/yourprofile"
                />

              </div>


              {/* PORTFOLIO */}

              <div className="space-y-2">

                <Label htmlFor="portfolio">
                  Portfolio / Website
                </Label>

                <Input
                  id="portfolio"
                  value={profile.portfolio_website}
                  onChange={(e) =>
                    updateProfile(
                      "portfolio_website",
                      e.target.value
                    )
                  }
                  placeholder="https://yourwebsite.com"
                />

              </div>


              {/* GITHUB */}

              <div className="space-y-2">

                <Label htmlFor="github">
                  GitHub Profile
                </Label>

                <Input
                  id="github"
                  value={profile.github_profile}
                  onChange={(e) =>
                    updateProfile(
                      "github_profile",
                      e.target.value
                    )
                  }
                  placeholder="https://github.com/username"
                />

              </div>


              {/* CURRENT SALARY */}

              <div className="space-y-2">

                <Label htmlFor="current-salary">
                  Current Salary (Annual)
                </Label>

                <Input
                  id="current-salary"
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

                <Label htmlFor="expected-salary">
                  Expected Salary (Annual)
                </Label>

                <Input
                  id="expected-salary"
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

                <Label>
                  Notice Period
                </Label>

                <Select
                  value={profile.notice_period}
                  onValueChange={(value) =>
                    updateProfile(
                      "notice_period",
                      value
                    )
                  }
                >

                  <SelectTrigger>
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