"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import emailjs from "@emailjs/browser";

import {
  Briefcase,
  Lock,
  Mail,
  Send,
  ArrowLeft,
  ArrowRight,
  Info,
  Shield,
  Zap,
  Heart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "@/components/ui/toast";

/* =========================================================
   API CONFIG
   ========================================================= */

const API = process.env.NEXT_PUBLIC_API || "";

/* =========================================================
   EMAILJS CONFIG
   ========================================================= */

const EMAILJS_SERVICE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";

const EMAILJS_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";

const EMAILJS_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

/* =========================================================
   FEATURES
   ========================================================= */

const FEATURES = [
  {
    icon: Shield,
    title: "Secure",
    description: "Your data is safe with us.",
    bg: "bg-blue-100",
    fg: "text-blue-600",
  },
  {
    icon: Zap,
    title: "Quick",
    description: "Reset in just a few clicks.",
    bg: "bg-emerald-100",
    fg: "text-emerald-600",
  },
  {
    icon: Mail,
    title: "Email Link",
    description: "Get a reset link instantly.",
    bg: "bg-violet-100",
    fg: "text-violet-600",
  },
  {
    icon: Heart,
    title: "Get Back",
    description: "Return to your career journey.",
    bg: "bg-rose-100",
    fg: "text-rose-600",
  },
];

/* =========================================================
   PAGE
   ========================================================= */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* =======================================================
     HANDLE SUBMIT
     ======================================================= */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.add({
        type: "error",
        title: "Email required",
        description:
          "Please enter your registered email address.",
      });

      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      toast.add({
        type: "error",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });

      return;
    }

    if (!API) {
      console.error("NEXT_PUBLIC_API is missing.");

      toast.add({
        type: "error",
        title: "Server error",
        description: "Backend API is not configured.",
      });

      return;
    }

    if (
      !EMAILJS_SERVICE_ID ||
      !EMAILJS_TEMPLATE_ID ||
      !EMAILJS_PUBLIC_KEY
    ) {
      console.error("EmailJS configuration is missing.");

      toast.add({
        type: "error",
        title: "Email service unavailable",
        description: "EmailJS is not configured correctly.",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/api/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
        }),
      });

      const data = await response.json();

      console.log("Forgot Password API:", data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.detail ||
            "No account found with this email address."
        );
      }

      const resetLink = data?.reset_link;

      if (!resetLink) {
        throw new Error("Reset link was not generated.");
      }

      const templateParams = {
        email: data?.email || trimmedEmail,
        reset_link: resetLink,
      };

      console.log(
        "Sending password reset email to:",
        templateParams.email
      );

      const emailResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: EMAILJS_PUBLIC_KEY,
        }
      );

      console.log("EmailJS response:", emailResponse);

      toast.add({
        type: "success",
        title: "Reset link sent",
        description: `Password reset instructions have been sent to ${trimmedEmail}.`,
      });

      setEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);

      toast.add({
        type: "error",
        title: "Unable to send reset link",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    // CHANGED: main now carries the full-bleed gradient so there is
    // no plain-white gutter on ultra-wide screens.
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <Toaster />

      {/* =====================================================
          MOBILE HEADER
          ===================================================== */}

      <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur px-4 py-3 sm:px-6 md:hidden">
        <Link href="/login" className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <Briefcase className="h-4 w-4 text-white" />
          </span>

          <span className="text-base font-bold text-slate-900 sm:text-lg">
            Job<span className="text-blue-600">Portal</span>
          </span>
        </Link>

        <Link
          href="/login"
          className="flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-blue-600 sm:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Login
        </Link>
      </header>

      {/* =====================================================
          MAIN
          CHANGED: removed `max-w-7xl mx-auto` from this row so
          both halves stretch full viewport width edge-to-edge.
          Each side now carries its own full-height background.
          ===================================================== */}

      <div className="flex min-h-[calc(100vh-57px)] w-full flex-col md:min-h-screen md:flex-row">
        {/* ===================================================
            LEFT HERO
            CHANGED: bg gradient now spans this whole half (which
            itself spans 50vw), so no white strip appears beside it.
            Inner content still capped with max-w-lg so it doesn't
            stretch awkwardly on huge monitors.
            =================================================== */}

        <section className="relative hidden w-full overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 md:flex md:w-1/2 md:flex-col md:justify-between md:px-8 md:py-8 lg:px-16 lg:py-10 xl:px-24">
          {/* subtle decorative glow, CSS-only */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />

          {/* decorative dot grid, bottom-right, CSS-only */}
          <div className="pointer-events-none absolute bottom-8 right-8 hidden h-24 w-24 [background-image:radial-gradient(circle,theme(colors.blue.300)_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-50 lg:block" />

          {/* Logo */}

          <div className="relative flex items-center justify-between gap-4">
            <Link href="/login" className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-600/30 transition-transform hover:scale-105">
                <Briefcase className="h-4 w-4 text-white" />
              </span>

              <span className="text-lg font-bold text-slate-900">
                Job<span className="text-blue-600">Portal</span>
              </span>
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:translate-x-[-2px] hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>

          {/* Hero */}

          <div className="relative mx-auto w-full max-w-lg py-10">
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 rounded-full bg-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Password Recovery
              </span>
            </div>

            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 lg:text-5xl xl:text-[3.25rem]">
              Don&apos;t Worry,
              <br />
              <span className="text-blue-600">We&apos;ve Got You!</span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-500 lg:text-base">
              Enter your registered email address and we&apos;ll send
              you a secure link to reset your password and get you
              back on track.
            </p>

            {/* Illustration */}

            <div className="mt-8 flex justify-center lg:mt-10">
              <EnvelopeIllustration />
            </div>

            <p className="mt-7 text-center text-sm italic text-slate-400">
              &ldquo;A small step to reset, a big step to new
              opportunities.&rdquo;
            </p>

            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-blue-600" />
          </div>

          {/* Features */}

          <div className="relative grid grid-cols-4 gap-3 border-t border-slate-200 pt-7 lg:gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="min-w-0 rounded-xl p-2 text-center transition hover:-translate-y-0.5 hover:bg-white/60"
                >
                  <div
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${feature.bg} shadow-sm`}
                  >
                    <Icon className={`h-4 w-4 ${feature.fg}`} />
                  </div>

                  <p className="mt-2 text-xs font-bold text-slate-800">
                    {feature.title}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400 lg:text-[11px]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="relative mt-7 text-center text-[11px] text-slate-400">
            © 2025 JobPortal. All rights reserved.
          </p>
        </section>

        {/* ===================================================
            RIGHT FORM
            CHANGED: bg-slate-50 now spans this whole half; card
            gets a stronger shadow + hover lift for more interactivity.
            =================================================== */}

        <section className="flex w-full flex-1 items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 md:w-1/2 md:px-8 md:py-0 lg:px-16">
          {/* CHANGED: card now "floats" over the left panel on desktop
              via a negative left margin + extra rounding/shadow, matching
              the overlapping card look in the reference design. */}
          <Card className="w-full max-w-md border-0 bg-white shadow-2xl shadow-blue-900/10 ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-[0_35px_60px_-15px_rgba(37,99,235,0.25)] sm:rounded-3xl md:-ml-14 lg:-ml-20">
            <CardContent className="px-5 py-7 sm:px-8 sm:py-9 md:px-9 md:py-10">
              {/* Lock */}

              <div className="relative flex justify-center">
                <span className="absolute h-20 w-20 rounded-full bg-blue-100/70 blur-md sm:h-24 sm:w-24" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-600/30 transition-transform duration-300 hover:scale-110 sm:h-16 sm:w-16">
                  <Lock className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </span>
              </div>

              {/* Heading */}

              <div className="text-center">
                <h2 className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">
                  Forgot Password?
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Enter your registered email address and we&apos;ll
                  send you a reset link to your inbox.
                </p>
              </div>

              {/* Form */}

              <form onSubmit={handleSubmit} className="mt-7 w-full">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </Label>

                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 w-full pl-9 text-sm transition-shadow focus:shadow-md focus:shadow-blue-500/10 sm:h-12"
                    />
                  </div>
                </div>

                {/* Submit */}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="group mt-5 flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:h-12"
                >
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </span>

                  {!isSubmitting && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}

              <div className="my-6 flex w-full items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-medium text-slate-400">
                  OR
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Back to login */}

              <Link
                href="/login"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm sm:h-12"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>

              {/* Security note */}

              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-3 transition-colors hover:bg-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Info className="h-3 w-3 text-blue-600" />
                </span>

                <p className="text-[11px] leading-5 text-slate-500">
                  For your security, password reset instructions
                  will be sent to the registered email address.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* =====================================================
          MOBILE FOOTER
          ===================================================== */}

      <footer className="flex flex-col items-center gap-1 border-t border-slate-100 bg-white/80 backdrop-blur px-4 py-5 text-center md:hidden">
        <p className="text-[11px] text-slate-400">
          © 2025 JobPortal. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

/* =========================================================
   ENVELOPE ILLUSTRATION
   ========================================================= */

function EnvelopeIllustration() {
  return (
    <svg
      viewBox="0 0 200 150"
      className="h-28 w-auto drop-shadow-lg sm:h-32 lg:h-36"
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="100" cy="136" rx="65" ry="8" fill="#DBEAFE" />

      {/* dashed orbit accent */}
      <circle
        cx="100"
        cy="80"
        r="62"
        fill="none"
        stroke="#BFDBFE"
        strokeWidth="1.5"
        strokeDasharray="4 5"
        opacity="0.6"
      />

      {/* Envelope back / flap */}
      <path d="M40 60 L100 100 L160 60 L160 122 L40 122 Z" fill="#2563EB" />

      {/* Letter card peeking out */}
      <rect
        x="55"
        y="38"
        width="90"
        height="62"
        rx="8"
        fill="white"
        stroke="#DBEAFE"
        strokeWidth="1.5"
      />
      <rect x="68" y="52" width="64" height="5" rx="2.5" fill="#93C5FD" />
      <rect x="68" y="63" width="48" height="5" rx="2.5" fill="#BFDBFE" />
      <rect x="68" y="74" width="56" height="5" rx="2.5" fill="#BFDBFE" />

      {/* Envelope front flap */}
      <path
        d="M40 60 L100 100 L160 60 L160 66 L100 106 L40 66 Z"
        fill="#1D4ED8"
      />

      {/* Lock badge, top-right */}
      <circle cx="150" cy="42" r="18" fill="#2563EB" />
      <rect x="141" y="39" width="18" height="14" rx="3" fill="white" />
      <rect
        x="144"
        y="32"
        width="12"
        height="11"
        rx="6"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
      />

      {/* Paper-plane badge, top-left */}
      <circle cx="42" cy="34" r="14" fill="#60A5FA" />
      <path
        d="M35 34 L49 28 L43 40 L41 35 Z"
        fill="white"
      />
    </svg>
  );
}