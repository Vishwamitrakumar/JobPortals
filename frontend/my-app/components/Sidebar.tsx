"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  BriefcaseBusiness,
  LayoutDashboard,
  FileText,
  User,
  FileBadge,
  Bell,
  Settings,
  Building2,
  CircleHelp,
  LogOut,
  Upload,
  Menu,
  Bookmark,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import axios from "axios";

// 🔥 Resume Context
import { useResume } from "@/components/context/ResumeContext";


// --------------------------------------------------
// MENU
// --------------------------------------------------

const menu = [
  {
    title: "Dashboard",
    href: "/main/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Applications",
    href: "/main/MyApplication",
    icon: FileText,
  },
  {
    title: "Job Post",
    href: "/main/Jobpost",
    icon: BriefcaseBusiness,
  },
  {
    title: "Applicants",
    href: "/main/Applicants",
    icon: BriefcaseBusiness,
  },
  {
    title: "Saved",
    href: "/main/Saved_Job",
    icon: Bookmark,
  },
  {
    title: "Profile",
    href: "/main/Profile",
    icon: User,
  },
  {
    title: "Resume",
    href: "/main/Resume",
    icon: FileBadge,
  },
  {
    title: "Notifications",
    href: "/main/Notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    href: "/main/Setting",
    icon: Settings,
  },
];


// --------------------------------------------------
// PAGES
// --------------------------------------------------

const pages = [
  {
    title: "Companies",
    href: "/main/Company",
    icon: Building2,
  },
  {
    title: "Help Center",
    href: "/main/HelpCenter",
    icon: CircleHelp,
  },
];


// --------------------------------------------------
// GET FILE NAME
// --------------------------------------------------

function getFileNameFromUrl(url: string | undefined) {
  if (!url) return "";

  try {
    return decodeURIComponent(
      url.split("?")[0].split("/").pop() || ""
    );
  } catch {
    return "Resume.pdf";
  }
}


// --------------------------------------------------
// SIDEBAR CONTENT
// --------------------------------------------------

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API;

  // ------------------------------------------------
  // RESUME CONTEXT
  // ------------------------------------------------

  const {
    resume,
    refreshResume,
  } = useResume();


  // ------------------------------------------------
  // UPLOAD STATE
  // ------------------------------------------------

  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // ------------------------------------------------
  // RESUME BUTTON
  // ------------------------------------------------

  const handleResumeClick = () => {
    fileInputRef.current?.click();
  };


  // ------------------------------------------------
  // UPLOAD / UPDATE RESUME
  // ------------------------------------------------

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;


    // ----------------------------------------------
    // PDF VALIDATION
    // ----------------------------------------------

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      console.log("Only PDF files are allowed");

      // input reset
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }


    // ----------------------------------------------
    // FORM DATA
    // ----------------------------------------------

    const formData = new FormData();

    formData.append("resume", file);


    // ----------------------------------------------
    // ACCESS TOKEN
    // ----------------------------------------------

    const access = localStorage.getItem("access");


    try {
      setUploading(true);


      // --------------------------------------------
      // UPDATE EXISTING RESUME
      // --------------------------------------------

      if (resume) {
        await axios.put(
          `${API}/api/resume-upload/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${access}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }


      // --------------------------------------------
      // UPLOAD NEW RESUME
      // --------------------------------------------

      else {
        await axios.post(
          `${API}/api/resume-upload/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${access}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }


      // --------------------------------------------
      // 🔥 UPDATE RESUME CONTEXT
      // --------------------------------------------

      await refreshResume();


      console.log(
        "Resume uploaded/updated successfully"
      );

    } catch (error) {
      console.log(
        "Resume Upload Error:",
        error
      );

    } finally {
      setUploading(false);


      // --------------------------------------------
      // RESET FILE INPUT
      // --------------------------------------------

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  // ------------------------------------------------
  // RESUME FILE NAME
  // ------------------------------------------------

  const resumeFileName = resume
    ? getFileNameFromUrl(resume.file)
    : "";


  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

  const handleLogout = async () => {
    try {
      const access =
        localStorage.getItem("access");

      const refresh =
        localStorage.getItem("refresh");


      await axios.post(
        `${API}/api/logout/`,
        {
          refresh: refresh,
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

    } catch (error) {
      console.log(
        "Logout Error:",
        error
      );

    } finally {

      // Remove tokens
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");


      // Redirect login
      router.push("/login");
    }
  };


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <div className="flex h-full flex-col bg-white px-6 py-7 overflow-y-auto">

      {/* ----------------------------------------- */}
      {/* LOGO */}
      {/* ----------------------------------------- */}

      <div className="flex items-center gap-3 mb-10">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">

          <BriefcaseBusiness
            className="h-6 w-6 text-white"
          />

        </div>


        <h1 className="text-2xl font-bold">

          Job
          <span className="text-blue-600">
            Portal
          </span>

        </h1>

      </div>


      {/* ----------------------------------------- */}
      {/* MAIN MENU */}
      {/* ----------------------------------------- */}

      <div className="space-y-2">

        {menu.map((item) => {

          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
            >

              <div
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-all",

                  pathname === item.href
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >

                <Icon className="h-5 w-5" />

                <span>
                  {item.title}
                </span>

              </div>

            </Link>
          );
        })}

      </div>


      {/* ----------------------------------------- */}
      {/* SEPARATOR */}
      {/* ----------------------------------------- */}

      <hr className="my-8" />


      {/* ----------------------------------------- */}
      {/* PAGES */}
      {/* ----------------------------------------- */}

      <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400">

        PAGES

      </p>


      <div className="space-y-2">

        {pages.map((item) => {

          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
            >

              <div className="flex items-center gap-4 rounded-xl px-4 py-3 text-slate-500 transition hover:bg-slate-100">

                <Icon className="h-5 w-5" />

                <span>
                  {item.title}
                </span>

              </div>

            </Link>
          );
        })}

      </div>


      {/* ----------------------------------------- */}
      {/* LOGOUT */}
      {/* ----------------------------------------- */}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 flex items-center gap-4 rounded-xl px-4 py-3 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
      >

        <LogOut className="h-5 w-5" />

        Logout

      </button>


      {/* ----------------------------------------- */}
      {/* UPLOAD RESUME */}
      {/* ----------------------------------------- */}

      <div className="mt-auto pt-8">

        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-center">


          {/* Upload Icon */}

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">

            <Upload className="h-8 w-8 text-blue-600" />

          </div>


          {/* Title */}

          <h3 className="text-lg font-semibold">

            {resume
              ? "Your resume is uploaded"
              : "Upload your resume"}

          </h3>


          {/* File Name */}

          <p
            className="mt-2 mb-5 text-sm text-slate-500 truncate"
            title={resumeFileName}
          >

            {resume
              ? resumeFileName
              : "Get better job recommendations"}

          </p>


          {/* ------------------------------------- */}
          {/* HIDDEN FILE INPUT */}
          {/* ------------------------------------- */}

          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />


          {/* ------------------------------------- */}
          {/* UPLOAD BUTTON */}
          {/* ------------------------------------- */}

          <Button
            className="w-full rounded-xl"
            onClick={handleResumeClick}
            disabled={uploading}
          >

            {uploading
              ? "Uploading..."
              : resume
                ? "Update Resume"
                : "Upload Resume"}

          </Button>

        </div>

      </div>

    </div>
  );
}


// --------------------------------------------------
// SIDEBAR
// --------------------------------------------------

export default function Sidebar() {

  return (
    <>

      {/* ========================================== */}
      {/* MOBILE SIDEBAR */}
      {/* ========================================== */}

      <div className="lg:hidden">

        <Sheet>

          <SheetTrigger
            render={
              <button
                type="button"
                className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-md hover:bg-slate-100"
              >

                <Menu className="h-5 w-5" />

              </button>
            }
          />


          <SheetContent
            side="left"
            className="w-[290px] p-0"
          >

            <SidebarContent />

          </SheetContent>

        </Sheet>

      </div>


      {/* ========================================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================== */}

      <aside className="hidden lg:flex h-screen w-[290px] border-r bg-white">

        <SidebarContent />

      </aside>

    </>
  );
}