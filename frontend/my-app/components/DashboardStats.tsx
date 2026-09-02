"use client";

import {
  BriefcaseBusiness,
  CalendarCheck2,
  Bookmark,
  Eye,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const stats = [
  {
    title: "Applications",
    value: "24",
    icon: BriefcaseBusiness,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    change: "12% this month",
    positive: true,
  },
  {
    title: "Interviews",
    value: "5",
    icon: CalendarCheck2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    change: "25% this month",
    positive: true,
  },
  {
    title: "Saved Jobs",
    value: "8",
    icon: Bookmark,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    change: "10% this month",
    positive: true,
  },
  {
    title: "Profile Views",
    value: "3",
    icon: Eye,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    change: "8% this month",
    positive: false,
  },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-6 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 lg:p-6"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 lg:h-14 lg:w-14 ${item.iconBg}`}
              >
                <Icon
                  className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 ${item.iconColor}`}
                />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl lg:text-3xl">
                  {item.value}
                </h2>

                <p className="mt-0.5 truncate text-xs font-medium text-slate-600 sm:text-sm lg:text-base">
                  {item.title}
                </p>

                <div
                  className={`mt-1.5 flex items-center gap-1 text-[11px] sm:mt-2 sm:text-xs lg:text-sm ${
                    item.positive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {item.positive ? (
                    <ArrowUp className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                  ) : (
                    <ArrowDown className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                  )}
                  <span className="truncate">{item.change}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}