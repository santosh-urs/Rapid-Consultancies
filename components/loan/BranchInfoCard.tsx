'use client';

interface BranchInfoCardProps {
  branch?: string;
}

export function BranchInfoCard({ branch }: BranchInfoCardProps) {
  return (
    <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-brand">Branch Details</div>
      <div className="mt-4 text-lg font-semibold text-text">{branch ?? 'Musthafa Nagar Branch'}</div>
      <div className="mt-2 text-sm text-[#555555]">Visit us for document verification, renewal, or customer support.</div>
      <div className="mt-4 space-y-2 text-sm text-[#555555]">
        <div>Address: Musthafa Nagar, Khammam</div>
        <div>Phone: 9502453969</div>
      </div>
    </div>
  );
}
