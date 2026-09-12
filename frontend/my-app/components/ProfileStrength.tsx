"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ProfileStrengthData {
  percentage: number;
  status: string;
  sections: {
    basic_information: boolean;
    work_experience: boolean;
    education: boolean; 
    skills: boolean;
  };
}

interface ProfileData {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;

  experience_company?: string | null;
  experience_role?: string | null;

  degree?: string | null;
  institution?: string | null;

  skills?: string | null;

  profile_strength?: ProfileStrengthData | null;
}

const API = process.env.NEXT_PUBLIC_API;

const defaultStrength: ProfileStrengthData = {
  percentage: 0,
  status: "Incomplete",
  sections: {
    basic_information: false,
    work_experience: false,
    education: false,
    skills: false,
  },
};

function statusFromPercentage(percentage: number): string {
  if (percentage >= 90) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 40) return "Average";
  return "Incomplete";
}


function extractProfileObject(parsed: unknown): ProfileData | null {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  // Array response
  if (Array.isArray(parsed)) {
    return (parsed[0] as ProfileData) ?? null;
  }

  const obj = parsed as Record<string, unknown>;

  // DRF pagination
  if (Array.isArray(obj.results)) {
    const results = obj.results as unknown[];

    return (results[0] as ProfileData) ?? null;
  }

  // { profile: {...} }
  if (
    obj.profile &&
    typeof obj.profile === "object" &&
    !Array.isArray(obj.profile)
  ) {
    return obj.profile as ProfileData;
  }

  // Direct profile object
  return obj as ProfileData;
}


function calculateProfileStrength(
  profile: ProfileData | null
): ProfileStrengthData {

  if (!profile) {
    return defaultStrength;
  }

  const basic_information = Boolean(
    String(profile.full_name ?? "").trim() &&
    String(profile.email ?? "").trim() &&
    String(profile.phone ?? "").trim() &&
    String(profile.location ?? "").trim()
  );

  const work_experience = Boolean(
    String(profile.experience_company ?? "").trim() ||
    String(profile.experience_role ?? "").trim()
  );

  const education = Boolean(
    String(profile.degree ?? "").trim() ||
    String(profile.institution ?? "").trim()
  );

  const skills = Boolean(
    String(profile.skills ?? "").trim()
  );

  const sections = {
    basic_information,
    work_experience,
    education,
    skills,
  };

  const filledCount =
    Object.values(sections).filter(Boolean).length;

  const percentage = Math.round((filledCount / 4) * 100);

  return {
    percentage,
    status: statusFromPercentage(percentage),
    sections,
  };
}

export default function ProfileStrength({
  onReady,
}: {
  onReady?: () => void;
}) {
  const [profileStrength, setProfileStrength] =
    useState<ProfileStrengthData>(defaultStrength);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStrength = async () => {
      const token = localStorage.getItem("access");

      if (!token) {
        setProfileStrength(defaultStrength);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/api/profile/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // API error
        if (!response.ok) {
          setProfileStrength(defaultStrength);
          return;
        }

        const responseText = await response.text();

        // Empty response
        if (!responseText.trim()) {
          setProfileStrength(defaultStrength);
          return;
        }

        let parsed: unknown;

        try {
          parsed = JSON.parse(responseText);
        } catch {
          setProfileStrength(defaultStrength);
          return;
        }

        const profile = extractProfileObject(parsed);

        // null / empty profile
        if (!profile || Object.keys(profile).length === 0) {
          setProfileStrength(defaultStrength);
          return;
        }

        /**
         * Agar backend already profile_strength bhej raha hai
         * to usko use karo.
         */
        if (
          profile.profile_strength &&
          typeof profile.profile_strength === "object"
        ) {
          const backendStrength = profile.profile_strength;

          setProfileStrength({
            percentage: Number(
              backendStrength.percentage ?? 0
            ),

            status: String(
              backendStrength.status ??
              statusFromPercentage(
                Number(backendStrength.percentage ?? 0)
              )
            ),

            sections: {
              basic_information: Boolean(
                backendStrength.sections?.basic_information
              ),

              work_experience: Boolean(
                backendStrength.sections?.work_experience
              ),

              education: Boolean(
                backendStrength.sections?.education
              ),

              skills: Boolean(
                backendStrength.sections?.skills
              ),
            },
          });
        } else {

          setProfileStrength(
            calculateProfileStrength(profile)
          );
        }
      } catch (error) {
        console.error(
          "Profile strength error:",
          error
        );

        setProfileStrength(defaultStrength);
      } finally {
        setLoading(false);
        onReady?.();
      }
    };

    fetchProfileStrength();
  }, [onReady]);


  const circumference = 264;

  const strokeDashoffset =
    circumference -
    (profileStrength.percentage / 100) *
    circumference;

  const strengthSectionItems = [
    {
      key: "basic_information" as const,
      label: "Basic Information",
    },
    {
      key: "work_experience" as const,
      label: "Work Experience",
    },
    {
      key: "education" as const,
      label: "Education",
    },
    {
      key: "skills" as const,
      label: "Skills",
    },
  ];

  const incompleteSections =
    strengthSectionItems.filter(
      (item) => !profileStrength.sections[item.key]
    );

  return (
    <Card className="rounded-2xl p-6">
      <h2 className="font-semibold text-lg">
        Profile Strength
      </h2>

      <div className="flex mt-6 gap-8 items-center">
        {/* Progress Circle */}
        <div className="relative h-32 w-32 shrink-0">
          <svg
            className="rotate-[-90deg]"
            viewBox="0 0 100 100"
          >
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />

            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#2563EB"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          {/* Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold">
              {loading
                ? "..."
                : `${profileStrength.percentage}%`}
            </h2>

            <p className="text-slate-500">
              {loading
                ? ""
                : profileStrength.status}
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {strengthSectionItems.map((item) => {
            const completed =
              profileStrength.sections[item.key];

            return (
              <div
                key={item.key}
                className="flex items-center gap-2"
              >
                {completed ? (
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                ) : (
                  <XCircle className="text-red-500 h-5 w-5" />
                )}

                <span
                  className={
                    completed
                      ? ""
                      : "text-slate-600"
                  }
                >
                  {item.label}
                </span>
              </div>
            );
          })}

          {/* Improvement Message */}
          {!loading &&
            profileStrength.percentage < 100 && (
              <p className="text-sm text-slate-500">
                {profileStrength.percentage === 0
                  ? "Complete your profile to improve your profile strength"
                  : incompleteSections.length === 1 &&
                    incompleteSections[0].key ===
                    "skills"
                    ? "Add more skills to improve"
                    : "Complete more sections to improve"}
              </p>
            )}

          {/* Improve Profile */}
          {!loading &&
            profileStrength.percentage < 100 && (
              <button
                type="button"
                onClick={() => router.push("/main/Profile")}
                className="text-blue-600 font-medium cursor-pointer focus:outline-none"
              >
                Improve Profile
              </button>
            )}
        </div>
      </div>
    </Card>
  );
}