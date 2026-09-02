"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Hand,
  PartyPopper
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type User = {
  username: string;
  email: string;
  first_name?: string;
};

export default function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("Stored user data:", storedUser); // Debugging line

    if (storedUser && storedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(storedUser) as User;

        if (parsedUser && typeof parsedUser === "object") {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Invalid user data:", error);
      }
    }
  }, []);

  const API = process.env.NEXT_PUBLIC_API;

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("access");

        if (!token) {
          setUnreadCount(0);
          return;
        }

        const res = await fetch(
          `${API}/api/notifications/unread-count/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          console.error("Unread notification error:", res.status);
          return;
        }

        const data = await res.json();

        setUnreadCount(data.unread_count || 0);

      } catch (error) {
        console.error("Failed to fetch unread notifications:", error);
      }
    };

    fetchUnreadCount();
  }, []);

  return (
    <header className="flex items-center justify-between border-b px-8 py-5">

      {/* Left */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          Welcome back, {user?.username || "Guest"}!
          <PartyPopper className="h-7 w-7 text-amber-400" />
        </h1>

        <p className="mt-2 text-lg text-slate-500">
          Here's what's happening with your job search today.
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">

        {/* Search */}
        <div className="relative w-[430px]">
          <Search className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <Input
            placeholder="Search for jobs, companies..."
            className="h-14 rounded-2xl border-slate-200 bg-slate-50 pl-5 pr-14 text-base focus-visible:ring-blue-500"
          />
        </div>

        {/* Notification */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-slate-100"
        >
          <Bell className="h-6 w-6 text-slate-600" />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>

        {/* Profile */}
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-slate-100"
        >
          <Avatar className="h-14 w-14">
            <AvatarImage src="/avatar.png" />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase() || "G"}
            </AvatarFallback>
          </Avatar>

          <div className="text-left">
            <h3 className="font-semibold text-slate-900">
              {user?.username || "Guest"}
            </h3>

            <p className="text-sm text-slate-500">
              {user?.email || "Candidate"}
            </p>
          </div>

          <ChevronDown className="h-5 w-5 text-slate-500" />
        </button>
      </div>
    </header>
  );
}