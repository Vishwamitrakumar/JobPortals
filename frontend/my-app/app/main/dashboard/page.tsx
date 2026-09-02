"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import DashboardStats from "@/components/DashboardStats";
import Dashboardinterview from "@/components/Dashboardinterview";
import DashboardBottom from "@/components/DashboardBottom";

export default function DashboardPage() {

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.replace("/login");
    }
  }, []);
  
  return (
    <div className="space-y-6 px-3 sm:space-y-8 sm:px-4 lg:px-6">
      <DashboardStats />

      <Dashboardinterview />

      <DashboardBottom />
    </div>
  );
}