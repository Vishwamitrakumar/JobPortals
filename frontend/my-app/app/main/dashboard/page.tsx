"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import DashboardStats from "@/components/DashboardStats";
import Dashboardinterview from "@/components/Dashboardinterview";
import DashboardBottom from "@/components/DashboardBottom";
import JobChatbot from "@/components/JobChatbot";

export default function DashboardPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  const [readySections, setReadySections] = useState({
    stats: false,
    interview: false,
    bottom: false,
  });

  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // ==========================================================
  // DASHBOARD LOADING
  // ==========================================================

  useEffect(() => {
    setIsLoading(
      !(
        readySections.stats &&
        readySections.interview &&
        readySections.bottom
      )
    );
  }, [readySections]);

  // ==========================================================
  // SECTION READY
  // ==========================================================

  const markSectionReady = (
    section: keyof typeof readySections
  ) => {
    setReadySections((prev) => {
      if (prev[section]) {
        return prev;
      }

      return {
        ...prev,
        [section]: true,
      };
    });
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="relative min-h-[60vh] space-y-6 px-3 sm:space-y-8 sm:px-4 lg:px-6">

      {/* ======================================================
          DASHBOARD LOADER
      ====================================================== */}

      {isLoading && (
        <div
          className="
            absolute
            inset-0
            z-20

            flex
            items-center
            justify-center

            bg-white/70
            backdrop-blur-[1px]
          "
        >
          <div
            className="
              flex
              items-center
              gap-3

              rounded-xl
              border
              border-slate-200
              bg-white

              px-5
              py-4

              shadow-sm
            "
          >
            <Loader2
              className="
                h-5
                w-5
                animate-spin
                text-blue-600
              "
            />

            <span className="text-sm font-medium text-slate-600">
              Loading dashboard data...
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
          DASHBOARD SECTIONS
      ====================================================== */}

      <DashboardStats
        onReady={() => markSectionReady("stats")}
      />

      <Dashboardinterview
        onReady={() => markSectionReady("interview")}
      />

      <DashboardBottom
        onReady={() => markSectionReady("bottom")}
      />


      <JobChatbot />

    </div>
  );
}