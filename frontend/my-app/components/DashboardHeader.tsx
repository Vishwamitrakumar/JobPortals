"use client";

import { useEffect, useRef, useState } from "react";

import {
  Search,
  Bell,
  ChevronDown,
  PartyPopper,
  Camera,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";

import {
  Toaster,
  toast,
} from "@/components/ui/toast";

type User = {
  username: string;
  email: string;
  first_name?: string;
};

type Profile = {
  profile_image?: string | null;
  full_name?: string;
  email?: string;
};

export default function DashboardHeader() {
  const API = process.env.NEXT_PUBLIC_API;

  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // =====================================================
  // TOAST HELPER
  // Same pattern as LoginForm
  // =====================================================

  const showLoginToast = (
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

  // =====================================================
  // GET USER FROM LOCAL STORAGE
  // =====================================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    console.log(
      "Stored user data:",
      storedUser
    );

    if (
      storedUser &&
      storedUser !== "undefined"
    ) {
      try {
        const parsedUser =
          JSON.parse(storedUser) as User;

        if (
          parsedUser &&
          typeof parsedUser === "object"
        ) {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error(
          "Invalid user data:",
          error
        );
      }
    }
  }, []);

  // =====================================================
  // GET CURRENT USER PROFILE
  // =====================================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          localStorage.getItem("access");

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API}/api/profile/`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!response.ok) {
          console.error(
            "Profile fetch error:",
            response.status
          );

          return;
        }

        const data =
          await response.json();

        console.log(
          "Profile API response:",
          data
        );

        setProfile(
          data.profile || data
        );
      } catch (error) {
        console.error(
          "Failed to fetch profile:",
          error
        );
      }
    };

    if (API) {
      fetchProfile();
    }
  }, [API]);

  // =====================================================
  // PROFILE IMAGE URL
  // =====================================================

  const getProfileImage = () => {
    if (
      !profile?.profile_image
    ) {
      return undefined;
    }

    // Complete URL
    if (
      profile.profile_image.startsWith(
        "http"
      )
    ) {
      return profile.profile_image;
    }

    // Relative media path
    return `${API}${
      profile.profile_image.startsWith("/")
        ? ""
        : "/"
    }${profile.profile_image}`;
  };

  // =====================================================
  // UNREAD NOTIFICATION COUNT
  // =====================================================

  useEffect(() => {
    const fetchUnreadCount =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "access"
            );

          if (!token) {
            setUnreadCount(0);
            return;
          }

          const response =
            await fetch(
              `${API}/api/notifications/unread-count/`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  "Content-Type":
                    "application/json",
                },
              }
            );

          if (!response.ok) {
            console.error(
              "Unread notification error:",
              response.status
            );

            return;
          }

          const data =
            await response.json();

          setUnreadCount(
            data.unread_count || 0
          );
        } catch (error) {
          console.error(
            "Failed to fetch unread notifications:",
            error
          );
        }
      };

    if (API) {
      fetchUnreadCount();
    }
  }, [API]);

  // =====================================================
  // OPEN FILE SELECTOR
  // =====================================================

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  // =====================================================
  // PROFILE IMAGE UPLOAD
  // =====================================================

  const handleProfileImageChange =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      // =================================================
      // IMAGE TYPE VALIDATION
      // =================================================

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        showLoginToast(
          "error",
          "Invalid File",
          "Please select a valid image file."
        );

        return;
      }

      // =================================================
      // IMAGE SIZE VALIDATION
      // =================================================

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        showLoginToast(
          "error",
          "Image Too Large",
          "Image size should be less than 5 MB."
        );

        return;
      }

      try {
        setUploadingImage(true);

        const token =
          localStorage.getItem(
            "access"
          );

        // =================================================
        // TOKEN CHECK
        // =================================================

        if (!token) {
          showLoginToast(
            "error",
            "Authentication Required",
            "Please login again."
          );

          return;
        }

        // =================================================
        // FORM DATA
        // =================================================

        const formData =
          new FormData();

        formData.append(
          "profile_image",
          file
        );

        // =================================================
        // API REQUEST
        // =================================================

        const response =
          await fetch(
            `${API}/api/profile/`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: formData,
            }
          );

        const data =
          await response.json();

        console.log(
          "Profile image upload response:",
          data
        );

        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {
          console.error(
            "Profile image upload error:",
            data
          );

          showLoginToast(
            "error",
            "Upload Failed",
            data?.errors
              ?.profile_image?.[0] ||
              data?.message ||
              "Failed to update profile image."
          );

          return;
        }

        // =================================================
        // UPDATE PROFILE
        // =================================================

        const updatedProfile =
          data.profile || data;

        setProfile(
          updatedProfile
        );

        // =================================================
        // SUCCESS
        // =================================================

        showLoginToast(
          "success",
          "Success",
          "Profile photo updated successfully."
        );

        // Close dropdown
        setShowProfileMenu(false);

      } catch (error) {
        console.error(
          "Profile image upload failed:",
          error
        );

        showLoginToast(
          "error",
          "Server Error",
          "Something went wrong while uploading profile photo."
        );
      } finally {
        setUploadingImage(false);

        // Reset file input
        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }
      }
    };

  // =====================================================
  // FALLBACK INITIAL
  // =====================================================

  const getInitial = () => {
    if (user?.username) {
      return user.username
        .charAt(0)
        .toUpperCase();
    }

    if (user?.first_name) {
      return user.first_name
        .charAt(0)
        .toUpperCase();
    }

    return "G";
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <header className="flex items-center justify-between border-b px-8 py-5">

        {/* =================================================
            LEFT
        ================================================= */}

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">

            Welcome back,{" "}
            {user?.username ||
              "Guest"}!

            <PartyPopper className="h-7 w-7 text-amber-400" />

          </h1>

          <p className="mt-2 text-lg text-slate-500">
            Here's what's happening
            with your job search today.
          </p>
        </div>

        {/* =================================================
            RIGHT
        ================================================= */}

        <div className="flex items-center gap-6">

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="relative w-[430px]">

            <Search
              className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />

            <Input
              placeholder="Search for jobs, companies..."
              className="h-14 rounded-2xl border-slate-200 bg-slate-50 pl-5 pr-14 text-base focus-visible:ring-blue-500"
            />

          </div>

          {/* =================================================
              NOTIFICATION
          ================================================= */}

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-slate-100"
          >

            <Bell className="h-6 w-6 text-slate-600" />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">

                {unreadCount > 99
                  ? "99+"
                  : unreadCount}

              </span>
            )}

          </Button>

          {/* =================================================
              PROFILE
          ================================================= */}

          <div className="relative">

            {/* Profile Button */}

            <button
              type="button"
              onClick={() =>
                setShowProfileMenu(
                  (prev) => !prev
                )
              }
              className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-slate-100"
            >

              {/* Avatar */}

              <div className="relative">

                <Avatar className="h-14 w-14">

                  <AvatarImage
                    src={getProfileImage()}
                    alt="Profile"
                  />

                  <AvatarFallback>
                    {getInitial()}
                  </AvatarFallback>

                </Avatar>

                {/* Camera Icon */}

                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">

                  <Camera className="h-3 w-3" />

                </span>

              </div>

              {/* User Info */}

              <div className="text-left">

                <h3 className="font-semibold text-slate-900">
                  {user?.username ||
                    "Guest"}
                </h3>

                <p className="text-sm text-slate-500">
                  {user?.email ||
                    "Candidate"}
                </p>

              </div>

              <ChevronDown className="h-5 w-5 text-slate-500" />

            </button>

            {/* =================================================
                PROFILE DROPDOWN
            ================================================= */}

            {showProfileMenu && (
              <div className="absolute right-0 top-[68px] z-50 w-64 rounded-xl border bg-white p-3 shadow-lg">

                {/* Current Profile */}

                <div className="mb-3 flex items-center gap-3 border-b pb-3">

                  <Avatar className="h-12 w-12">

                    <AvatarImage
                      src={getProfileImage()}
                      alt="Profile"
                    />

                    <AvatarFallback>
                      {getInitial()}
                    </AvatarFallback>

                  </Avatar>

                  <div className="min-w-0">

                    <p className="truncate font-semibold">
                      {user?.username ||
                        "Guest"}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user?.email || ""}
                    </p>

                  </div>

                </div>

                {/* Hidden File Input */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={
                    handleProfileImageChange
                  }
                />

                {/* Change Profile Photo */}

                <button
                  type="button"
                  onClick={
                    handleChangePhoto
                  }
                  disabled={
                    uploadingImage
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Camera className="h-4 w-4" />

                  {uploadingImage
                    ? "Uploading..."
                    : "Change profile photo"}

                </button>

              </div>
            )}

          </div>

        </div>

      </header>

      {/* =====================================================
          TOASTER
      ===================================================== */}

      <Toaster />
    </>
  );
}