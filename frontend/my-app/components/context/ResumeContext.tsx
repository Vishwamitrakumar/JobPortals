"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";

interface Resume {
  id?: number;
  file?: string;
  skills?: string[];
  extracted_text?: string;
  job_title?: string;
  education?: string;
  experience_years?: number;
}

interface ResumeContextType {
  resume: Resume | null;
  loading: boolean;
  refreshResume: () => Promise<void>;
  setResume: React.Dispatch<React.SetStateAction<Resume | null>>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(
  undefined
);

export function ResumeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API;

  const refreshResume = async () => {
    try {
      const access = localStorage.getItem("access");

      if (!access) {
        setResume(null);
        return;
      }

      const response = await axios.get(
        `${API}/api/resume-upload/`,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      setResume(response.data?.resume || null);

    } catch (error) {
      console.error("Fetch Resume Error:", error);
      setResume(null);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshResume();
  }, []);

  return (
    <ResumeContext.Provider
      value={{
        resume,
        loading,
        refreshResume,
        setResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);

  if (!context) {
    throw new Error(
      "useResume must be used inside ResumeProvider"
    );
  }

  return context;
}