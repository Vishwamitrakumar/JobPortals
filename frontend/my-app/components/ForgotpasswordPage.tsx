"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Briefcase, Lock, Mail, Send, ArrowLeft, Shield, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "@/components/ui/toast";

const API = process.env.NEXT_PUBLIC_API;

const FEATURES = [
  { icon: Shield, title: "Secure", description: "Your data is safe with us." },
  { icon: Zap, title: "Quick", description: "Reset in just a few clicks." },
  { icon: Mail, title: "Email Link", description: "Get reset link instantly." },
  { icon: Heart, title: "Get Back", description: "Return to your career journey." },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Enter your registered email address to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/api/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset link");
      }

      toast({
        title: "Reset link sent",
        description: `Check ${email} for instructions to reset your password.`,
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "We couldn't send the reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Toaster />

      {/* Top bar (mobile only) */}
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Briefcase className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-semibold text-slate-900">
            Job<span className="text-blue-600">Portal</span>
          </span>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col md:flex-row">
        {/* Left hero panel - hidden on small screens */}
        <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 px-10 py-10 md:flex lg:px-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <Briefcase className="h-4 w-4 text-white" />
              </span>
              <span className="text-lg font-semibold text-slate-900">
                Job<span className="text-blue-600">Portal</span>
              </span>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Login
            </Link>
          </div>

          <div className="max-w-sm">
            <h1 className="text-4xl font-bold leading-tight text-slate-900 lg:text-[2.75rem]">
              Reset Your
              <br />
              <span className="text-blue-600">Password</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Don&apos;t worry! It happens. Enter your email address and we&apos;ll
              send you a link to reset your password.
            </p>

            <div className="relative mt-12 flex justify-center">
              <EnvelopeIllustration />
            </div>

            <p className="mt-10 text-center text-sm italic text-slate-400">
              &ldquo;A new password brings a new beginning.&rdquo;
            </p>
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-blue-600" />
          </div>

          <div className="grid grid-cols-4 gap-4 border-t border-slate-200 pt-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="text-center">
                <feature.icon className="mx-auto h-5 w-5 text-blue-600" />
                <p className="mt-2 text-xs font-semibold text-slate-800">
                  {feature.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[11px] text-slate-400">
            © 2025 JobPortal. All rights reserved.
          </p>
        </div>

        {/* Right / form panel */}
        <div className="flex flex-1 items-center justify-center bg-white px-4 py-10 sm:px-8 md:bg-slate-50 md:px-10">
          <Card className="w-full max-w-sm border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-8 sm:px-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600">
                <Lock className="h-6 w-6 text-white" />
              </span>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Forgot Password?
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
                Enter your registered email address and we&apos;ll send you a
                reset link.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 w-full space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              <div className="my-5 flex w-full items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">OR</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <Button
                asChild
                variant="secondary"
                className="w-full bg-slate-50 text-blue-600 hover:bg-slate-100"
              >
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile footer */}
      <footer className="flex flex-col items-center gap-2 border-t border-slate-100 px-4 py-6 text-center md:hidden">
        <p className="text-[11px] text-slate-400">
          © 2025 JobPortal. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function EnvelopeIllustration() {
  return (
    <svg
      viewBox="0 0 200 140"
      className="h-32 w-auto sm:h-36"
      aria-hidden="true"
    >
      <ellipse cx="100" cy="128" rx="70" ry="8" fill="#DBEAFE" />
      <rect x="35" y="35" width="130" height="80" rx="10" fill="#2563EB" />
      <path d="M35 45 L100 85 L165 45" stroke="#BFDBFE" strokeWidth="3" fill="none" />
      <rect x="35" y="45" width="130" height="70" rx="8" fill="#3B82F6" opacity="0.9" />
      <path d="M35 45 L100 85 L165 45 L165 115 L35 115 Z" fill="#EFF6FF" opacity="0.95" />
      <path d="M35 45 L100 85 L165 45" stroke="#93C5FD" strokeWidth="3" fill="none" />
      <circle cx="100" cy="60" r="20" fill="#2563EB" />
      <rect x="90" y="55" width="20" height="16" rx="3" fill="white" />
      <rect x="93" y="48" width="14" height="12" rx="7" fill="none" stroke="white" strokeWidth="3" />
      <path
        d="M150 30 L165 22 L160 38 L150 34 Z"
        fill="#60A5FA"
      />
    </svg>
  );
}