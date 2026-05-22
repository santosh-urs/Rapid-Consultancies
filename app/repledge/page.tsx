'use client';

import { useMemo, useState } from 'react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { useRepledge } from '@/hooks/useRepledge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { RepledgeRequestForm } from '@/components/repledge/RepledgeRequestForm';
import { RefreshCw, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  pending: { icon: <Clock size={13} />, cls: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
  approved: { icon: <CheckCircle2 size={13} />, cls: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  rejected: { icon: <XCircle size={13} />, cls: 'bg-red-100 text-red-700', label: 'Rejected' },
};

export default function RepledgePage() {
  const { data, isLoading, submitRepledge } = useRepledge();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState('');

  const pendingRequest = useMemo(
    () => data?.requests.find(r => r.status === 'pending'),
    [data]
  );

  const handleSubmit = async (values: { reason: string; notes?: string }) => {
    await submitRepledge(values);
    setMessage('Your re-pledge request has been submitted. An admin will review it shortly.');
    setIsFormOpen(false);
    setTimeout(() => setMessage(''), 6000);
  };

  return (
    <CustomerLayout title="Re-Pledge Requests" subtitle="Submit a renewal request for admin review">
      {/* Info banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3 mb-6">
        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          A re-pledge request extends your loan against the same gold collateral. Requests require branch verification and <strong>admin approval</strong> before taking effect. No automatic processing.
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-semibold text-text">{data?.requests.length ?? 0} requests submitted</div>
          {pendingRequest && (
            <div className="text-xs text-amber-600 mt-0.5">You have a pending request — only one can be active at a time.</div>
          )}
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          disabled={Boolean(pendingRequest)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> New Request
        </Button>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 flex items-center gap-2 mb-6">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Requests list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-[#F0F0F0] animate-pulse" />)}
        </div>
      ) : !data?.requests.length ? (
        <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-white p-12 text-center">
          <RefreshCw size={32} className="text-[#888888] mx-auto mb-3" />
          <div className="text-sm text-[#888888]">No re-pledge requests yet. Submit your first request above.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.requests.map(request => {
            const s = statusConfig[request.status] ?? statusConfig.pending;
            return (
              <div key={request.id} className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-xs text-[#888888] mb-1">{request.requestDate}</div>
                    <div className="text-base font-semibold text-text">{request.reason}</div>
                    {request.loanId && (
                      <div className="text-xs text-[#888888] mt-0.5">Loan: <span className="font-mono text-text">{request.loanId}</span></div>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
                {request.adminNotes && (
                  <div className="rounded-xl bg-[#F7F7F8] px-4 py-3 text-sm text-[#555555]">{request.adminNotes}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RepledgeRequestForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        disabled={Boolean(pendingRequest)}
      />
    </CustomerLayout>
  );
}
