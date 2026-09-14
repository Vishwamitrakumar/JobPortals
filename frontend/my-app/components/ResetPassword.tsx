"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Heart,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// ============================================================
// API
// ============================================================

const API = process.env.NEXT_PUBLIC_API || "";

// ============================================================
// RESET PASSWORD FORM
// ============================================================

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get uid and token from:
  // /reset-password?uid=Mg&token=xxxxx
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  // ============================================================
  // STATES
  // ============================================================

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // PASSWORD RULES
  // ============================================================

  const hasMinLength = newPassword.length >= 8;

  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);

  const hasNumber = /\d/.test(newPassword);

  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(newPassword);

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ----------------------------------------------------------
    // Check reset URL
    // ----------------------------------------------------------

    if (!uid || !token) {
      setError(
        "This password reset link is invalid. Please request a new password reset link."
      );
      return;
    }

    // ----------------------------------------------------------
    // Required fields
    // ----------------------------------------------------------

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    // ----------------------------------------------------------
    // Password length
    // ----------------------------------------------------------

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    // ----------------------------------------------------------
    // Confirm password
    // ----------------------------------------------------------

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    // ----------------------------------------------------------
    // API
    // ----------------------------------------------------------

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Django validation errors
        if (Array.isArray(data.errors)) {
          setError(data.errors.join(" "));
        } else {
          setError(
            data.message ||
              "Unable to reset your password. Please try again."
          );
        }

        return;
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setSuccess(
        data.message || "Password reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");

      // Go to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PASSWORD RULE COMPONENT
  // ============================================================

  const PasswordRule = ({
    checked,
    children,
  }: {
    checked: boolean;
    children: React.ReactNode;
  }) => {
    return (
      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-600">
        {checked ? (
          <CheckCircle2 className="h-3 w-3 shrink-0 text-blue-600" />
        ) : (
          <Circle className="h-3 w-3 shrink-0 text-slate-300" />
        )}

        <span>{children}</span>
      </div>
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-[#f7fbff]">
      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ======================================================
            LEFT SIDE
        ====================================================== */}

        <section className="relative hidden lg:flex lg:w-[48%] xl:w-[50%] overflow-hidden bg-gradient-to-br from-[#f8fcff] via-[#f3f9ff] to-[#eaf4ff]">

          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-100/40 blur-2xl" />

          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col px-8 py-7 xl:px-12 xl:py-8">

            {/* --------------------------------------------------
                HEADER
            -------------------------------------------------- */}

            <div className="flex items-center justify-between">

              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-200">
                  <Lock className="h-4 w-4 text-white" />
                </div>

                <span className="text-[17px] font-bold tracking-tight text-slate-800">
                  Job<span className="text-blue-600">Portal</span>
                </span>
              </div>

              {/* Back Login */}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="group flex items-center gap-2 text-[11px] font-medium text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
                Back to Login
              </button>
            </div>

            {/* --------------------------------------------------
                CONTENT
            -------------------------------------------------- */}

            <div className="flex flex-1 flex-col justify-center">

              <div className="max-w-[480px]">

                <h1 className="font-serif text-[40px] leading-[1.05] font-bold tracking-tight text-slate-900 xl:text-[48px]">
                  Create a New
                  <br />

                  <span className="text-blue-600">
                    Password
                  </span>
                </h1>

                <p className="mt-5 max-w-[390px] text-[13px] leading-6 text-slate-500">
                  You're just one step away! Enter your new
                  password below to secure your account and
                  continue your career journey with us.
                </p>

                {/* ------------------------------------------------
                    SHIELD ILLUSTRATION
                ------------------------------------------------ */}

                <div className="relative mt-8 flex justify-center">

                  {/* Glow */}
                  <div className="absolute top-6 h-32 w-32 rounded-full bg-blue-200/40 blur-2xl" />

                  {/* Circle */}
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-blue-100/60">

                    {/* Shield */}
                    <div className="relative flex h-24 w-20 items-center justify-center">

                      <ShieldCheck
                        className="absolute h-24 w-24 fill-blue-500 text-blue-600"
                        strokeWidth={1}
                      />

                      {/* Lock */}
                      <div className="relative z-10 mt-1 flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-lg">
                        <Lock className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>

                    {/* Sparkles */}
                    <Sparkles className="absolute -right-3 top-1 h-6 w-6 fill-blue-500 text-blue-500" />

                    <Sparkles className="absolute -left-3 bottom-5 h-4 w-4 fill-blue-300 text-blue-300" />

                  </div>

                  {/* Shadow */}
                  <div className="absolute -bottom-2 h-3 w-32 rounded-[50%] bg-blue-200/50 blur-sm" />
                </div>

                {/* Quote */}
                <p className="mt-6 text-center font-serif text-[11px] italic text-slate-400">
                  "A stronger you starts with a stronger password."
                </p>

                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-blue-600" />

              </div>
            </div>

            {/* --------------------------------------------------
                FEATURES
            -------------------------------------------------- */}

            <div className="grid grid-cols-4 border-t border-blue-100/70 pt-5">

              <Feature
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Secure"
                description={
                  <>
                    Your data is safe
                    <br />
                    with us.
                  </>
                }
              />

              <Feature
                icon={<Zap className="h-4 w-4" />}
                title="Reliable"
                description={
                  <>
                    Quick and easy
                    <br />
                    process.
                  </>
                }
              />

              <Feature
                icon={<Lock className="h-4 w-4" />}
                title="Protected"
                description={
                  <>
                    Keep your account
                    <br />
                    secure.
                  </>
                }
              />

              <Feature
                icon={<Heart className="h-4 w-4" />}
                title="Move Forward"
                description={
                  <>
                    Get back to your
                    <br />
                    career journey.
                  </>
                }
              />

            </div>
          </div>
        </section>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}

        <section className="flex min-h-screen flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">

          <Card className="w-full max-w-[430px] border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">

            <CardContent className="p-5 sm:p-7">

              {/* ------------------------------------------------
                  MOBILE HEADER
              ------------------------------------------------ */}

              <div className="mb-5 flex items-center justify-between lg:hidden">

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Lock className="h-4 w-4 text-white" />
                  </div>

                  <span className="font-bold text-slate-800">
                    Job<span className="text-blue-600">Portal</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Login
                </button>
              </div>

              {/* ------------------------------------------------
                  ICON
              ------------------------------------------------ */}

              <div className="flex justify-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-200">
                    <Lock
                      className="h-5 w-5 text-white"
                      strokeWidth={2}
                    />
                  </div>

                </div>
              </div>

              {/* ------------------------------------------------
                  TITLE
              ------------------------------------------------ */}

              <div className="mt-4 text-center">

                <h2 className="font-serif text-xl font-bold text-slate-900">
                  Reset Your Password
                </h2>

                <p className="mx-auto mt-2 max-w-[290px] text-[10px] leading-4 text-slate-400">
                  Enter your new password below. Make sure it's
                  strong and unique to keep your account secure.
                </p>

              </div>

              {/* ------------------------------------------------
                  ERROR
              ------------------------------------------------ */}

              {error && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-4 text-red-600">
                  {error}
                </div>
              )}

              {/* ------------------------------------------------
                  SUCCESS
              ------------------------------------------------ */}

              {success && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-xs leading-4 text-green-700">

                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>{success} Redirecting to login...</span>

                </div>
              )}

              {/* ------------------------------------------------
                  FORM
              ------------------------------------------------ */}

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
              >

                {/* =================================================
                    NEW PASSWORD
                ================================================= */}

                <div className="space-y-1.5">

                  <Label
                    htmlFor="new-password"
                    className="text-[11px] font-semibold text-slate-700"
                  >
                    New Password
                    <span className="ml-1 text-red-500">*</span>
                  </Label>

                  <div className="relative">

                    <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your new password"
                      disabled={loading}
                      className="h-10 rounded-md border-slate-200 pl-9 pr-10 text-xs shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                      aria-label={
                        showNewPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>

                  </div>

                </div>

                {/* =================================================
                    PASSWORD RULES
                ================================================= */}

                <div className="rounded-md bg-[#f3f8fd] px-3 py-2.5">

                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">

                    <PasswordRule checked={hasMinLength}>
                      At least 8 characters
                    </PasswordRule>

                    <PasswordRule
                      checked={hasUppercase && hasLowercase}
                    >
                      Include uppercase and lowercase letters
                    </PasswordRule>

                    <PasswordRule checked={hasNumber}>
                      Include at least one number
                    </PasswordRule>

                    <PasswordRule checked={hasSpecialCharacter}>
                      Include at least one special character
                    </PasswordRule>

                  </div>

                </div>

                {/* =================================================
                    CONFIRM PASSWORD
                ================================================= */}

                <div className="space-y-1.5">

                  <Label
                    htmlFor="confirm-password"
                    className="text-[11px] font-semibold text-slate-700"
                  >
                    Confirm New Password
                    <span className="ml-1 text-red-500">*</span>
                  </Label>

                  <div className="relative">

                    <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Confirm your new password"
                      disabled={loading}
                      className="h-10 rounded-md border-slate-200 pl-9 pr-10 text-xs shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>

                  </div>

                  {/* Match message */}
                  {confirmPassword &&
                    newPassword !== confirmPassword && (
                      <p className="text-[10px] text-red-500">
                        Passwords do not match.
                      </p>
                    )}

                  {confirmPassword &&
                    newPassword === confirmPassword && (
                      <p className="text-[10px] text-green-600">
                        Passwords match.
                      </p>
                    )}

                </div>

                {/* =================================================
                    UPDATE BUTTON
                ================================================= */}

                <Button
                  type="submit"
                  disabled={loading || !!success}
                  className="h-10 w-full rounded-md bg-blue-600 text-xs font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
                >

                  {loading ? (
                    <>
                      <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      Update Password
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </>
                  )}

                </Button>

              </form>

              {/* ------------------------------------------------
                  SECURITY NOTICE
              ------------------------------------------------ */}

              <div className="mt-3 flex gap-2 rounded-md bg-blue-50 px-3 py-2.5">

                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />

                <p className="text-[9px] leading-4 text-slate-500">
                  This link is valid for a limited time. If you
                  did not request a password reset, please ignore
                  this link.
                </p>

              </div>

              {/* ------------------------------------------------
                  OR
              ------------------------------------------------ */}

              <div className="my-4 flex items-center gap-3">

                <div className="h-px flex-1 bg-slate-100" />

                <span className="text-[10px] text-slate-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-slate-100" />

              </div>

              {/* ------------------------------------------------
                  BACK TO LOGIN
              ------------------------------------------------ */}

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/login")}
                className="h-9 w-full rounded-md bg-[#f7faff] text-[10px] font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Back to Login
              </Button>

            </CardContent>
          </Card>

        </section>
      </div>
    </main>
  );
}

// ============================================================
// FEATURE COMPONENT
// ============================================================

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">

      <div className="text-blue-600">
        {icon}
      </div>

      <p className="mt-1.5 text-[9px] font-bold text-slate-700">
        {title}
      </p>

      <p className="mt-0.5 text-[8px] leading-3 text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7fbff]">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            Loading...
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}