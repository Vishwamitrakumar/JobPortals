"use client";

import Link from "next/link";
import { usePathname , useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  FileText,
  Heart,
  CalendarDays,
  User,
  FileBadge,
  Bell,
  Settings,
  Search,
  Building2,
  CircleHelp,
  LogOut,
  Upload,
  Menu,
  Bookmark
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import axios from "axios";


const menu = [
  { title: "Dashboard", href: "/main/dashboard", icon: LayoutDashboard },
  { title: "My Applications", href: "/main/MyApplication", icon: FileText },
  { title: "Job Post", href: "/main/Jobpost", icon: BriefcaseBusiness },
  { title: "Applicants", href: "/main/Applicants", icon: BriefcaseBusiness },
  { title: "Saved", href: "/main/Saved_Job", icon: Bookmark },
  { title: "Profile", href: "/main/Profile", icon: User },
  { title: "Resume", href: "/main/Resume", icon: FileBadge },
  { title: "Notifications", href: "/main/Notifications", icon: Bell },
  { title: "Settings", href: "/main/Setting", icon: Settings },
];

const pages = [
 
  { title: "Companies", href: "/main/Company", icon: Building2 },
  { title: "Help Center", href: "/main/HelpCenter", icon: CircleHelp },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;
  // Logout Function
  const handleLogout = async () => {
    try {
      const access = localStorage.getItem("access");
      const refresh = localStorage.getItem("refresh");

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
      console.log("Logout Error:", error);
    } finally {
      // Token remove karo
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      // Login page par redirect
      router.push("/login");
    }
  };

  return (
    <div className="flex h-full flex-col bg-white px-6 py-7 overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
          <BriefcaseBusiness className="h-6 w-6 text-white" />
        </div>

        <h1 className="text-2xl font-bold">
          Job<span className="text-blue-600">Portal</span>
        </h1>
      </div>

      {/* Main Menu */}
      <div className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.title} href={item.href}>
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-all",
                  pathname === item.href
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <hr className="my-8" />

      <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400">
        PAGES
      </p>

      <div className="space-y-2">
        {pages.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.title} href={item.href}>
              <div className="flex items-center gap-4 rounded-xl px-4 py-3 text-slate-500 transition hover:bg-slate-100">
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <button
        type="button"
         onClick={handleLogout}
        className="mt-2 flex items-center gap-4 rounded-xl px-4 py-3 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>

      {/* Upload Resume */}
      <div className="mt-auto pt-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>

          <h3 className="text-lg font-semibold">
            Upload your resume
          </h3>

          <p className="mt-2 mb-5 text-sm text-slate-500">
            Get better job recommendations
          </p>

          <Button className="w-full rounded-xl">
            Upload Resume
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <>
      {/* Mobile Button */}
      {/* Mobile Sidebar */}
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

    <SheetContent side="left" className="w-[290px] p-0">
      <SidebarContent />
    </SheetContent>
  </Sheet>
</div>

{/* Desktop Sidebar */}
<aside className="hidden lg:flex h-screen w-[290px] border-r bg-white">
  <SidebarContent />
</aside>
    </>
  );
}