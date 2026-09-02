import RecentApplications from "./RecentApplications";
import ProfileStrength from "./ProfileStrength";
import RecommendedJobs from "./RecommendedJobs";

export default function DashboardBottom() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-6">
      <div className="xl:col-span-2">
        <RecentApplications />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <ProfileStrength />
        <RecommendedJobs />
      </div>
    </div>
  );
}