import Jobform from "@/components/JobForm/Jobform";

export default function ApplyJobPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div className="space-y-6 px-3 sm:space-y-8 sm:px-4 lg:px-6">
      <Jobform />
      <p className="text-sm text-slate-500">Job ID: {params.slug}</p>
    </div>
  );
}
