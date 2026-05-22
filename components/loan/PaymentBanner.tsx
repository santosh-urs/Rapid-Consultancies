'use client';

import { Button } from '@/components/ui/Button';

interface PaymentUnavailableBannerProps {
  branch?: string;
  outstanding: number;
  interestDue: number;
  totalPayable: number;
}

export function PaymentUnavailableBanner({ branch, outstanding, interestDue, totalPayable }: PaymentUnavailableBannerProps) {
  return (
    <div className="rounded-3xl border border-[#E5E5E5] bg-[#FFF4E5] p-6">
      <div className="flex flex-col gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A65E00]">Payment Notice</div>
        <div className="text-lg font-semibold text-text">Branch payment is currently unavailable</div>
        <p className="text-sm text-[#555555]">For security reasons, payments are processed at your assigned branch: {branch ?? 'Musthafa Nagar Branch'}.</p>
        <div className="grid gap-3 rounded-3xl bg-white p-4 text-sm text-[#555555] shadow-sm md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[#888888]">Balance due</div>
            <div className="mt-2 font-semibold text-text">₹{outstanding.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[#888888]">Interest due</div>
            <div className="mt-2 font-semibold text-text">₹{interestDue.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[#888888]">Total payable</div>
            <div className="mt-2 font-semibold text-text">₹{totalPayable.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">Locate branch</Button>
          <Button onClick={() => window.alert('Please visit your branch to complete payment.')}>Contact branch</Button>
        </div>
      </div>
    </div>
  );
}
