"use client";

import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const interviews = [
  {
    company: "Google",
    role: "Software Engineer",
    logo: "G",
    bg: "bg-blue-600",
    date: "May 20, 2024",
    time: "10:00 AM",
  },
  {
    company: "Microsoft",
    role: "Frontend Developer",
    logo: "M",
    bg: "bg-black",
    date: "May 22, 2024",
    time: "02:00 PM",
  },
  {
    company: "Spotify",
    role: "React Developer",
    logo: "S",
    bg: "bg-green-500",
    date: "May 24, 2024",
    time: "11:30 AM",
  },
];

export default function UpcomingInterviews() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Upcoming Interviews</h2>

        <button className="text-sm text-blue-600">View All</button>
      </CardHeader>

      <CardContent className="space-y-5">
        {interviews.map((item) => (
          <div
            key={item.company}
            className="flex flex-col gap-3 border-b pb-4 last:border-none sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.bg} text-xl font-bold text-white`}
              >
                {item.logo}
              </div>

              <div>
                <h3 className="font-semibold">{item.company}</h3>
                <p className="text-sm text-slate-500">{item.role}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />
                {item.date}
              </div>

              <p className="mt-1 text-sm">{item.time}</p>
            </div>
          </div>
        ))}

        <button className="w-full text-blue-600 font-medium">View All Interviews</button>
      </CardContent>
    </Card>
  );
}