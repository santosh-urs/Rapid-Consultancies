'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProfileData {
  name: string;
  mobile: string;
  email: string;
  address: string;
  dob: string;
  kycStatus: string;
  branch: string;
}


export function useProfile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'user') {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: c, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (c) {
          setData({
            name: c.name,
            mobile: c.mobile,
            email: c.email,
            address: c.address || '',
            dob: c.dob || '',
            kycStatus: c.kyc_status,
            branch: c.branch,
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async ({ email, address }: { email: string; address: string }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          email,
          address,
        })
        .eq('id', user.id);

      if (error) throw error;

      setData((current) =>
        current
          ? {
              ...current,
              email,
              address,
            }
          : null
      );
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error, data } = await supabase
        .from('customers')
        .update({ password })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Password update error:', error);
        throw new Error(error.message || 'Failed to update password');
      }

      console.log('Password updated successfully:', data);
    } catch (err) {
      console.error('Error updating password:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, updateProfile, updatePassword };
}
