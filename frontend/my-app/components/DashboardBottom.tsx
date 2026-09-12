import { useEffect, useState } from "react";

import RecentApplications from "./RecentApplications";
import ProfileStrength from "./ProfileStrength";
import RecommendedJobs from "./RecommendedJobs";

export default function DashboardBottom({
  onReady,
}: {
  onReady?: () => void;
}) {
  const [applicationsReady, setApplicationsReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [jobsReady, setJobsReady] = useState(false);

  useEffect(() => {
    if (applicationsReady && profileReady && jobsReady) {
      onReady?.();
    }
  }, [applicationsReady, profileReady, jobsReady, onReady]);

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-6">
      <div className="xl:col-span-2">
        <RecentApplications onReady={() => setApplicationsReady(true)} />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <ProfileStrength onReady={() => setProfileReady(true)} />
        <RecommendedJobs onReady={() => setJobsReady(true)} />
      </div>
    </div>
  );
}