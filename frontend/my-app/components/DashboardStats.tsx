"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarCheck2,
  Bookmark,
  UserCheck,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API;

export default function DashboardStats({
  onReady,
}: {
  onReady?: () => void;
}) {
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    saved_jobs: 0,
    shortlisted: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("access");

        const response = await fetch(
          `${API_BASE}/api/dashboard/stats/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setLoading(false);
        onReady?.();
      }
    };

    fetchDashboardStats();
  }, [onReady]);

  const cards = [
    {
      title: "Applications",
      value: stats.applications,
      icon: BriefcaseBusiness,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      topBorder: "border-t-blue-500",
    },
    {
      title: "Interviews",
      value: stats.interviews,
      icon: CalendarCheck2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      topBorder: "border-t-green-500",
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted,
      icon: UserCheck,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      topBorder: "border-t-orange-500",
    },
    {
      title: "Saved Jobs",
      value: stats.saved_jobs,
      icon: Bookmark,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      topBorder: "border-t-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-6 xl:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className={`
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              border-t-2
              ${item.topBorder}
              bg-white
              py-0
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-md
            `}
          >
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-3 sm:gap-4">

                {/* Icon */}
                <div
                  className={`
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    sm:h-12
                    sm:w-12
                    lg:h-14
                    lg:w-14
                    ${item.iconBg}
                  `}
                >
                  <Icon
                    className={`
                      h-5
                      w-5
                      sm:h-6
                      sm:w-6
                      lg:h-7
                      lg:w-7
                      ${item.iconColor}
                    `}
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl lg:text-3xl">
                    {loading ? "..." : item.value}
                  </h2>

                  <p className="mt-0.5 truncate text-xs font-medium text-slate-600 sm:text-sm lg:text-base">
                    {item.title}
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}