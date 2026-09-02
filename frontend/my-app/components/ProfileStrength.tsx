"use client";

import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ProfileStrength() {
  return (
    <Card className="rounded-2xl p-6">

      <h2 className="font-semibold text-lg">
        Profile Strength
      </h2>

      <div className="flex mt-6 gap-8">

        <div className="relative h-32 w-32">

          <svg className="rotate-[-90deg]" viewBox="0 0 100 100">

            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />

            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#2563EB"
              strokeWidth="8"
              fill="none"
              strokeDasharray="264"
              strokeDashoffset="66"
              strokeLinecap="round"
            />

          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <h2 className="text-3xl font-bold">
              75%
            </h2>

            <p className="text-slate-500">
              Good
            </p>

          </div>

        </div>

        <div className="space-y-3">

          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500 h-5 w-5"/>
            Basic Information
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500 h-5 w-5"/>
            Work Experience
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500 h-5 w-5"/>
            Education
          </div>

          <div className="flex items-center gap-2">
            <XCircle className="text-red-500 h-5 w-5"/>
            Skills
          </div>

          <p className="text-sm text-slate-500">
            Add more skills to improve
          </p>

          <button className="text-blue-600 font-medium">
            Improve Profile
          </button>

        </div>

      </div>

    </Card>
  );
}