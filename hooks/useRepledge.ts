'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface RepledgeRequest {
  id: string;
  loanId: string;
  requestDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

export function useRepledge() {
  const [data, setData] = useState<{ requests: RepledgeRequest[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('repledge_requests')
        .select('*')
        .eq('customer_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const mapped: RepledgeRequest[] = (rows || []).map((r: any) => ({
        id: String(r.id),
        loanId: r.loan_id || '',
        requestDate: r.requested_at ? new Date(r.requested_at).toISOString().split('T')[0] : '',
        reason: r.reason || '',
        status: r.status,
        adminNotes: r.admin_note || '',
      }));

      setData({ requests: mapped });
    } catch (err) {
      console.error('Error fetching repledge requests:', err);
      setData({ requests: [] });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`repledge-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repledge_requests', filter: `customer_id=eq.${user.id}` },
        fetchRequests
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchRequests]);

  const submitRepledge = async (values: { reason: string; notes?: string }) => {
    if (!user) return;

    let resolvedLoanId = '';
    try {
      const { data: loanRows } = await supabase
        .from('loans')
        .select('id')
        .eq('customer_id', user.id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1);

      if (loanRows && loanRows.length > 0) {
        resolvedLoanId = loanRows[0].id;
      } else {
        const { data: anyLoan } = await supabase
          .from('loans')
          .select('id')
          .eq('customer_id', user.id)
          .limit(1);
        if (anyLoan && anyLoan.length > 0) resolvedLoanId = anyLoan[0].id;
      }
    } catch (err) {
      console.error('Error resolving loan id:', err);
    }

    const { error } = await supabase.from('repledge_requests').insert({
      customer_id: user.id,
      loan_id: resolvedLoanId || '',
      reason: values.reason,
      status: 'pending',
    });

    if (error) throw error;

    await fetchRequests();
  };

  return { data, isLoading, submitRepledge };
}
