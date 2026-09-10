
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

  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [unreadCount, setUnreadCount] = useState(0);

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // =====================================================
  // TOAST HELPER
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

        if (!token || !API) {
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

    fetchProfile();
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

          if (!token || !API) {
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

    fetchUnreadCount();
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

        if (!API) {
          showLoginToast(
            "error",
            "Configuration Error",
            "API URL is not configured."
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
      <header
        className="
          w-full
          border-b
          bg-white
          px-4
          py-4
          sm:px-5
          sm:py-5
          md:px-6
          lg:px-8
        "
      >
        <div
          className="
            flex
            w-full
            flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          {/* =================================================
              LEFT SECTION
          ================================================= */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <h1
              className="
                flex
                items-center
                gap-2
                text-xl
                font-bold
                leading-tight
                text-slate-900
                sm:text-2xl
              "
            >
              <span className="truncate">
                Welcome back,{" "}
                {user?.username || "Guest"}!
              </span>

              <PartyPopper
                className="
                  h-5
                  w-5
                  shrink-0
                  text-amber-400
                  sm:h-7
                  sm:w-7
                "
              />
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-5
                text-slate-500
                sm:text-base
                md:text-lg
              "
            >
              Here's what's happening
              with your job search today.
            </p>
          </div>

          {/* =================================================
              RIGHT SECTION
          ================================================= */}

          <div
            className="
              flex
              w-full
              min-w-0
              items-center
              gap-2
              sm:gap-3
              lg:w-auto
              lg:gap-5
              xl:gap-6
            "
          >
            {/* =================================================
                SEARCH
            ================================================= */}

            <div
              className="
                relative
                min-w-0
                flex-1
                sm:flex-none
                sm:w-[260px]
                md:w-[320px]
                lg:w-[300px]
                xl:w-[430px]
              "
            >
              <Search
                className="
                  absolute
                  right-3
                  top-1/2
                  h-5
                  w-5
                  -translate-y-1/2
                  text-slate-400
                  sm:right-4
                "
              />

              <Input
                placeholder="Search for jobs, companies..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border-slate-200
                  bg-slate-50
                  pl-4
                  pr-11
                  text-sm
                  focus-visible:ring-blue-500
                  sm:h-12
                  sm:rounded-2xl
                  sm:pl-5
                  sm:pr-12
                  sm:text-base
                  lg:h-14
                "
              />
            </div>

            {/* =================================================
                NOTIFICATION
            ================================================= */}

            <Button
              variant="ghost"
              size="icon"
              className="
                relative
                h-10
                w-10
                shrink-0
                rounded-full
                hover:bg-slate-100
                sm:h-11
                sm:w-11
              "
            >
              <Bell
                className="
                  h-5
                  w-5
                  text-slate-600
                  sm:h-6
                  sm:w-6
                "
              />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute
                    -right-0.5
                    -top-0.5
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-600
                    px-1
                    text-[10px]
                    font-semibold
                    text-white
                    sm:-right-1
                    sm:-top-1
                    sm:text-[11px]
                  "
                >
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </Button>

            {/* =================================================
                PROFILE
            ================================================= */}

            <div
              className="
                relative
                shrink-0
              "
            >
              {/* Profile Button */}

              <button
                type="button"
                onClick={() =>
                  setShowProfileMenu(
                    (prev) => !prev
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  px-1
                  py-1
                  transition
                  hover:bg-slate-100
                  sm:gap-3
                  sm:px-2
                "
              >
                {/* Avatar */}

                <div className="relative">
                  <Avatar
                    className="
                      h-10
                      w-10
                      sm:h-12
                      sm:w-12
                      md:h-14
                      md:w-14
                    "
                  >
                    <AvatarImage
                      src={getProfileImage()}
                      alt="Profile"
                    />

                    <AvatarFallback>
                      {getInitial()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Camera Icon */}

                  <span
                    className="
                      absolute
                      bottom-0
                      right-0
                      flex
                      h-4
                      w-4
                      items-center
                      justify-center
                      rounded-full
                      bg-blue-600
                      text-white
                      sm:h-5
                      sm:w-5
                    "
                  >
                    <Camera
                      className="
                        h-2.5
                        w-2.5
                        sm:h-3
                        sm:w-3
                      "
                    />
                  </span>
                </div>

                {/* User Info */}

                <div
                  className="
                    hidden
                    min-w-0
                    text-left
                    md:block
                  "
                >
                  <h3
                    className="
                      max-w-[140px]
                      truncate
                      font-semibold
                      text-slate-900
                      lg:max-w-[180px]
                    "
                  >
                    {user?.username ||
                      "Guest"}
                  </h3>

                  <p
                    className="
                      max-w-[140px]
                      truncate
                      text-sm
                      text-slate-500
                      lg:max-w-[180px]
                    "
                  >
                    {user?.email ||
                      "Candidate"}
                  </p>
                </div>

                <ChevronDown
                  className="
                    hidden
                    h-5
                    w-5
                    shrink-0
                    text-slate-500
                    md:block
                  "
                />
              </button>

              {/* =================================================
                  PROFILE DROPDOWN
              ================================================= */}

              {showProfileMenu && (
                <div
                  className="
                    absolute
                    right-0
                    top-[52px]
                    z-50
                    w-[calc(100vw-32px)]
                    max-w-72
                    rounded-xl
                    border
                    bg-white
                    p-3
                    shadow-xl
                    sm:top-[60px]
                    sm:w-72
                  "
                >
                  {/* Current Profile */}

                  <div
                    className="
                      mb-3
                      flex
                      min-w-0
                      items-center
                      gap-3
                      border-b
                      pb-3
                    "
                  >
                    <Avatar
                      className="
                        h-11
                        w-11
                        shrink-0
                        sm:h-12
                        sm:w-12
                      "
                    >
                      <AvatarImage
                        src={getProfileImage()}
                        alt="Profile"
                      />

                      <AvatarFallback>
                        {getInitial()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          font-semibold
                        "
                      >
                        {user?.username ||
                          "Guest"}
                      </p>

                      <p
                        className="
                          truncate
                          text-xs
                          text-slate-500
                        "
                      >
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>

                  {/* Hidden File Input */}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="
                      image/png,
                      image/jpeg,
                      image/jpg,
                      image/webp
                    "
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
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      transition
                      hover:bg-slate-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Camera className="h-4 w-4 shrink-0" />

                    <span>
                      {uploadingImage
                        ? "Uploading..."
                        : "Change profile photo"}
                    </span>
                  </button>
                </div>
              )}
            </div>
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
