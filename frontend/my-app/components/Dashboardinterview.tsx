import { useEffect, useState } from "react";

import DashboardChart from "./DashboardChart";
import UpcomingInterviews from "./UpcomingInterviews";

export default function Dashboardinterview({
  onReady,
}: {
  onReady?: () => void;
}) {
  const [chartReady, setChartReady] = useState(false);
  const [interviewReady, setInterviewReady] = useState(false);

  useEffect(() => {
    if (chartReady && interviewReady) {
      onReady?.();
    }
  }, [chartReady, interviewReady, onReady]);

  return (
    <div className="mt-4 grid gap-4 sm:gap-6 lg:mt-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DashboardChart onReady={() => setChartReady(true)} />
      </div>

      <UpcomingInterviews onReady={() => setInterviewReady(true)} />
    </div>
  );
}