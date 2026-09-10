import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Right Side */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <DashboardHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-3">
          {children}
        </main>
      </div>
    </div>
  );
}