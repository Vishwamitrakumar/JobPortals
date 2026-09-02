"use client";
import { useState } from "react";
import Signup from "@/components/Signup";
import {
  Briefcase,
  Search,
  FileText,
  TrendingUp,
} from "lucide-react";
import LoginIllustration from "@/components/Loginillustration";
import LoginForm from "@/components/LoginForm";


const features = [
  {
    icon: Search,
    title: "Search Jobs",
    description: "Find the perfect job that matches your skills and experience.",
  },
  {
    icon: FileText,
    title: "Apply Easily",
    description: "Apply to jobs in just a few clicks and track your applications.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your application status and interview updates.",
  },
];

export default function CandidateLoginPage() {
     const [isSignup, setIsSignup] = useState(false);
  return (
    <div className="min-h-screen w-full bg-[#EEF3FC] flex items-center justify-center p-4 sm:p-8">
     <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-[420px_420px_520px] gap-10 items-center">
        {/* Left side */}
        <div className="flex flex-col px-2 py-6 lg:py-0">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2F6FE0]">
              <Briefcase className="w-5 h-5 text-white" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold text-[#1A2333]">
              Job<span className="text-[#2F6FE0]">Portal</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Find Opportunities. Build Your Future.
          </p>

          {/* Heading */}
          <h1 className="mt-10 text-4xl sm:text-5xl font-extrabold leading-tight text-[#1A2333]">
            Welcome Back,
            <br />
            <span className="text-[#2F6FE0]">Candidate!</span>
          </h1>
          <p className="mt-4 max-w-sm text-slate-500 leading-relaxed">
            Login to your account and discover the best job opportunities for
            you.
          </p>

        
          {/* Feature list */}
          <div className="mt-8 flex flex-col gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#DCE8FE] shrink-0">
                  <Icon className="w-5 h-5 text-[#2F6FE0]" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-semibold text-[#1A2333] text-sm">{title}</p>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-slate-400">
            © 2024 JobPortal. All rights reserved.
          </p>
        </div>  {/* Illustration */}
          <div className="mt-8 flex justify-center lg:justify-start">
            <LoginIllustration />
          </div>


       {isSignup ? (
  <Signup setIsSignup={setIsSignup} />
) : (
  <LoginForm setIsSignup={setIsSignup} />
)}
      </div>
    </div>
  );
}

