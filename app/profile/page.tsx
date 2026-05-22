'use client';

import { useEffect, useState } from 'react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { User, Phone, Mail, MapPin, Calendar, ShieldCheck, Landmark, Edit2, Check, Lock, X } from 'lucide-react';

export default function ProfilePage() {
  const { data, isLoading, updateProfile, updatePassword } = useProfile();
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (data) {
      setEmail(data.email);
      setAddress(data.address);
    }
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ email, address });
    setMessage('Profile updated successfully.');
    setIsEditing(false);
    setIsSaving(false);
  };

  const handlePasswordSave = async () => {
    setPasswordError('');
    setPasswordMessage('');
    if (!password) {
      setPasswordError('Password cannot be empty.');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await updatePassword(password);
      setPasswordMessage('Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const kycColor: Record<string, string> = {
    Verified: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    Rejected: 'bg-red-100 text-red-700',
  };

  return (
    <CustomerLayout title="My Profile" subtitle="View and update your account details">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-48 rounded-2xl bg-[#F0F0F0] animate-pulse" />)}
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 flex items-center gap-2">
              <Check size={16} /> {message}
            </div>
          )}

          {/* Personal info — read only */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Personal Information</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 py-3 border-b border-[#F0F0F0]">
                <User size={15} className="text-[#888888] shrink-0" />
                <div>
                  <div className="text-xs text-[#888888]">Full Name</div>
                  <div className="text-sm font-semibold text-text">{data?.name ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-[#F0F0F0]">
                <Phone size={15} className="text-[#888888] shrink-0" />
                <div>
                  <div className="text-xs text-[#888888]">Mobile Number</div>
                  <div className="text-sm font-semibold text-text">{data?.mobile ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <Calendar size={15} className="text-[#888888] shrink-0" />
                <div>
                  <div className="text-xs text-[#888888]">Date of Birth</div>
                  <div className="text-sm font-semibold text-text">{data?.dob ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact — editable */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-brand" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Contact Details</span>
              </div>
              {!isEditing ? (
                <Button variant="ghost" className="text-xs py-1.5 px-3 gap-1.5 flex items-center" onClick={() => setIsEditing(true)}>
                  <Edit2 size={13} /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button className="text-xs py-1.5 px-3" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="ghost" className="text-xs py-1.5 px-3" onClick={() => { setIsEditing(false); setEmail(data?.email ?? ''); setAddress(data?.address ?? ''); }}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#555555] mb-1.5">Email Address</label>
                {isEditing ? (
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-text py-2.5 px-3 bg-[#F7F7F8] rounded-xl">
                    <Mail size={14} className="text-[#888888]" />
                    {data?.email || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#555555] mb-1.5">Address</label>
                {isEditing ? (
                  <Textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} />
                ) : (
                  <div className="flex items-start gap-2 text-sm text-text py-2.5 px-3 bg-[#F7F7F8] rounded-xl">
                    <MapPin size={14} className="text-[#888888] mt-0.5 shrink-0" />
                    <span>{data?.address || '—'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security / Change Password */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock size={16} className="text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Change Password</span>
            </div>
            {passwordMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 flex items-center gap-2">
                <Check size={14} className="shrink-0" /> {passwordMessage}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-center gap-2">
                <X size={14} className="shrink-0" /> {passwordError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1.5">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1.5">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <Button onClick={handlePasswordSave} disabled={isChangingPassword}>
                  {isChangingPassword ? 'Updating…' : 'Update Password'}
                </Button>
              </div>
            </div>
          </div>

          {/* Account details — read only */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck size={16} className="text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Account Details</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F7F8] p-4">
                <div className="text-xs text-[#888888] mb-2">KYC Status</div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${kycColor[data?.kycStatus ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                  {data?.kycStatus ?? '—'}
                </span>
              </div>
              <div className="rounded-xl bg-[#F7F7F8] p-4">
                <div className="text-xs text-[#888888] mb-2">Branch Assigned</div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
                  <Landmark size={13} className="text-brand" />
                  {data?.branch ?? '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
