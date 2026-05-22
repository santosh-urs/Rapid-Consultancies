'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface RepledgeRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { reason: string; notes?: string }) => Promise<void>;
  disabled?: boolean;
}

export function RepledgeRequestForm({ open, onClose, onSubmit, disabled }: RepledgeRequestFormProps) {
  const [reason, setReason] = useState('Renewal request');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({ reason, notes });
      setReason('Renewal request');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm bg-black/40">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text">New Re-Pledge Request</h2>
            <p className="text-sm text-[#555555]">Tell us why you want to extend your loan pledge.</p>
          </div>
          <button className="text-sm text-[#555555] hover:text-text" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Request Title</label>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text">Additional Notes</label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={disabled || isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </Button>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
