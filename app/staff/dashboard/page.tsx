'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import {
  calculateDynamicInterest,
  parseDateUTC,
  getTodayUTC,
  addDaysUTC,
  addMonthsUTC,
  formatISODateOnly,
  getLocalISODate,
} from '@/lib/loanUtils';
import {
  LayoutDashboard,
  Users,
  Coins,
  LogOut,
  Search,
  Edit,
  Check,
  X,
  Plus,
  TrendingUp,
  Menu,
  Calculator,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  dob: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  branch: string;
  joinedDate: string;
  password?: string;
}

interface Loan {
  id: string;
  loanId: string;
  customerId: string;
  customerName: string;
  status: 'active' | 'pending' | 'closed' | 'overdue';
  principal: number;
  outstanding: number;
  interestDue: number;
  interestRate: number;
  nextDueDate: string;
  startDate: string;
  maturityDate: string;
  goldWeight: number;
  goldPurity: number;
  estimatedGoldValue: number;
  goldImageUrl?: string;
  branch: string;
  tenureMonths: number;
  loanType: string;
}

interface SanctionRequest {
  id: string;
  staffId: string;
  staffName: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerDob: string;
  customerAddress: string;
  businessName: string;
  businessType: string;
  businessYears: string;
  principal: number;
  interestRate: number;
  goldWeight: number;
  goldPurity: number;
  estimatedGoldValue: number;
  tenureMonths: number;
  branch: string;
  notes: string;
  loanType: string;
  requestedDueDate: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedDate: string;
  reviewedBy: string;
  adminNotes: string;
}

const GOLD_RATES: Record<number, number> = {
  18: 5400,
  22: 6600,
  24: 7200,
};

const LOAN_TYPES = ['Gold Loan', 'Weekly Loan', 'Business Loan', 'Home Loan', 'Car Loan', 'Two Wheeler Loan', 'Mortgage Loan', 'Home Take Loans'];

const LOAN_TYPE_INFO: Record<string, { description: string; features: string[] }> = {
  'Gold Loan': {
    description: 'Instant funds against gold jewellery. Quick processing, minimal documentation, and competitive interest rates.',
    features: ['Same-day disbursement', 'No income proof required', 'Gold safely stored at branch', 'Flexible repayment options'],
  },
  'Weekly Loan': {
    description: 'Short-term personal financing cleared in 4 weekly payments within one month.',
    features: ['Min ₹10,000 - Max ₹1,00,000', 'Cleared in 1 month', '35% starting interest rate', 'Editable rate by staff'],
  },
  'Business Loan': {
    description: 'Fuel business growth with tailored loans for small and medium enterprises.',
    features: ['Working capital support', 'Expansion financing', 'Quick approval', 'Flexible tenure'],
  },
  'Home Loan': {
    description: 'Affordable home loan schemes to make dream homes a reality.',
    features: ['Long repayment tenure', 'Competitive interest rates', 'Up to 80% financing', 'Tax benefits available'],
  },
  'Car Loan': {
    description: 'Easy car loan schemes for new and used vehicles at competitive rates.',
    features: ['Up to 90% financing', 'New & used vehicles', 'Quick approval', 'Door-step service'],
  },
  'Two Wheeler Loan': {
    description: 'Finance a two-wheeler at attractive interest rates with easy monthly installments.',
    features: ['Minimal down payment', 'Quick disbursal', 'Flexible EMIs', 'All brands covered'],
  },
  'Mortgage Loan': {
    description: 'Unlock property value with large loan amounts against commercial or residential property.',
    features: ['High loan amounts', 'Commercial & residential', 'Long repayment period', 'Balance transfer available'],
  },
  'Home Take Loans': {
    description: 'Branch representative comes to the customer\'s doorstep to process the loan application.',
    features: ['Doorstep service', 'Zero branch visits', 'Quick processing', 'All loan types covered'],
  },
};

const parseSanctionMeta = (notes: string) => ({
  loanType: (notes.match(/\[LOAN_TYPE:([^\]]+)\]/) || [])[1] || '',
  dueDate: (notes.match(/\[DUE_DATE:([^\]]+)\]/) || [])[1] || '',
  mobile: (notes.match(/\[CUST_MOBILE:([^\]]+)\]/) || [])[1] || '',
  email: (notes.match(/\[CUST_EMAIL:([^\]]+)\]/) || [])[1] || '',
  dob: (notes.match(/\[CUST_DOB:([^\]]+)\]/) || [])[1] || '',
  address: (notes.match(/\[CUST_ADDR:([^\]]+)\]/) || [])[1] || '',
  businessName: (notes.match(/\[BUSI_NAME:([^\]]+)\]/) || [])[1] || '',
  businessType: (notes.match(/\[BUSI_TYPE:([^\]]+)\]/) || [])[1] || '',
  businessYears: (notes.match(/\[BUSI_YEARS:([^\]]+)\]/) || [])[1] || '',
  userNotes: notes
    .replace(/\[LOAN_TYPE:[^\]]+\]/g, '')
    .replace(/\[DUE_DATE:[^\]]+\]/g, '')
    .replace(/\[CUST_MOBILE:[^\]]+\]/g, '')
    .replace(/\[CUST_EMAIL:[^\]]+\]/g, '')
    .replace(/\[CUST_DOB:[^\]]+\]/g, '')
    .replace(/\[CUST_ADDR:[^\]]+\]/g, '')
    .replace(/\[BUSI_NAME:[^\]]+\]/g, '')
    .replace(/\[BUSI_TYPE:[^\]]+\]/g, '')
    .replace(/\[BUSI_YEARS:[^\]]+\]/g, '')
    .trim(),
});

const encodeSanctionNotes = (
  loanType: string, dueDate: string,
  mobile: string, email: string, dob: string, address: string,
  businessName: string, businessType: string, businessYears: string,
  notes: string
) => {
  let prefix = '';
  if (loanType) prefix += `[LOAN_TYPE:${loanType}]`;
  if (dueDate) prefix += `[DUE_DATE:${dueDate}]`;
  if (mobile) prefix += `[CUST_MOBILE:${mobile}]`;
  if (email) prefix += `[CUST_EMAIL:${email}]`;
  if (dob) prefix += `[CUST_DOB:${dob}]`;
  if (address) prefix += `[CUST_ADDR:${address}]`;
  if (businessName) prefix += `[BUSI_NAME:${businessName}]`;
  if (businessType) prefix += `[BUSI_TYPE:${businessType}]`;
  if (businessYears) prefix += `[BUSI_YEARS:${businessYears}]`;
  return prefix ? `${prefix} ${notes}`.trim() : notes;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'
);

export default function StaffDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();

  const normalizeMobile = (m: string) => m.replace(/\D/g, '').slice(-10);

  type TabKey = 'overview' | 'customers' | 'loans' | 'sanction' | 'my-requests' | 'closures' | 'outstanding-edits';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [sanctionRequests, setSanctionRequests] = useState<SanctionRequest[]>([]);
  const [closeRequests, setCloseRequests] = useState<any[]>([]);
  const [outstandingEditRequests, setOutstandingEditRequests] = useState<any[]>([]);

  // Outstanding Edit modal state
  const [isOutstandingEditOpen, setIsOutstandingEditOpen] = useState(false);
  const [outstandingEditLoan, setOutstandingEditLoan] = useState<Loan | null>(null);
  const [outstandingEditNewAmount, setOutstandingEditNewAmount] = useState<number>(0);
  const [outstandingEditReason, setOutstandingEditReason] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [loanSearch, setLoanSearch] = useState('');
  const [myRequestsSearch, setMyRequestsSearch] = useState('');

  // Edit customer modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addCustFormName, setAddCustFormName] = useState('');
  const [addCustFormMobile, setAddCustFormMobile] = useState('');
  const [addCustFormEmail, setAddCustFormEmail] = useState('');
  const [addCustFormPassword, setAddCustFormPassword] = useState('Cust@123');
  const [addCustFormDob, setAddCustFormDob] = useState('');
  const [addCustFormAddress, setAddCustFormAddress] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormAddress, setCustFormAddress] = useState('');
  const [custFormKyc, setCustFormKyc] = useState<'Verified' | 'Pending' | 'Rejected'>('Pending');
  const [custFormName, setCustFormName] = useState('');
  const [custFormMobile, setCustFormMobile] = useState('');
  const [custFormDob, setCustFormDob] = useState('');
  const [custFormBranch, setCustFormBranch] = useState('');

  // Repayment log modal
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [isCloseRequestOpen, setIsCloseRequestOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [clearingMonthIdx, setClearingMonthIdx] = useState<number | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [uploadingGoldPhotoId, setUploadingGoldPhotoId] = useState<string | null>(null);

  // Sanction request form — new customer details
  const [sanctionCustomerType, setSanctionCustomerType] = useState<'new' | 'existing'>('new');
  const [sanctionSelectedCustomerId, setSanctionSelectedCustomerId] = useState('');
  const [sanctionCustName, setSanctionCustName] = useState('');
  const [sanctionCustMobile, setSanctionCustMobile] = useState('');
  const [sanctionCustEmail, setSanctionCustEmail] = useState('');
  const [sanctionCustDob, setSanctionCustDob] = useState('');
  const [sanctionCustAddress, setSanctionCustAddress] = useState('');
  // Sanction request form — loan details
  const [sanctionPrincipal, setSanctionPrincipal] = useState(100000);
  const [sanctionInterestRate, setSanctionInterestRate] = useState(9.5);
  const [sanctionGoldWeight, setSanctionGoldWeight] = useState(15);
  const [sanctionGoldPurity, setSanctionGoldPurity] = useState<18 | 22 | 24>(22);
  const [sanctionGoldRate, setSanctionGoldRate] = useState(6600);
  const [sanctionEstimatedGoldValue, setSanctionEstimatedGoldValue] = useState(99000);
  const [isEstimatedGoldValueManuallyEdited, setIsEstimatedGoldValueManuallyEdited] = useState(false);
  const [sanctionTenure, setSanctionTenure] = useState(6);
  const [sanctionNotes, setSanctionNotes] = useState('');
  const [sanctionLoanType, setSanctionLoanType] = useState('Gold Loan');
  const [sanctionDueDate, setSanctionDueDate] = useState('');

  useEffect(() => {
    if (!isEstimatedGoldValueManuallyEdited) {
      setSanctionEstimatedGoldValue(sanctionGoldWeight * sanctionGoldRate);
    }
  }, [sanctionGoldWeight, sanctionGoldRate, isEstimatedGoldValueManuallyEdited]);
  // Business loan fields
  const [sanctionBusinessName, setSanctionBusinessName] = useState('');
  const [sanctionBusinessType, setSanctionBusinessType] = useState('');
  const [sanctionBusinessYears, setSanctionBusinessYears] = useState<number | ''>('');

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('auth_token='));
    const role = document.cookie.split('; ').find(r => r.startsWith('auth_role='));
    if (!token || !role || role.split('=')[1] !== 'staff') {
      router.push('/staff/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Verify current logged-in staff member is still active and exists in DB
        const storedUserJson = typeof window !== 'undefined' ? window.localStorage.getItem('goldsecure-user') : null;
        const storedUser = storedUserJson ? JSON.parse(storedUserJson) : null;
        if (storedUser?.id) {
          const { data: currentStaff, error: staffErr } = await supabase
            .from('staff')
            .select('*')
            .eq('id', storedUser.id)
            .maybeSingle();

          if (staffErr || !currentStaff || !currentStaff.is_active) {
            toast.push('Your staff account has been deleted or deactivated.');
            logout();
            router.push('/staff/login');
            return;
          }
        }

        const [custRes, loanRes, sanctionRes, closeRes, outstandingEditRes] = await Promise.all([
          supabase.from('customers').select('*'),
          supabase.from('loans').select('*'),
          supabase.from('loan_sanction_requests').select('*').order('requested_date', { ascending: false }),
          supabase.from('loan_close_requests').select('*').order('requested_at', { ascending: false }),
          supabase.from('outstanding_edit_requests').select('*').order('requested_at', { ascending: false }),
        ]);

        if (custRes.error) throw custRes.error;
        if (loanRes.error) throw loanRes.error;

        const filteredCusts = (custRes.data || []).filter((c: any) => !(c.password?.startsWith('DELETED_') ?? false));
        setCustomers(filteredCusts.map((c: any) => ({
          id: c.id,
          name: c.name,
          mobile: c.mobile,
          email: c.email,
          address: c.address || '',
          dob: c.dob || '',
          kycStatus: c.kyc_status,
          branch: c.branch,
          joinedDate: c.joined_date,
          password: c.password || '',
        })).sort((a: any, b: any) => parseDateUTC(b.joinedDate).getTime() - parseDateUTC(a.joinedDate).getTime()));

        setLoans((loanRes.data || []).map((l: any) => {
          const goldWeight = Number(l.gold_weight);
          const loanType = l.loan_type || (goldWeight > 0 ? 'Gold Loan' : 'Loan');
          const tenureMonths = l.tenure_months ? Number(l.tenure_months) : (() => {
            if (!l.start_date || !l.maturity_date) return 0;
            const s = parseDateUTC(l.start_date);
            const e = parseDateUTC(l.maturity_date);
            return (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
          })();
          return {
            id: l.id,
            loanId: l.loan_id,
            customerId: l.customer_id,
            customerName: l.customer_name,
            status: l.status,
            principal: Number(l.principal),
            outstanding: Number(l.outstanding),
            interestDue: calculateDynamicInterest({
              ...l,
              loanType,
              tenureMonths,
            }),
            interestRate: Number(l.interest_rate),
            nextDueDate: l.next_due_date || '',
            startDate: l.start_date,
            maturityDate: l.maturity_date,
            goldWeight,
            goldPurity: Number(l.gold_purity),
            estimatedGoldValue: Number(l.estimated_gold_value),
            goldImageUrl: l.gold_image_url || '',
            branch: l.branch,
            tenureMonths,
            loanType,
          };
        }));

        if (!sanctionRes.error) {
          setSanctionRequests((sanctionRes.data || []).map((s: any) => {
            const meta = parseSanctionMeta(s.notes || '');
            return {
              id: s.id,
              staffId: s.staff_id || '',
              staffName: s.staff_name,
              customerId: s.customer_id || '',
              customerName: s.customer_name,
              customerMobile: meta.mobile,
              customerEmail: meta.email,
              customerDob: meta.dob,
              customerAddress: meta.address,
              businessName: meta.businessName,
              businessType: meta.businessType,
              businessYears: meta.businessYears,
              principal: Number(s.principal),
              interestRate: Number(s.interest_rate),
              goldWeight: Number(s.gold_weight),
              goldPurity: Number(s.gold_purity),
              estimatedGoldValue: Number(s.estimated_gold_value),
              tenureMonths: Number(s.tenure_months),
              branch: s.branch,
              notes: meta.userNotes,
              loanType: meta.loanType,
              requestedDueDate: meta.dueDate,
              status: s.status,
              requestedDate: s.requested_date,
              reviewedBy: s.reviewed_by || '',
              adminNotes: s.admin_notes || '',
            };
          }));
        }

        if (!closeRes?.error && closeRes?.data) {
          setCloseRequests(closeRes.data.map((r: any) => ({
            id: r.id,
            loanId: r.loan_id,
            loanDbId: r.loan_db_id,
            customerId: r.customer_id,
            customerName: r.customer_name,
            requestedBy: r.requested_by,
            reason: r.reason || '',
            status: r.status,
            adminNotes: r.admin_notes || '',
            requestedAt: r.requested_at,
            reviewedAt: r.reviewed_at,
            reviewedBy: r.reviewed_by,
          })));
        }

        if (!outstandingEditRes?.error && outstandingEditRes?.data) {
          setOutstandingEditRequests(outstandingEditRes.data.map((r: any) => ({
            id: r.id,
            loanId: r.loan_id,
            loanDbId: r.loan_db_id,
            customerId: r.customer_id,
            customerName: r.customer_name,
            currentOutstanding: Number(r.current_outstanding),
            newOutstanding: Number(r.new_outstanding),
            reason: r.reason || '',
            requestedBy: r.requested_by,
            requestedAt: r.requested_at,
            status: r.status,
            adminNotes: r.admin_notes || '',
            reviewedBy: r.reviewed_by || '',
            reviewedAt: r.reviewed_at,
          })));
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.push('Failed to load data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const addAuditLog = async (action: string, details: string) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('audit_logs').insert({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
        details,
        admin: user?.name ?? 'Staff',
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  };

  const resetAddCustomerForm = () => {
    setAddCustFormName('');
    setAddCustFormMobile('');
    setAddCustFormEmail('');
    setAddCustFormPassword('Cust@123');
    setAddCustFormDob('');
    setAddCustFormAddress('');
  };

  const handleAddCustomerClick = () => {
    resetAddCustomerForm();
    setIsAddCustomerOpen(true);
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCustFormName || !addCustFormMobile || !addCustFormEmail) {
      toast.push('Please fill in all required fields.');
      return;
    }

    const normNew = normalizeMobile(addCustFormMobile);
    const mobileExists = customers.some(c => normalizeMobile(c.mobile) === normNew);
    if (mobileExists) {
      toast.push('A customer with this mobile number already exists.');
      return;
    }
    const emailExists = customers.some(c => c.email.toLowerCase() === addCustFormEmail.toLowerCase().trim());
    if (emailExists) {
      toast.push('A customer with this email address already exists.');
      return;
    }

    setIsLoading(true);

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: addCustFormName,
      mobile: addCustFormMobile,
      email: addCustFormEmail,
      address: addCustFormAddress.trim(),
      dob: addCustFormDob,
      kycStatus: 'Pending',
      branch: user?.branch || 'Musthafa Nagar Branch',
      joinedDate: getLocalISODate(),
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('customers').insert({
          id: newCust.id,
          name: newCust.name,
          mobile: newCust.mobile,
          email: newCust.email,
          address: newCust.address || null,
          dob: newCust.dob || null,
          kyc_status: newCust.kycStatus,
          branch: newCust.branch,
          joined_date: newCust.joinedDate,
          password: addCustFormPassword,
        });
        if (error) throw error;
      }

      setCustomers(prev => [{ ...newCust }, ...prev]);
      await addAuditLog('Customer Added (Staff)', `Staff ${user?.name} added customer ${newCust.name} (${newCust.mobile})`);
      toast.push(`Customer ${newCust.name} successfully added.`);
      setIsAddCustomerOpen(false);
      resetAddCustomerForm();
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to save customer: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Edit Customer ---
  const handleEditCustomerClick = (c: Customer) => {
    setSelectedCustomer(c);
    setCustFormName(c.name);
    setCustFormMobile(c.mobile);
    setCustFormEmail(c.email);
    setCustFormDob(c.dob || '');
    setCustFormAddress(c.address);
    setCustFormBranch(c.branch || '');
    setCustFormKyc(c.kycStatus as 'Verified' | 'Pending' | 'Rejected');
    setIsEditCustomerOpen(true);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!custFormName.trim()) { toast.push('Name is required.'); return; }
    if (!custFormMobile.trim()) { toast.push('Mobile is required.'); return; }
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('customers').update({
          name: custFormName.trim(),
          mobile: custFormMobile.trim(),
          email: custFormEmail.trim(),
          dob: custFormDob || null,
          address: custFormAddress.trim(),
          branch: custFormBranch.trim(),
          kyc_status: custFormKyc,
        }).eq('id', selectedCustomer.id);
        if (error) throw error;
      }

      setCustomers(prev => prev.map(c =>
        c.id === selectedCustomer.id
          ? { ...c, name: custFormName.trim(), mobile: custFormMobile.trim(), email: custFormEmail.trim(), dob: custFormDob, address: custFormAddress.trim(), branch: custFormBranch.trim(), kycStatus: custFormKyc }
          : c
      ));

      await addAuditLog('Customer Updated (Staff)', `Staff ${user?.name} updated profile of ${selectedCustomer.name}`);
      toast.push('Customer profile updated.');
      setIsEditCustomerOpen(false);
    } catch (err: any) {
      toast.push(`Failed to update: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  // --- Build monthly payment schedule ---
  const buildSchedule = (loan: Loan) => {
    if (!loan.startDate || loan.tenureMonths <= 0) return [];
    const start = parseDateUTC(loan.startDate);
    const rows: {
      month: number; date: string; dateLabel: string;
      interestAmt: number; principalAmt: number; totalAmt: number;
    }[] = [];

    if (loan.loanType === 'Weekly Loan') {
      const flatInterest = Math.round(loan.principal * (loan.interestRate / 100));
      const weeklyInterest = Math.round(flatInterest / 4);
      const weeklyPrincipal = Math.round(loan.principal / 4);
      const weeklyTotal = Math.round((loan.principal + flatInterest) / 4);
      for (let i = 1; i <= 4; i++) {
        const d = addDaysUTC(start, 7 * i);
        rows.push({
          month: i,
          date: formatISODateOnly(d),
          dateLabel: d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }),
          interestAmt: weeklyInterest,
          principalAmt: weeklyPrincipal,
          totalAmt: weeklyTotal,
        });
      }
    } else if (loan.loanType === 'Gold Loan' || loan.goldWeight > 0) {
      const monthlyRate = loan.interestRate / 100 / 12;
      const monthlyInterest = Math.round(loan.principal * monthlyRate);
      for (let i = 1; i <= loan.tenureMonths; i++) {
        const d = addMonthsUTC(start, i);
        const isLast = i === loan.tenureMonths;
        rows.push({
          month: i,
          date: formatISODateOnly(d),
          dateLabel: d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }),
          interestAmt: monthlyInterest,
          principalAmt: isLast ? loan.outstanding : 0,
          totalAmt: isLast ? monthlyInterest + loan.outstanding : monthlyInterest,
        });
      }
    } else {
      const monthlyRate = loan.interestRate / 100 / 12;
      const interestAmt = Math.round(loan.principal * monthlyRate);
      const principalAmt = Math.round(loan.principal / loan.tenureMonths);
      const emi = interestAmt + principalAmt;
      for (let i = 1; i <= loan.tenureMonths; i++) {
        const d = addMonthsUTC(start, i);
        rows.push({
          month: i,
          date: formatISODateOnly(d),
          dateLabel: d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }),
          interestAmt,
          principalAmt,
          totalAmt: emi,
        });
      }
    }
    return rows;
  };

  // --- Mark instalment as Cleared ---
  const handleMarkCleared = async (loan: Loan, monthIdx: number) => {
    if (!loan) return;
    setClearingMonthIdx(monthIdx);
    const schedule = buildSchedule(loan);
    const row = schedule[monthIdx];
    if (!row) return;

    // Calculate new principal outstanding (interest is calculated dynamically, not stored)
    const newOutstanding = Math.max(0, loan.outstanding - row.principalAmt);
    // Next due date = next unpaid month after this one
    const nextRow = schedule[monthIdx + 1];
    const newNextDue = nextRow ? nextRow.date : loan.maturityDate;
    // Loan closes when principal is fully paid and this is the last scheduled instalment
    const newStatus = newOutstanding === 0 && !nextRow ? 'closed' : loan.status;

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('loans').update({
          outstanding: newOutstanding,
          next_due_date: newNextDue,
          status: newStatus,
        }).eq('id', loan.id);
        if (error) throw error;

        // Insert payment record so it appears in customer repayment history
        let payType: 'interest' | 'principal' | 'mixed' | 'emi' = 'mixed';
        if (row.interestAmt > 0 && row.principalAmt === 0) {
          payType = 'interest';
        } else if (row.interestAmt === 0 && row.principalAmt > 0) {
          payType = 'principal';
        } else if (loan.loanType === 'Business Loan' || loan.loanType === 'Home Loan' || loan.loanType === 'Car Loan' || loan.loanType === 'Two Wheeler Loan' || loan.loanType === 'Mortgage Loan') {
          payType = 'emi';
        }

        const { error: payError } = await supabase.from('loan_payments').insert({
          id: `pay-${Date.now()}`,
          loan_id: loan.loanId,
          loan_db_id: loan.id,
          amount: row.totalAmt,
          payment_type: payType,
          payment_date: formatISODateOnly(getTodayUTC()),
          notes: `Cleared installment for Month ${row.month} (Due: ${row.dateLabel})`,
        });
        if (payError) throw payError;
      }

      setLoans(prev => prev.map(l =>
        l.id === loan.id
          ? { ...l, outstanding: newOutstanding, nextDueDate: newNextDue, status: newStatus as Loan['status'] }
          : l
      ));
      // Update selectedLoan so modal reflects instantly
      setSelectedLoan(prev => prev && prev.id === loan.id
        ? { ...prev, outstanding: newOutstanding, nextDueDate: newNextDue, status: newStatus as Loan['status'] }
        : prev
      );

      await addAuditLog('Instalment Cleared', `Staff ${user?.name} marked Month ${row.month} (${row.dateLabel}) cleared for loan ${loan.loanId}. Amount: ₹${row.totalAmt.toLocaleString('en-IN')}.`);
      toast.push(`Month ${row.month} (${row.dateLabel}) marked as cleared!`);
    } catch (err: any) {
      toast.push(`Failed: ${err.message}`);
    } finally {
      setClearingMonthIdx(null);
    }
  };

  // --- Request Loan Closure ---
  const handleRequestClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('loan_close_requests').insert({
        loan_id: selectedLoan.loanId,
        loan_db_id: selectedLoan.id,
        customer_id: selectedLoan.customerId,
        customer_name: selectedLoan.customerName,
        requested_by: user?.name ?? 'Staff',
        staff_id: user?.id,
        reason: closeReason.trim(),
        status: 'pending',
        requested_at: new Date().toISOString(),
      });
      if (error) throw error;
      await addAuditLog('Loan Close Requested', `Staff ${user?.name} requested closure of loan ${selectedLoan.loanId} for ${selectedLoan.customerName}.`);
      toast.push(`Close request sent to admin for ${selectedLoan.loanId}.`);
      setIsCloseRequestOpen(false);
      setCloseReason('');
      fetchData();
    } catch (err: any) {
      toast.push(`Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleUploadGoldPhoto = async (loan: Loan, file: File) => {
    setUploadingGoldPhotoId(loan.id);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `gold/${loan.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('loans').update({ gold_image_url: publicUrl }).eq('id', loan.id);
      if (dbErr) throw dbErr;
      setLoans(prev => prev.map(l => l.id === loan.id ? { ...l, goldImageUrl: publicUrl } : l));
      setSelectedLoan(prev => prev?.id === loan.id ? { ...prev, goldImageUrl: publicUrl } : prev);
      await addAuditLog('Gold Photo Uploaded', `Staff ${user?.name} uploaded gold photo for loan ${loan.loanId}`);
      toast.push('Gold photo uploaded successfully.');
    } catch (err: any) {
      toast.push('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingGoldPhotoId(null);
    }
  };

  const maxEligibleLoan = useMemo(() => {
    return Math.floor(sanctionEstimatedGoldValue * 0.75);
  }, [sanctionEstimatedGoldValue]);

  const ltvRatio = useMemo(() => {
    if (sanctionEstimatedGoldValue === 0) return 0;
    return parseFloat(((sanctionPrincipal / sanctionEstimatedGoldValue) * 100).toFixed(1));
  }, [sanctionPrincipal, sanctionEstimatedGoldValue]);

  const handleSanctionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctionCustName.trim() || !sanctionCustMobile.trim()) {
      toast.push('Customer name and mobile are required.');
      return;
    }
    if (sanctionLoanType === 'Weekly Loan') {
      if (sanctionPrincipal < 10000 || sanctionPrincipal > 100000) {
        toast.push('Weekly Loan principal must be between ₹10,000 and ₹1,00,000.');
        return;
      }
    }
    if (sanctionLoanType === 'Business Loan') {
      if (!sanctionBusinessName.trim()) {
        toast.push('Please enter the business name.');
        return;
      }
      const yrs = Number(sanctionBusinessYears);
      if (!sanctionBusinessYears || isNaN(yrs) || yrs < 3) {
        toast.push('Business must be at least 3 years old to qualify for a loan.');
        return;
      }
    }

    setIsLoading(true);
    const branch = user?.branch || 'Musthafa Nagar Branch';
    const encodedNotes = encodeSanctionNotes(
      sanctionLoanType, sanctionDueDate,
      sanctionCustMobile, sanctionCustEmail, sanctionCustDob, sanctionCustAddress,
      sanctionBusinessName, sanctionBusinessType, String(sanctionBusinessYears ?? ''),
      sanctionNotes
    );
    const custId = sanctionCustomerType === 'existing' && sanctionSelectedCustomerId ? sanctionSelectedCustomerId : '';

    const newRequest: SanctionRequest = {
      id: `sanc-${Date.now()}`,
      staffId: user?.id ?? '',
      staffName: user?.name ?? 'Staff',
      customerId: custId,
      customerName: sanctionCustName.trim(),
      customerMobile: sanctionCustMobile.trim(),
      customerEmail: sanctionCustEmail.trim(),
      customerDob: sanctionCustDob,
      customerAddress: sanctionCustAddress.trim(),
      businessName: sanctionBusinessName.trim(),
      businessType: sanctionBusinessType,
      businessYears: String(sanctionBusinessYears ?? ''),
      principal: sanctionPrincipal,
      interestRate: sanctionInterestRate,
      goldWeight: sanctionLoanType === 'Weekly Loan' ? 0 : sanctionGoldWeight,
      goldPurity: sanctionLoanType === 'Weekly Loan' ? 0 : sanctionGoldPurity,
      estimatedGoldValue: sanctionLoanType === 'Weekly Loan' ? 0 : sanctionEstimatedGoldValue,
      tenureMonths: sanctionTenure,
      branch,
      notes: sanctionNotes,
      loanType: sanctionLoanType,
      requestedDueDate: sanctionDueDate,
      status: 'pending',
      requestedDate: new Date().toISOString(),
      reviewedBy: '',
      adminNotes: '',
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('loan_sanction_requests').insert({
          id: newRequest.id,
          staff_id: newRequest.staffId,
          staff_name: newRequest.staffName,
          customer_id: custId || null,
          customer_name: newRequest.customerName,
          principal: newRequest.principal,
          interest_rate: newRequest.interestRate,
          gold_weight: newRequest.goldWeight,
          gold_purity: newRequest.goldPurity,
          estimated_gold_value: newRequest.estimatedGoldValue,
          tenure_months: newRequest.tenureMonths,
          branch: newRequest.branch,
          notes: encodedNotes,
          status: 'pending',
          requested_date: newRequest.requestedDate,
        });
        if (error) throw error;
      }

      setSanctionRequests(prev => [newRequest, ...prev]);
      await addAuditLog('Loan Sanction Requested', `Staff ${user?.name} submitted sanction request for ${newRequest.customerName} (${newRequest.customerMobile}) — ₹${sanctionPrincipal.toLocaleString('en-IN')} (${sanctionLoanType})${custId ? ' [Existing Customer]' : ''}`);
      toast.push('Sanction request submitted. Awaiting admin approval.');
      // Reset form
      setSanctionCustomerType('new');
      setSanctionSelectedCustomerId('');
      setSanctionCustName('');
      setSanctionCustMobile('');
      setSanctionCustEmail('');
      setSanctionCustDob('');
      setSanctionCustAddress('');
      setSanctionPrincipal(100000);
      setSanctionInterestRate(9.5);
      setSanctionGoldWeight(15);
      setSanctionGoldPurity(22);
      setSanctionEstimatedGoldValue(99000);
      setIsEstimatedGoldValueManuallyEdited(false);
      setSanctionTenure(6);
      setSanctionNotes('');
      setSanctionLoanType('Gold Loan');
      setSanctionDueDate('');
      setSanctionBusinessName('');
      setSanctionBusinessType('');
      setSanctionBusinessYears('');
      setActiveTab('my-requests');
    } catch (err: any) {
      toast.push(`Failed to submit request: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/staff/login');
  };

  // Deduplicated customer list (normalize +91 / 0 prefix — keep newest per mobile)
  const uniqueCustomers = useMemo(() => {
    const seen = new Map<string, typeof customers[0]>();
    for (const c of customers) {
      const key = normalizeMobile(c.mobile);
      if (!seen.has(key)) seen.set(key, c);
    }
    return Array.from(seen.values());
  }, [customers]);

  // Filtered lists
  const filteredCustomers = useMemo(() =>
    uniqueCustomers.filter(c =>
      !(c.password?.startsWith('DELETED_') ?? false) && (
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.mobile.includes(customerSearch) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase())
      )
    ), [uniqueCustomers, customerSearch]);

  const filteredLoans = useMemo(() =>
    loans.filter(l =>
      l.status !== 'closed' && (
        l.loanId.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.customerName.toLowerCase().includes(loanSearch.toLowerCase())
      )
    ), [loans, loanSearch]);

  const myRequests = useMemo(() =>
    sanctionRequests.filter(r => r.staffId === user?.id),
    [sanctionRequests, user]);

  // Metrics
  const activeLoansCount = useMemo(() => loans.filter(l => l.status === 'active' || l.status === 'overdue').length, [loans]);
  const totalOutstanding = useMemo(() => loans.reduce((s, l) => s + (l.status !== 'closed' ? (l.outstanding + l.interestDue) : 0), 0), [loans]);
  const pendingSanctions = useMemo(() => myRequests.filter(r => r.status === 'pending').length, [myRequests]);
  const pendingClosures = useMemo(() => closeRequests.filter(r => r.status === 'pending').length, [closeRequests]);
  const pendingOutstandingEdits = useMemo(() => outstandingEditRequests.filter(r => r.status === 'pending').length, [outstandingEditRequests]);

  const handleSubmitOutstandingEdit = async () => {
    if (!outstandingEditLoan) return;
    if (!outstandingEditReason.trim()) {
      toast.push('Please provide a reason for the outstanding edit.');
      return;
    }
    if (outstandingEditNewAmount < 0) {
      toast.push('New outstanding amount cannot be negative.');
      return;
    }
    try {
      const id = `oe-${Date.now()}`;
      const staffName = user?.name ?? 'Staff';
      const { error } = await supabase.from('outstanding_edit_requests').insert({
        id,
        loan_id: outstandingEditLoan.loanId,
        loan_db_id: outstandingEditLoan.id,
        customer_id: outstandingEditLoan.customerId,
        customer_name: outstandingEditLoan.customerName,
        current_outstanding: outstandingEditLoan.outstanding,
        new_outstanding: outstandingEditNewAmount,
        reason: outstandingEditReason.trim(),
        requested_by: staffName,
        requested_at: new Date().toISOString(),
        status: 'pending',
      });
      if (error) throw error;
      toast.push(`Outstanding edit request submitted for ${outstandingEditLoan.loanId}.`);
      setIsOutstandingEditOpen(false);
      setOutstandingEditLoan(null);
      setOutstandingEditReason('');
      setOutstandingEditNewAmount(0);
      await fetchData();
    } catch (err: any) {
      toast.push('Failed to submit request: ' + (err.message || 'Unknown error'));
    }
  };

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { key: 'customers', label: 'Customers', icon: <Users className="h-5 w-5" /> },
    { key: 'loans', label: 'Loans', icon: <Coins className="h-5 w-5" /> },
    { key: 'sanction', label: 'Request Sanction', icon: <Send className="h-5 w-5" /> },
    { key: 'my-requests', label: 'My Requests', icon: <Clock className="h-5 w-5" /> },
    { key: 'closures', label: 'Loan Closures', icon: <XCircle className="h-5 w-5" /> },
    { key: 'outstanding-edits', label: 'Outstanding Edits', icon: <Edit className="h-5 w-5" /> },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      active: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      closed: 'bg-gray-100 text-gray-600',
      Verified: 'bg-emerald-100 text-emerald-700',
      Pending: 'bg-amber-100 text-amber-700',
      Rejected: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  // ── Tab renderers ─────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-brand/10 p-4 text-brand"><Users className="h-6 w-6" /></div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#888888]">Customers</div>
            <div className="mt-1 text-2xl font-bold text-text">{customers.length}</div>
          </div>
        </div>
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-600"><Coins className="h-6 w-6" /></div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#888888]">Active Loans</div>
            <div className="mt-1 text-2xl font-bold text-text">{activeLoansCount}</div>
          </div>
        </div>
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-600"><Clock className="h-6 w-6" /></div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#888888]">Pending Sanctions</div>
            <div className="mt-1 text-2xl font-bold text-text">{pendingSanctions}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-text flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand" /> Portfolio Summary
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-[#F0F0F0] pb-2">
            <span className="text-[#555555]">Total Outstanding (active + overdue)</span>
            <span className="font-semibold">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-b border-[#F0F0F0] pb-2">
            <span className="text-[#555555]">My submitted sanction requests</span>
            <span className="font-semibold">{myRequests.length}</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-[#555555]">Approved / Rejected</span>
            <span className="font-semibold">
              {myRequests.filter(r => r.status === 'approved').length} / {myRequests.filter(r => r.status === 'rejected').length}
            </span>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Staff access notice:</strong> You may view and edit customer/loan details and log repayments. Loan sanctioning requires admin approval. Deleting customers or loans is restricted to administrators.
        </div>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between bg-white p-4 rounded-3xl border border-[#E5E5E5]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search by name, mobile, email…"
            value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-surface pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <Button type="button" onClick={handleAddCustomerClick} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-surface">
                {['Name', 'Contact', 'KYC Status', 'Branch', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredCustomers.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-[#888888]">No customers found.</td></tr>
              )}
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-text">{c.name}</div>
                    <div className="text-xs text-[#888888]">ID: {c.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text">{c.mobile}</div>
                    <div className="text-xs text-[#888888]">{c.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{statusBadge(c.kycStatus)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{c.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#888888]">{c.joinedDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="ghost" className="text-xs py-1 px-3 gap-1" onClick={() => handleEditCustomerClick(c)}>
                      <Edit className="h-3 w-3" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-white p-4 rounded-3xl border border-[#E5E5E5]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search by loan ID or customer…"
            value={loanSearch}
            onChange={e => setLoanSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-surface pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-surface">
                {['Loan ID', 'Loan Type', 'Customer', 'Date Applied', 'Status', 'Principal', 'Outstanding', 'Interest Due', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredLoans.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-10 text-center text-sm text-[#888888]">No loans found.</td></tr>
              )}
              {filteredLoans.map(l => (
                <tr key={l.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-text font-mono">{l.loanId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand">
                      {l.goldWeight > 0 ? 'Gold Loan' : 'Loan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{l.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">
                    {l.startDate ? parseDateUTC(l.startDate).toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{statusBadge(l.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text">₹{l.principal.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text">₹{(l.outstanding + l.interestDue).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{l.interestDue.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        className="text-xs py-1 px-3 gap-1"
                        onClick={() => { setSelectedLoan(l); setIsEditScheduleOpen(true); }}
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </Button>

                      {l.status !== 'closed' && (
                        <Button
                          variant="ghost"
                          className="text-xs py-1 px-3 gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => { setSelectedLoan(l); setCloseReason(''); setIsCloseRequestOpen(true); }}
                        >
                          <XCircle className="h-3 w-3" /> Request Close
                        </Button>
                      )}
                      {l.status !== 'closed' && (
                        <Button
                          variant="ghost"
                          className="text-xs py-1 px-3 gap-1 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => {
                            setOutstandingEditLoan(l);
                            setOutstandingEditNewAmount(l.outstanding);
                            setOutstandingEditReason('');
                            setIsOutstandingEditOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" /> Edit Outstanding
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSanctionForm = () => (
    <div className="max-w-xl">
      <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-text flex items-center gap-2">
          <Send className="h-5 w-5 text-brand" /> Request Loan Sanction
        </h2>
        <p className="mb-6 text-sm text-[#555555]">
          Fill in the loan details and submit for admin approval. The loan will only be created after the admin sanctions it.
        </p>

        <form onSubmit={handleSanctionSubmit} className="space-y-5">
          {/* Customer Type Toggle */}
          <div className="flex gap-4 p-1 bg-[#F7F7F8] rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setSanctionCustomerType('new');
                setSanctionSelectedCustomerId('');
                setSanctionCustName('');
                setSanctionCustMobile('');
                setSanctionCustEmail('');
                setSanctionCustDob('');
                setSanctionCustAddress('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${sanctionCustomerType === 'new' ? 'bg-white text-brand shadow-sm' : 'text-[#888888]'}`}
            >
              New Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setSanctionCustomerType('existing');
                setSanctionSelectedCustomerId('');
                setSanctionCustName('');
                setSanctionCustMobile('');
                setSanctionCustEmail('');
                setSanctionCustDob('');
                setSanctionCustAddress('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${sanctionCustomerType === 'existing' ? 'bg-white text-brand shadow-sm' : 'text-[#888888]'}`}
            >
              Existing Customer
            </button>
          </div>

          {/* ── Customer Details ── */}
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Customer Details</p>
            
            {sanctionCustomerType === 'existing' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Select Customer <span className="text-red-500">*</span></label>
                <select
                  value={sanctionSelectedCustomerId}
                  onChange={e => {
                    const custId = e.target.value;
                    setSanctionSelectedCustomerId(custId);
                    const cust = customers.find(c => c.id === custId);
                    if (cust) {
                      setSanctionCustName(cust.name);
                      setSanctionCustMobile(cust.mobile);
                      setSanctionCustEmail(cust.email);
                      setSanctionCustDob(cust.dob);
                      setSanctionCustAddress(cust.address);
                    } else {
                      setSanctionCustName('');
                      setSanctionCustMobile('');
                      setSanctionCustEmail('');
                      setSanctionCustDob('');
                      setSanctionCustAddress('');
                    }
                  }}
                  className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                  required={sanctionCustomerType === 'existing'}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.filter(c => !(c.password?.startsWith('DELETED_') ?? false)).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mobile})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-text">Full Name <span className="text-red-500">*</span></label>
                <Input
                  value={sanctionCustName}
                  onChange={e => setSanctionCustName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  required
                  disabled={sanctionCustomerType === 'existing'}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-text">Mobile Number <span className="text-red-500">*</span></label>
                <Input
                  type="tel"
                  value={sanctionCustMobile}
                  onChange={e => setSanctionCustMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  required
                  disabled={sanctionCustomerType === 'existing'}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-text">Email</label>
                <Input
                  type="email"
                  value={sanctionCustEmail}
                  onChange={e => setSanctionCustEmail(e.target.value)}
                  placeholder="Optional"
                  disabled={sanctionCustomerType === 'existing'}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-text">Date of Birth</label>
                <input
                  type="date"
                  value={sanctionCustDob}
                  onChange={e => setSanctionCustDob(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={sanctionCustomerType === 'existing'}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-text">Address</label>
                <Input
                  value={sanctionCustAddress}
                  onChange={e => setSanctionCustAddress(e.target.value)}
                  placeholder="Street, City"
                  disabled={sanctionCustomerType === 'existing'}
                />
              </div>
            </div>
          </div>

          {/* Loan Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Loan Type</label>
            <select
              value={sanctionLoanType}
              onChange={e => {
                const val = e.target.value;
                setSanctionLoanType(val);
                if (val === 'Weekly Loan') {
                  setSanctionInterestRate(35);
                  setSanctionTenure(1);
                  setSanctionPrincipal(10000);
                  const todayUTC = parseDateUTC(getLocalISODate());
                  const nextMonthUTC = addMonthsUTC(todayUTC, 1);
                  setSanctionDueDate(formatISODateOnly(nextMonthUTC));
                } else if (val === 'Gold Loan') {
                  setSanctionInterestRate(9.5);
                  setSanctionTenure(6);
                  setSanctionPrincipal(100000);
                } else if (val === 'Business Loan') {
                  setSanctionInterestRate(16);
                  setSanctionTenure(12);
                  setSanctionPrincipal(200000);
                } else {
                  setSanctionInterestRate(12);
                  setSanctionTenure(12);
                  setSanctionPrincipal(100000);
                }
              }}
              className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
            >
              {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {LOAN_TYPE_INFO[sanctionLoanType] && (
              <div className="mt-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
                <p className="text-xs text-[#555555] mb-2 leading-relaxed">{LOAN_TYPE_INFO[sanctionLoanType].description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {LOAN_TYPE_INFO[sanctionLoanType].features.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-white border border-brand/20 px-2 py-0.5 text-[10px] font-medium text-brand">
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {sanctionLoanType !== 'Gold Loan' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Loan Principal (₹)</label>
                <Input
                  type="number"
                  value={sanctionPrincipal}
                  onChange={e => setSanctionPrincipal(Number(e.target.value))}
                  min={sanctionLoanType === 'Weekly Loan' ? 10000 : 5000}
                  max={sanctionLoanType === 'Weekly Loan' ? 100000 : undefined}
                  step={1000}
                  required
                />
                {sanctionLoanType === 'Weekly Loan' && sanctionPrincipal > 100000 && (
                  <p className="mt-1 text-xs text-red-600 font-medium">⚠ Cannot exceed ₹1,00,000.</p>
                )}
                {sanctionLoanType === 'Weekly Loan' && sanctionPrincipal < 10000 && (
                  <p className="mt-1 text-xs text-red-600 font-medium">⚠ Minimum amount ₹10,000.</p>
                )}
              </div>
            )}
            <div className={sanctionLoanType === 'Gold Loan' ? 'col-span-2' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-text">Interest Rate (%)</label>
              <Input
                type="number"
                value={sanctionInterestRate}
                onChange={e => setSanctionInterestRate(Number(e.target.value))}
                min={1}
                max={100}
                step={0.1}
                required
              />
            </div>
          </div>

          {/* ── Business Loan Fields ── */}
          {sanctionLoanType === 'Business Loan' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Business Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text">Business Name <span className="text-red-500">*</span></label>
                  <Input
                    value={sanctionBusinessName}
                    onChange={e => setSanctionBusinessName(e.target.value)}
                    placeholder="e.g. Ravi Enterprises"
                    required={sanctionLoanType === 'Business Loan'}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">Business Type</label>
                  <select
                    value={sanctionBusinessType}
                    onChange={e => setSanctionBusinessType(e.target.value)}
                    className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value="">Select type…</option>
                    <option>Retail / Shop</option>
                    <option>Manufacturing</option>
                    <option>Trading</option>
                    <option>Services</option>
                    <option>Agriculture</option>
                    <option>Restaurant / Food</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">Years in Operation <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={sanctionBusinessYears}
                    onChange={e => setSanctionBusinessYears(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 5"
                  />
                  {sanctionBusinessYears !== '' && Number(sanctionBusinessYears) < 3 && (
                    <p className="mt-1 text-xs text-red-600 font-medium">⚠ Business must be at least 3 years old to qualify.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Gold Loan Fields ── */}
          {sanctionLoanType === 'Gold Loan' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Gold Weight (g)</label>
                <Input
                  type="number"
                  value={sanctionGoldWeight}
                  onChange={e => setSanctionGoldWeight(Number(e.target.value))}
                  min={0.1}
                  step={0.01}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Gold Purity (K)</label>
                <select
                  value={sanctionGoldPurity}
                  onChange={e => {
                    const purity = Number(e.target.value) as 18 | 22 | 24;
                    setSanctionGoldPurity(purity);
                    setSanctionGoldRate(GOLD_RATES[purity]);
                  }}
                  className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value={18}>18K</option>
                  <option value={22}>22K</option>
                  <option value={24}>24K</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Gold Rate (₹/g)</label>
                <Input
                  type="number"
                  value={sanctionGoldRate}
                  onChange={e => setSanctionGoldRate(Number(e.target.value))}
                  min={1}
                  step={1}
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {sanctionLoanType === 'Weekly Loan' ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Tenure</label>
                <div className="rounded-2xl border border-[#E5E5E5] bg-gray-50 px-4 py-2.5 text-sm text-text font-medium">
                  1 Month (4 Weekly Instalments)
                </div>
                <p className="mt-1 text-[10px] text-[#888888]">Fixed tenure for Weekly Loans</p>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Tenure</label>
                <div className="flex gap-2">
                  <select
                    value={[3,6,9,12,18,24,36,48,60,72,84,96,108,120].includes(sanctionTenure) ? sanctionTenure : 0}
                    onChange={e => { if (Number(e.target.value) > 0) setSanctionTenure(Number(e.target.value)); }}
                    className="flex-1 rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value={0}>Custom…</option>
                    {sanctionLoanType === 'Gold Loan'
                      ? [3, 6, 9, 12, 18, 24, 36].map(m => <option key={m} value={m}>{m} months</option>)
                      : [12, 24, 36, 48, 60, 72, 84, 96, 108, 120].map(m => <option key={m} value={m}>{m}mo ({m / 12}yr)</option>)
                    }
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={sanctionTenure}
                    onChange={e => setSanctionTenure(Math.max(1, Number(e.target.value)))}
                    className="w-20 rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-text text-center focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder="Mo"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#888888]">Select or type custom months</p>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">Due Date</label>
              <input
                type="date"
                value={sanctionDueDate}
                onChange={e => setSanctionDueDate(e.target.value)}
                className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Live Valuation — gold loans only */}
          {sanctionLoanType === 'Gold Loan' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Estimated Gold Value (₹)</label>
                <Input
                  type="number"
                  value={sanctionEstimatedGoldValue}
                  onChange={e => {
                    setSanctionEstimatedGoldValue(Number(e.target.value));
                    setIsEstimatedGoldValueManuallyEdited(true);
                  }}
                  min={1}
                  step="any"
                  placeholder="e.g. 99000"
                  required
                />
                <p className="mt-1 text-xs text-[#888888]">
                  Calculated automatically (weight × rate), but can be edited manually.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Requested Loan Principal (₹)</label>
                <Input
                  type="number"
                  value={sanctionPrincipal}
                  onChange={e => setSanctionPrincipal(Number(e.target.value))}
                  min={5000}
                  step="any"
                  placeholder="e.g. 100000"
                  required
                />
                <p className="mt-1 text-xs text-[#888888]">
                  Enter the requested amount as per the customer's wish.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Notes for Admin (optional)</label>
            <Textarea
              value={sanctionNotes}
              onChange={e => setSanctionNotes(e.target.value)}
              placeholder="Any additional details for admin review…"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full flex items-center gap-2 justify-center">
            <Send className="h-4 w-4" />
            {isLoading ? 'Submitting…' : 'Submit Sanction Request'}
          </Button>
        </form>
      </div>
    </div>
  );

  const renderMyRequests = () => {
    const filteredRequests = myRequestsSearch
      ? myRequests.filter(r =>
          r.customerName.toLowerCase().includes(myRequestsSearch.toLowerCase()) ||
          (r.loanType || '').toLowerCase().includes(myRequestsSearch.toLowerCase()) ||
          r.notes.toLowerCase().includes(myRequestsSearch.toLowerCase())
        )
      : myRequests;

    return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E5E5E5] bg-surface flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-text">My Sanction Requests</h2>
            <p className="text-xs text-[#888888] mt-0.5">Loans you requested — awaiting or reviewed by admin</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
            <input
              type="text"
              placeholder="Search by customer or loan type…"
              value={myRequestsSearch}
              onChange={e => setMyRequestsSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 w-56"
            />
          </div>
        </div>
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#888888]">{myRequestsSearch ? 'No requests match your search.' : 'No sanction requests submitted yet.'}</div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
            {filteredRequests.map(r => (
              <div key={r.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-text">{r.customerName}</div>
                    <div className="text-xs text-[#888888] mt-0.5">
                      {r.loanType && <span className="font-medium text-brand">{r.loanType} · </span>}
                      ₹{r.principal.toLocaleString('en-IN')} · {r.tenureMonths} months
                      {r.loanType === 'Gold Loan' && r.goldWeight > 0 && ` · ${r.goldWeight}g ${r.goldPurity}K`}
                    </div>
                    <div className="text-xs text-[#888888]">
                      Submitted: {new Date(r.requestedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="shrink-0">{statusBadge(r.status)}</div>
                </div>
                {r.notes && (
                  <div className="mt-3 text-xs text-[#555555] bg-surface rounded-xl p-3">
                    <span className="font-medium">Your notes:</span> {r.notes}
                  </div>
                )}
                {r.adminNotes && (
                  <div className="mt-2 text-xs text-[#555555] bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <span className="font-medium">Admin notes:</span> {r.adminNotes}
                  </div>
                )}
                {r.reviewedBy && (
                  <div className="mt-1 text-xs text-[#888888]">Reviewed by: {r.reviewedBy}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderClosures = () => {
    const pending = closeRequests.filter(r => r.status === 'pending');
    const others = closeRequests.filter(r => r.status !== 'pending');
    const sorted = [...pending, ...others];

    const cStatusBadge = (s: string) => {
      const map: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
      };
      return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>
      );
    };

    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text">Loan Closure Requests</h3>
              <p className="text-xs text-[#888888] mt-0.5">Track the status of closure requests submitted to the administrator.</p>
            </div>
            {pendingClosures > 0 && (
              <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">{pendingClosures} Pending</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-[#E5E5E5]">
                  {['Loan ID', 'Customer', 'Reason', 'Requested At', 'Status', 'Admin Remarks'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {sorted.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#888888]">No closure requests yet.</td></tr>
                )}
                {sorted.map(req => (
                  <tr key={req.id} className={`hover:bg-surface/40 ${req.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-5 py-3 font-bold font-mono text-text">{req.loanId}</td>
                    <td className="px-5 py-3 text-text">{req.customerName}</td>
                    <td className="px-5 py-3 text-[#555555] max-w-[250px] truncate">{req.reason || '—'}</td>
                    <td className="px-5 py-3 text-[#888888] whitespace-nowrap text-xs">
                      {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3">{cStatusBadge(req.status)}</td>
                    <td className="px-5 py-3 text-[#555555] text-xs">
                      {req.status === 'pending' ? (
                        <span className="text-amber-600 font-medium italic">Awaiting Admin Approval</span>
                      ) : (
                        <span>{req.adminNotes || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOutstandingEdits = () => {
    const myEdits = outstandingEditRequests.filter(r => r.requestedBy === (user?.name ?? ''));
    const pending = myEdits.filter(r => r.status === 'pending');
    const others = myEdits.filter(r => r.status !== 'pending');
    const sorted = [...pending, ...others];

    const statusBadge = (s: string) => {
      const map: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
      };
      return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>
      );
    };

    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text">My Outstanding Edit Requests</h3>
              <p className="text-xs text-[#888888] mt-0.5">Requests submitted to edit a loan's outstanding principal. Pending admin approval.</p>
            </div>
            {pendingOutstandingEdits > 0 && (
              <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">{pendingOutstandingEdits} Pending</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-[#E5E5E5]">
                  {['Loan ID', 'Customer', 'Current Outstanding', 'Requested Amount', 'Difference', 'Reason', 'Submitted', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {sorted.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-[#888888]">No outstanding edit requests yet. Use the "Edit Outstanding" button on any active loan.</td></tr>
                )}
                {sorted.map(req => {
                  const diff = req.newOutstanding - req.currentOutstanding;
                  return (
                    <tr key={req.id} className={`hover:bg-surface/40 ${req.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-3 font-bold font-mono text-text">{req.loanId}</td>
                      <td className="px-5 py-3 text-text">{req.customerName}</td>
                      <td className="px-5 py-3 text-text">₹{req.currentOutstanding.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 font-semibold text-brand">₹{req.newOutstanding.toLocaleString('en-IN')}</td>
                      <td className={`px-5 py-3 font-semibold ${diff < 0 ? 'text-emerald-600' : diff > 0 ? 'text-rose-600' : 'text-[#888888]'}`}>
                        {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}₹${Math.abs(diff).toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-5 py-3 text-[#555555] max-w-[200px] truncate">{req.reason || '—'}</td>
                      <td className="px-5 py-3 text-[#888888] whitespace-nowrap text-xs">{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-5 py-3">{statusBadge(req.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const tabContent: Record<TabKey, React.ReactNode> = {
    overview: renderOverview(),
    customers: renderCustomers(),
    loans: renderLoans(),
    sanction: renderSanctionForm(),
    'my-requests': renderMyRequests(),
    closures: renderClosures(),
    'outstanding-edits': renderOutstandingEdits(),
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5E5E5] flex flex-col transition-transform duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="p-6 border-b border-[#E5E5E5]">
          <div className="text-lg font-bold text-text">Rapid Consultancy</div>
          <div className="text-xs text-[#888888] mt-0.5">Staff Portal</div>
          {user && (
            <div className="mt-3 rounded-2xl bg-surface px-3 py-2">
              <div className="text-sm font-semibold text-text">{user.name}</div>
              <div className="text-xs text-[#888888]">{user.branch ?? 'Branch Staff'}</div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === item.key
                  ? 'bg-brand text-white'
                  : 'text-[#555555] hover:bg-surface hover:text-text'
              }`}
            >
              {item.icon}
              {item.label}
              {item.key === 'my-requests' && pendingSanctions > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 text-white text-xs px-2 py-0.5">{pendingSanctions}</span>
              )}
              {item.key === 'closures' && pendingClosures > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 text-white text-xs px-2 py-0.5">{pendingClosures}</span>
              )}
              {item.key === 'outstanding-edits' && pendingOutstandingEdits > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 text-white text-xs px-2 py-0.5">{pendingOutstandingEdits}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E5E5]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#555555] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-[#E5E5E5] px-4 py-4 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-text" />
          </button>
          <h1 className="text-lg font-bold text-text capitalize">
            {navItems.find(n => n.key === activeTab)?.label}
          </h1>
          {isLoading && <span className="ml-auto text-xs text-[#888888]">Loading…</span>}
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {tabContent[activeTab]}
        </main>
      </div>

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#E5E5E5]">
              <h2 className="text-lg font-bold text-text">Add New Customer</h2>
              <button onClick={() => setIsAddCustomerOpen(false)}><X className="h-5 w-5 text-[#888888]" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form id="add-cust-form" onSubmit={handleAddCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Full Name <span className="text-red-500">*</span></label>
                    <Input value={addCustFormName} onChange={e => setAddCustFormName(e.target.value)} placeholder="Customer name" required />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Mobile <span className="text-red-500">*</span></label>
                    <Input type="tel" value={addCustFormMobile} onChange={e => setAddCustFormMobile(e.target.value)} placeholder="10-digit mobile" required />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Email <span className="text-red-500">*</span></label>
                    <Input type="email" value={addCustFormEmail} onChange={e => setAddCustFormEmail(e.target.value)} placeholder="Email address" required />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Date of Birth</label>
                    <input
                      type="date"
                      value={addCustFormDob}
                      onChange={e => setAddCustFormDob(e.target.value)}
                      className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-text">Address</label>
                    <Textarea value={addCustFormAddress} onChange={e => setAddCustFormAddress(e.target.value)} rows={2} placeholder="Street, City" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-text">Password</label>
                    <Input value={addCustFormPassword} readOnly />
                    <p className="mt-1 text-xs text-[#888888]">Default password for new customers is <strong>Cust@123</strong>.</p>
                  </div>
                </div>
              </form>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#E5E5E5]">
              <Button type="submit" form="add-cust-form" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating…' : 'Create Customer'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsAddCustomerOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditCustomerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#E5E5E5]">
              <div>
                <h2 className="text-lg font-bold text-text">Edit Customer</h2>
                <p className="text-xs text-[#888888] mt-0.5">ID: {selectedCustomer.id}</p>
              </div>
              <button onClick={() => setIsEditCustomerOpen(false)}><X className="h-5 w-5 text-[#888888]" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form id="edit-cust-form" onSubmit={handleEditCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Full Name <span className="text-red-500">*</span></label>
                    <Input value={custFormName} onChange={e => setCustFormName(e.target.value)} placeholder="Customer name" required />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Mobile <span className="text-red-500">*</span></label>
                    <Input type="tel" value={custFormMobile} onChange={e => setCustFormMobile(e.target.value)} placeholder="10-digit mobile" required />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Email</label>
                    <Input type="email" value={custFormEmail} onChange={e => setCustFormEmail(e.target.value)} placeholder="Email address" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Date of Birth</label>
                    <input
                      type="date"
                      value={custFormDob}
                      onChange={e => setCustFormDob(e.target.value)}
                      className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-text">Address</label>
                    <Textarea value={custFormAddress} onChange={e => setCustFormAddress(e.target.value)} rows={2} placeholder="Street, City" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">Branch</label>
                    <Input value={custFormBranch} onChange={e => setCustFormBranch(e.target.value)} placeholder="Branch name" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-sm font-medium text-text">KYC Status</label>
                    <select
                      value={custFormKyc}
                      onChange={e => setCustFormKyc(e.target.value as 'Verified' | 'Pending' | 'Rejected')}
                      className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                    >
                      <option>Verified</option>
                      <option>Pending</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#E5E5E5]">
              <Button type="submit" form="edit-cust-form" disabled={isLoading} className="flex-1">
                {isLoading ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditCustomerOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* Edit Payment Schedule Modal */}
      {isEditScheduleOpen && selectedLoan && (() => {
        const schedule = buildSchedule(selectedLoan);
        const today = getTodayUTC();
        // Determine cleared months: dates strictly before nextDueDate are cleared
        const nextDue = selectedLoan.nextDueDate ? parseDateUTC(selectedLoan.nextDueDate) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4 md:p-8">
            <div className="w-full max-w-6xl rounded-3xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 flex flex-col h-full max-h-[92vh]">
              {/* Header */}
              <div className="flex justify-between items-center px-8 py-6 border-b border-[#E5E5E5]">
                <div>
                  <h2 className="text-xl font-bold text-text">Payment Schedule — {selectedLoan.loanId}</h2>
                  <p className="text-xs text-[#888888] mt-0.5">{selectedLoan.customerName} · {selectedLoan.loanType} · {selectedLoan.loanType === 'Weekly Loan' ? '4 weeks' : `${selectedLoan.tenureMonths} months`}</p>
                </div>
                <button onClick={() => setIsEditScheduleOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-[#888888]" /></button>
              </div>

              {/* Summary */}
              <div className="px-8 py-5 bg-surface border-b border-[#E5E5E5] grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold font-bold text-rose-600">Total Outstanding</span>
                  <span className="text-lg font-bold text-rose-600">₹{(selectedLoan.outstanding + selectedLoan.interestDue).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Principal Balance</span>
                  <span className="text-lg font-bold text-text">₹{selectedLoan.outstanding.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold font-medium">Interest Due</span>
                  <span className="text-lg font-bold text-text">₹{selectedLoan.interestDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Next Due Date</span>
                  <span className="text-lg font-bold text-brand">{selectedLoan.nextDueDate ? parseDateUTC(selectedLoan.nextDueDate).toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Interest Rate</span>
                  <span className="text-lg font-bold text-text">{selectedLoan.interestRate}%{selectedLoan.loanType === 'Weekly Loan' ? ' Flat' : ' p.a.'}</span>
                </div>
              </div>

              {/* Schedule table */}
              <div className="overflow-y-auto flex-1">
                {schedule.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[#888888]">No schedule available. Tenure data missing.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b border-[#E5E5E5] z-10">
                      <tr>
                        {(selectedLoan.loanType === 'Weekly Loan' ? ['Week', 'Due Date', 'Interest', 'Principal', 'Total Due', 'Status', 'Action'] : ['Month', 'Due Date', 'Interest', 'Principal', 'Total Due', 'Status', 'Action']).map(h => (
                          <th key={h} className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      {schedule.map((row, idx) => {
                        const rowDate = parseDateUTC(row.date);
                        const isCleared = nextDue ? rowDate < nextDue : rowDate < today;
                        const isNext = selectedLoan.nextDueDate === row.date;
                        return (
                          <tr key={idx} className={`${isCleared ? 'bg-emerald-50/50' : isNext ? 'bg-amber-50/60' : 'bg-white'} hover:bg-[#F7F7F8] transition-colors`}>
                            <td className="px-8 py-4 font-semibold text-[#555555]">{row.month}</td>
                            <td className="px-8 py-4 font-medium text-text whitespace-nowrap">
                              {row.dateLabel}
                              {isNext && <span className="ml-1.5 text-[9px] bg-amber-500 text-white rounded-full px-1.5 py-0.5 font-bold">NEXT</span>}
                            </td>
                            <td className="px-8 py-4 text-amber-600 font-semibold">₹{row.interestAmt.toLocaleString('en-IN')}</td>
                            <td className="px-8 py-4 text-blue-600 font-semibold">{row.principalAmt > 0 ? `₹${row.principalAmt.toLocaleString('en-IN')}` : '—'}</td>
                            <td className="px-8 py-4 font-bold text-text">₹{row.totalAmt.toLocaleString('en-IN')}</td>
                            <td className="px-8 py-4">
                              {isCleared
                                ? <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">✓ Cleared</span>
                                : isNext
                                  ? <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-semibold">Upcoming</span>
                                  : <span className="inline-flex rounded-full bg-[#F0F0F0] text-[#888888] px-2.5 py-0.5 text-xs font-semibold">Pending</span>
                              }
                            </td>
                            <td className="px-8 py-4">
                              {isCleared ? (
                                <span className="text-xs text-[#888888] italic">Done</span>
                              ) : (
                                <button
                                  disabled={clearingMonthIdx !== null}
                                  onClick={() => handleMarkCleared(selectedLoan, idx)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
                                >
                                  {clearingMonthIdx === idx ? '…' : '✓ Mark Cleared'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Gold Photo Section */}
              {(selectedLoan.loanType === 'Gold Loan' || selectedLoan.goldWeight > 0) && (
                <div className="px-8 py-5 border-t border-[#E5E5E5]">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-2">
                    <span>Gold Collateral Photo</span>
                    {uploadingGoldPhotoId === selectedLoan.id && (
                      <span className="h-3.5 w-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                    )}
                  </div>
                  <div className="flex items-start gap-4">
                    {selectedLoan.goldImageUrl ? (
                      <img src={selectedLoan.goldImageUrl} alt="Gold" className="h-28 w-44 object-cover rounded-xl border border-amber-200" />
                    ) : (
                      <div className="h-28 w-44 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 flex items-center justify-center text-xs text-amber-500 font-medium">No photo yet</div>
                    )}
                    <div>
                      <p className="text-xs text-[#555555] mb-2">{selectedLoan.goldImageUrl ? 'Replace the gold photo:' : 'Upload a photo of the gold:'}</p>
                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 transition-colors">
                        {uploadingGoldPhotoId === selectedLoan.id ? 'Uploading…' : selectedLoan.goldImageUrl ? 'Replace Photo' : 'Upload Photo'}
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingGoldPhotoId !== null}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadGoldPhoto(selectedLoan, f); e.target.value = ''; }} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="px-8 py-5 border-t border-[#E5E5E5] flex justify-end">
                <Button variant="outline" className="px-6 py-2" onClick={() => setIsEditScheduleOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Close Loan Request Modal */}
      {isCloseRequestOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#E5E5E5]">
              <div>
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-500" /> Request Loan Closure
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">{selectedLoan.loanId} · {selectedLoan.customerName}</p>
              </div>
              <button onClick={() => setIsCloseRequestOpen(false)}><X className="h-5 w-5 text-[#888888]" /></button>
            </div>
            <form onSubmit={handleRequestClose} className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-2xl p-4 text-sm border border-amber-100 space-y-1">
                <div className="flex justify-between"><span className="text-[#888888]">Loan ID:</span><span className="font-semibold font-mono">{selectedLoan.loanId}</span></div>
                <div className="flex justify-between"><span className="text-[#888888]">Customer:</span><span className="font-semibold">{selectedLoan.customerName}</span></div>
                <div className="flex justify-between"><span className="text-[#888888]">Outstanding Balance:</span><span className="font-semibold text-rose-600">₹{(selectedLoan.outstanding + selectedLoan.interestDue).toLocaleString('en-IN')}</span></div>
                <p className="text-xs text-amber-700 mt-2 font-medium">⚠ This request will be sent to admin for approval. The loan will only close upon admin confirmation.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Reason for Closure</label>
                <Textarea
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Customer fully repaid the loan, Loan matured, etc."
                  required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isLoading} className="flex-1 bg-rose-600 hover:bg-rose-700">
                  {isLoading ? 'Sending…' : 'Send Close Request'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCloseRequestOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outstanding Edit Modal */}
      {isOutstandingEditOpen && outstandingEditLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#E5E5E5]">
              <div>
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <Edit className="h-5 w-5 text-amber-500" /> Edit Outstanding Amount
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">{outstandingEditLoan.loanId} · {outstandingEditLoan.customerName}</p>
              </div>
              <button onClick={() => setIsOutstandingEditOpen(false)}><X className="h-5 w-5 text-[#888888]" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-2xl p-4 text-sm border border-amber-100 space-y-1">
                <div className="flex justify-between"><span className="text-[#888888]">Loan ID:</span><span className="font-semibold font-mono">{outstandingEditLoan.loanId}</span></div>
                <div className="flex justify-between"><span className="text-[#888888]">Customer:</span><span className="font-semibold">{outstandingEditLoan.customerName}</span></div>
                <div className="flex justify-between"><span className="text-[#888888]">Current Outstanding:</span><span className="font-semibold text-text">₹{outstandingEditLoan.outstanding.toLocaleString('en-IN')}</span></div>
                <p className="text-xs text-amber-700 mt-2 font-medium">⚠ This change requires admin approval. The actual outstanding balance will update once approved.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">New Outstanding Amount (₹)</label>
                <Input
                  type="number"
                  value={outstandingEditNewAmount === 0 ? '' : outstandingEditNewAmount}
                  onChange={e => setOutstandingEditNewAmount(Number(e.target.value))}
                  placeholder="Enter new outstanding amount"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Reason for Edit</label>
                <Textarea
                  value={outstandingEditReason}
                  onChange={e => setOutstandingEditReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Typo in initial entry, customer paid principal partially directly, etc."
                  required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button onClick={handleSubmitOutstandingEdit} disabled={isLoading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                  Submit Request
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsOutstandingEditOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

