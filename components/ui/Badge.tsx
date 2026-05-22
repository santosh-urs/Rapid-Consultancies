'use client';

interface BadgeProps {
  status: 'approved' | 'pending' | 'rejected' | 'active' | 'closed';
}

const statusStyles: Record<BadgeProps['status'], string> = {
  approved: 'bg-[#E6F9F1] text-[#0F6B3F]',
  pending: 'bg-[#FFF4E5] text-[#A65E00]',
  rejected: 'bg-[#FEEAEA] text-[#9B1C1C]',
  active: 'bg-[#FFE9E9] text-[#A61B1B]',
  closed: 'bg-[#F4F4F5] text-[#4B5563]',
};

export function StatusBadge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
