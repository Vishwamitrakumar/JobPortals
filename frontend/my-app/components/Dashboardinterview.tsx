import DashboardChart from "./DashboardChart";
import UpcomingInterviews from "./UpcomingInterviews";

export default function Dashboardinterview() {
  return (
    <div className="mt-4 grid gap-4 sm:gap-6 lg:mt-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DashboardChart />
      </div>

      <UpcomingInterviews />
    </div>
  );
}