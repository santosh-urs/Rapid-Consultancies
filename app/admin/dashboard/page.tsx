'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { calculateDynamicInterest } from '@/lib/loanUtils';
import {
  LayoutDashboard,
  Users,
  Coins,
  UserPlus,
  History,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  TrendingUp,
  AlertTriangle,
  Layers,
  Menu,
  Calculator,
  WifiOff,
  Database,
  ShieldCheck,
  UserCog,
  RefreshCw,
  XCircle,
  FileDown,
  Camera,
} from 'lucide-react';

// Interfaces
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
  avatarUrl?: string;
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
  branch: string;
  loanType: string;
  tenureMonths: number;
}

interface AccessRequest {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  dob: string;
  branch: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  password_hash?: string;
  userId?: string;
  loanType?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  admin: string;
}

interface Staff {
  id: string;
  name: string;
  mobile: string;
  email: string;
  password: string;
  branch: string;
  isActive: boolean;
  createdDate: string;
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

interface RepledgeRequest {
  id: string;
  customerId: string;
  customerName: string;
  loanId: string;
  reason: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  reviewedBy: string;
  adminNotes: string;
}

const GOLD_RATES: Record<number, number> = {
  18: 5400,
  22: 6600,
  24: 7200,
};

const isSupabaseConfigured = true;

const normalizeMobile = (m: string) => m.replace(/\D/g, '').slice(-10);

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'loans' | 'requests' | 'logs' | 'staff' | 'sanctions' | 'closures' | 'outstanding-edits'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccruing, setIsAccruing] = useState(false);

  // Database States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showDeletedCustomers, setShowDeletedCustomers] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [sanctionRequests, setSanctionRequests] = useState<SanctionRequest[]>([]);
  const [repledgeRequests, setRepledgeRequests] = useState<RepledgeRequest[]>([]);
  const [closeRequests, setCloseRequests] = useState<any[]>([]);
  const [selectedCloseReq, setSelectedCloseReq] = useState<any | null>(null);
  const [isCloseReviewOpen, setIsCloseReviewOpen] = useState(false);
  const [closeAdminNotes, setCloseAdminNotes] = useState('');

  const [outstandingEditRequests, setOutstandingEditRequests] = useState<any[]>([]);
  const [selectedOutstandingEditReq, setSelectedOutstandingEditReq] = useState<any | null>(null);
  const [isOutstandingEditReviewOpen, setIsOutstandingEditReviewOpen] = useState(false);
  const [outstandingEditAdminNotes, setOutstandingEditAdminNotes] = useState('');


  // Staff form state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormMobile, setStaffFormMobile] = useState('');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormPassword, setStaffFormPassword] = useState('Staff@123');
  const [staffFormBranch, setStaffFormBranch] = useState('Musthafa Nagar Branch');

  // Sanction review state
  const [isSanctionReviewOpen, setIsSanctionReviewOpen] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<SanctionRequest | null>(null);
  const [sanctionAdminNotes, setSanctionAdminNotes] = useState('');
  const [isRepledgeReviewOpen, setIsRepledgeReviewOpen] = useState(false);
  const [selectedRepledge, setSelectedRepledge] = useState<RepledgeRequest | null>(null);
  const [repledgeAdminNotes, setRepledgeAdminNotes] = useState('');

  // Search States
  const [customerSearch, setCustomerSearch] = useState('');
  const [loanSearch, setLoanSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [sanctionSearch, setSanctionSearch] = useState('');
  const [repledgeSearch, setRepledgeSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sanctionStatusFilter, setSanctionStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [repledgeStatusFilter, setRepledgeStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modal States
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isIssueLoanOpen, setIsIssueLoanOpen] = useState(false);
  const [isAdjustLoanOpen, setIsAdjustLoanOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Form States - Customer
  const [custFormName, setCustFormName] = useState('');
  const [custFormMobile, setCustFormMobile] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormAddress, setCustFormAddress] = useState('');
  const [custFormDob, setCustFormDob] = useState('');
  const [custFormKyc, setCustFormKyc] = useState<'Verified' | 'Pending' | 'Rejected'>('Verified');
  const [custFormBranch, setCustFormBranch] = useState('Musthafa Nagar Branch');
  const [custFormPassword, setCustFormPassword] = useState('Cust@123');

  // Form States - Loan
  const [loanFormCustomerId, setLoanFormCustomerId] = useState('');
  const [loanFormPrincipal, setLoanFormPrincipal] = useState(100000);
  const [loanFormInterestRate, setLoanFormInterestRate] = useState(9.5);
  const [loanFormGoldWeight, setLoanFormGoldWeight] = useState(15);
  const [loanFormGoldPurity, setLoanFormGoldPurity] = useState(22);
  const [loanFormEstimatedGoldValue, setLoanFormEstimatedGoldValue] = useState(99000);
  const [isLoanFormEstimatedGoldValueManuallyEdited, setIsLoanFormEstimatedGoldValueManuallyEdited] = useState(false);
  const [loanFormTenure, setLoanFormTenure] = useState(6);
  const [loanFormLoanType, setLoanFormLoanType] = useState('Gold Loan');
  const [loanFormDueDate, setLoanFormDueDate] = useState('');
  const [loanFormCustSearch, setLoanFormCustSearch] = useState('');
  const [loanFormCustDropdown, setLoanFormCustDropdown] = useState(false);

  useEffect(() => {
    if (!isLoanFormEstimatedGoldValueManuallyEdited) {
      const rate = GOLD_RATES[loanFormGoldPurity] || 6000;
      setLoanFormEstimatedGoldValue(loanFormGoldWeight * rate);
    }
  }, [loanFormGoldWeight, loanFormGoldPurity, isLoanFormEstimatedGoldValueManuallyEdited]);

  // PDF download state
  const [isPdfLoanSelectOpen, setIsPdfLoanSelectOpen] = useState(false);
  const [pdfCustomer, setPdfCustomer] = useState<Customer | null>(null);
  const [pdfCustomerLoans, setPdfCustomerLoans] = useState<Loan[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);

  // Form States - Adjust Outstanding
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustInterest, setAdjustInterest] = useState(0);
  const [adjustType, setAdjustType] = useState<'payment' | 'accrual'>('payment');
  const [adjustPaymentType, setAdjustPaymentType] = useState<'mixed' | 'principal_only'>('mixed');
  const [adjustDescription, setAdjustDescription] = useState('');

  const generateCustomerPdf = async (customer: Customer, loan: Loan | null) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFillColor(180, 0, 0);
    doc.rect(0, 0, pageW, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPID CONSULTANCY', pageW / 2, 14, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('rapidconsultancy124@gmail.com  |  +91 7670870964', pageW / 2, 22, { align: 'center' });

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(14, 27, pageW - 14, 27);

    doc.setFontSize(10);
    doc.text('Customer Statement', pageW / 2, 30, { align: 'center' });

    // ── Customer Details ─────────────────────────────────────────────────────
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', 14, 42);

    doc.setDrawColor(180, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 44, pageW - 14, 44);

    autoTable(doc, {
      startY: 46,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
      headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
      body: [
        ['Name', customer.name],
        ['Date of Birth', customer.dob || 'N/A'],
        ['Mobile', customer.mobile],
        ['Email', customer.email],
        ['Address', customer.address || 'N/A'],
        ['Branch', customer.branch],
        ['KYC Status', customer.kycStatus],
        ['Joined Date', customer.joinedDate],
      ],
    });

    // ── Loan Details ─────────────────────────────────────────────────────────
    if (loan) {
      const afterCustY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Loan Details', 14, afterCustY);

      doc.setDrawColor(180, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(14, afterCustY + 2, pageW - 14, afterCustY + 2);

      autoTable(doc, {
        startY: afterCustY + 4,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
        headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
        body: [
          ['Loan ID', loan.loanId],
          ['Loan Type', loan.loanType],
          ['Status', loan.status.charAt(0).toUpperCase() + loan.status.slice(1)],
          ['Principal Amount', `Rs. ${loan.principal.toLocaleString('en-IN')}`],
          ['Outstanding Balance', `Rs. ${loan.outstanding.toLocaleString('en-IN')}`],
          ['Interest Due', `Rs. ${loan.interestDue.toLocaleString('en-IN')}`],
          ['Total Due', `Rs. ${(loan.outstanding + loan.interestDue).toLocaleString('en-IN')}`],
          ['Interest Rate', `${loan.interestRate}% p.a.`],
          ['Tenure', `${loan.tenureMonths} months`],
          ['Start Date', loan.startDate || 'N/A'],
          ['Maturity Date', loan.maturityDate || 'N/A'],
          ['Next Due Date', loan.nextDueDate || 'N/A'],
          ...(loan.loanType === 'Gold Loan' || loan.goldWeight > 0
            ? [
                ['Gold Weight', `${loan.goldWeight} g`],
                ['Gold Purity', `${loan.goldPurity}K`],
                ['Est. Gold Value', `Rs. ${loan.estimatedGoldValue?.toLocaleString('en-IN') || 'N/A'}`],
              ]
            : []),
        ],
      });
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${new Date().toLocaleString('en-IN')}  |  Rapid Consultancy  |  rapidconsultancy124@gmail.com`,
      pageW / 2,
      pageH - 8,
      { align: 'center' },
    );

    const safeFileName = customer.name.replace(/[^a-z0-9]/gi, '_');
    doc.save(`${safeFileName}_${loan ? loan.loanId : 'profile'}.pdf`);
  };

  const handleDownloadPdfClick = (customer: Customer) => {
    const activeLoans = loans.filter(
      l => l.customerId === customer.id && (l.status === 'active' || l.status === 'overdue'),
    );
    if (activeLoans.length === 0) {
      generateCustomerPdf(customer, null);
    } else if (activeLoans.length === 1) {
      generateCustomerPdf(customer, activeLoans[0]);
    } else {
      setPdfCustomer(customer);
      setPdfCustomerLoans(activeLoans);
      setIsPdfLoanSelectOpen(true);
    }
  };

  const generateNextLoanId = (loanType: string) => {
    const prefix = loanType === 'Weekly Loan' ? 'WL' : 'GL';
    if (!loans || loans.length === 0) return `${prefix}-2101`;
    const numbers = loans
      .map(l => {
        if (!l.loanId) return 0;
        const parts = l.loanId.split('-');
        if (parts.length < 2) return 0;
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      })
      .filter(num => num < 9000);
    const maxNum = Math.max(2100, ...numbers);
    return `${prefix}-${maxNum + 1}`;
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [custRes, loanRes, reqRes, logRes, staffRes, sanctRes, closeRes, outstandingEditRes] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('loans').select('*'),
        supabase.from('access_requests').select('*'),
        supabase.from('audit_logs').select('*'),
        supabase.from('staff').select('*'),
        supabase.from('loan_sanction_requests').select('*').order('requested_date', { ascending: false }),
        supabase.from('loan_close_requests').select('*').order('requested_at', { ascending: false }),
        supabase.from('outstanding_edit_requests').select('*').order('requested_at', { ascending: false }),
      ]);

      if (custRes.error) throw custRes.error;
      if (loanRes.error) throw loanRes.error;
      if (reqRes.error) throw reqRes.error;
      if (logRes.error) throw logRes.error;

      setCustomers((custRes.data || []).map((c: any) => ({
        id: c.id, name: c.name, mobile: c.mobile, email: c.email,
        address: c.address || '', dob: c.dob || '', kycStatus: c.kyc_status,
        branch: c.branch, joinedDate: c.joined_date, password: c.password || '',
        avatarUrl: c.avatar_url || '',
      })).sort((a: any, b: any) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()));

      setLoans((loanRes.data || []).map((l: any) => {
        const goldWeight = Number(l.gold_weight);
        const loanType = l.loan_type || (goldWeight > 0 ? 'Gold Loan' : 'Loan');
        let tenureMonths = l.tenure_months ? Number(l.tenure_months) : 0;
        if (!tenureMonths && l.start_date && l.maturity_date) {
          const s = new Date(l.start_date);
          const e = new Date(l.maturity_date);
          tenureMonths = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
        }
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
          branch: l.branch,
          loanType,
          tenureMonths,
        };
      }));

      setAccessRequests((reqRes.data || []).map((r: any) => {
        let userId = '';
        let actualPasswordHash = r.password_hash || '';
        let loanType = '';

        // Parse encoded format: CUSTOMER_ID:xxx|PASSWORD:yyy|LOAN_TYPE:zzz
        if (r.password_hash && r.password_hash.startsWith('CUSTOMER_ID:')) {
          const loanTypePart = r.password_hash.split('|LOAN_TYPE:');
          const base = loanTypePart[0];
          loanType = loanTypePart[1] || '';
          const parts = base.split('|PASSWORD:');
          userId = parts[0].replace('CUSTOMER_ID:', '');
          actualPasswordHash = parts[1] || '';
        }

        return {
          id: r.id, name: r.name, mobile: r.mobile, email: r.email,
          address: r.address || '', dob: r.dob || '', branch: r.branch,
          status: r.status, requestDate: r.request_date,
          password_hash: actualPasswordHash,
          userId,
          loanType,
        };
      }).sort((a: any, b: any) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));

      setAuditLogs((logRes.data || []).map((lg: any) => ({
        id: lg.id, timestamp: lg.timestamp, action: lg.action,
        details: lg.details || '', admin: lg.admin,
      })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      if (!staffRes.error && staffRes.data) {
        setStaffList(staffRes.data.map((s: any) => ({
          id: s.id, name: s.name, mobile: s.mobile, email: s.email,
          password: s.password, branch: s.branch, isActive: s.is_active, createdDate: s.created_date,
        })));
      }

      if (!sanctRes.error && sanctRes.data) {
        setSanctionRequests(sanctRes.data.map((s: any) => {
          const meta = parseSanctionMeta(s.notes || '');
          return {
            id: s.id, staffId: s.staff_id || '', staffName: s.staff_name,
            customerId: s.customer_id || '', customerName: s.customer_name,
            customerMobile: meta.mobile,
            customerEmail: meta.email,
            customerDob: meta.dob,
            customerAddress: meta.address,
            businessName: meta.businessName,
            businessType: meta.businessType,
            businessYears: meta.businessYears,
            principal: Number(s.principal), interestRate: Number(s.interest_rate),
            goldWeight: Number(s.gold_weight), goldPurity: Number(s.gold_purity),
            estimatedGoldValue: Number(s.estimated_gold_value), tenureMonths: Number(s.tenure_months),
            branch: s.branch, notes: meta.userNotes, loanType: meta.loanType,
            requestedDueDate: meta.dueDate, status: s.status,
            requestedDate: s.requested_date,
            reviewedBy: s.reviewed_by || '', adminNotes: s.admin_notes || '',
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
          reviewedAt: r.reviewed_at,
          reviewedBy: r.reviewed_by,
        })));
      }

    } catch (error: any) {
      console.error('Supabase fetch error:', error);
      toast.push('Database error: ' + (error.message || 'Could not load data.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + real-time subscriptions for all tables
  useEffect(() => {
    fetchData();
    const tables = ['customers', 'loans', 'access_requests', 'audit_logs', 'staff', 'loan_sanction_requests', 'loan_close_requests', 'outstanding_edit_requests'];
    const channels = tables.map(table =>
      supabase.channel(`rt-admin-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, fetchData)
        .subscribe()
    );
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [fetchData]);

  const addAuditLog = async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      admin: user?.name ?? 'RAPID Administrator',
    };

    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('audit_logs').insert({
          id: newLog.id,
          timestamp: newLog.timestamp,
          action: newLog.action,
          details: newLog.details,
          admin: newLog.admin,
        });
      } catch (err) {
        console.error('Failed to save audit log to Supabase:', err);
      }
    }
  };

  // Log in check redirect
  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='));
    const role = document.cookie.split('; ').find(row => row.startsWith('auth_role='));
    if (!token || !role || role.split('=')[1] !== 'admin') {
      router.push('/admin/login');
    }
  }, [router]);

  const ltvRatio = useMemo(() => {
    if (loanFormEstimatedGoldValue === 0) return 0;
    return parseFloat(((loanFormPrincipal / loanFormEstimatedGoldValue) * 100).toFixed(1));
  }, [loanFormPrincipal, loanFormEstimatedGoldValue]);

  // Summary Metrics
  const totalOutstanding = useMemo(() => {
    return loans.reduce((sum, l) => sum + (l.status === 'active' || l.status === 'overdue' ? (l.outstanding + l.interestDue) : 0), 0);
  }, [loans]);

  const totalPrincipalRemaining = useMemo(() => {
    return loans.reduce((sum, l) => sum + (l.status === 'active' || l.status === 'overdue' ? l.outstanding : 0), 0);
  }, [loans]);

  const totalInterestDue = useMemo(() => {
    return loans.reduce((sum, l) => sum + (l.status === 'active' || l.status === 'overdue' ? l.interestDue : 0), 0);
  }, [loans]);

  const activeLoansCount = useMemo(() => {
    return loans.filter(l => l.status === 'active' || l.status === 'overdue').length;
  }, [loans]);

  const activeCustomersCount = useMemo(() => {
    return customers.filter(c => !(c.password?.startsWith('DELETED_') ?? false)).length;
  }, [customers]);

  const totalInterestGainingCurrentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return loans.reduce((sum, l) => {
      if (l.status === 'active' || l.status === 'overdue') {
        const principalBasis = Number(l.outstanding);
        const rate = Number(l.interestRate);
        const monthlyAccrual = Math.round(principalBasis * (rate / 100) * (daysInMonth / 365));
        return sum + monthlyAccrual;
      }
      return sum;
    }, 0);
  }, [loans]);

  const pendingSanctionsCount = useMemo(() =>
    sanctionRequests.filter(r => r.status === 'pending').length,
    [sanctionRequests]
  );
  const pendingCloseCount = useMemo(() =>
    closeRequests.filter(r => r.status === 'pending').length,
    [closeRequests]
  );

  const pendingRepledgeCount = useMemo(() =>
    repledgeRequests.filter(r => r.status === 'pending').length,
    [repledgeRequests]
  );

  const pendingOutstandingEditCount = useMemo(() =>
    outstandingEditRequests.filter(r => r.status === 'pending').length,
    [outstandingEditRequests]
  );

  // Deduplicated customer list (normalize +91 / 0 prefix — keep newest per mobile and deleted status)
  const uniqueCustomers = useMemo(() => {
    const seen = new Map<string, typeof customers[0]>();
    for (const c of customers) {
      const isDeleted = c.password?.startsWith('DELETED_') ?? false;
      const key = `${normalizeMobile(c.mobile)}_${isDeleted}`;
      if (!seen.has(key)) seen.set(key, c);
    }
    return Array.from(seen.values());
  }, [customers]);

  // Search Filters
  const filteredCustomers = useMemo(() => {
    return uniqueCustomers.filter(c => {
      const isDeleted = c.password?.startsWith('DELETED_') ?? false;
      const matchesSearch = c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.mobile.includes(customerSearch) ||
                            c.email.toLowerCase().includes(customerSearch.toLowerCase());
      return isDeleted === showDeletedCustomers && matchesSearch;
    });
  }, [uniqueCustomers, customerSearch, showDeletedCustomers]);

  const filteredLoans = useMemo(() => {
    return loans.filter(l =>
      l.status !== 'closed' && (
        l.loanId.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.customerName.toLowerCase().includes(loanSearch.toLowerCase())
      )
    );
  }, [loans, loanSearch]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l =>
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.admin.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [auditLogs, logSearch]);

  // --- Actions ---

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custFormName || !custFormMobile || !custFormEmail) {
      toast.push('Please fill in all required fields.');
      return;
    }

    const normNew = normalizeMobile(custFormMobile);
    const isDeleted = (c: Customer) => c.password?.startsWith('DELETED_') ?? false;
    if (customers.some(c => !isDeleted(c) && normalizeMobile(c.mobile) === normNew)) {
      toast.push('A customer with this mobile number already exists.');
      return;
    }
    if (customers.some(c => !isDeleted(c) && c.email.toLowerCase() === custFormEmail.toLowerCase().trim())) {
      toast.push('A customer with this email address already exists.');
      return;
    }
    setIsLoading(true);

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: custFormName,
      mobile: custFormMobile,
      email: custFormEmail,
      address: custFormAddress,
      dob: custFormDob,
      kycStatus: custFormKyc,
      branch: custFormBranch,
      joinedDate: new Date().toISOString().split('T')[0],
      password: custFormPassword,
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('customers').insert({
          id: newCust.id,
          name: newCust.name,
          mobile: newCust.mobile,
          email: newCust.email,
          address: newCust.address,
          dob: newCust.dob || null,
          kyc_status: newCust.kycStatus,
          branch: newCust.branch,
          joined_date: newCust.joinedDate,
          password: newCust.password,
        });
        if (error) throw error;
      }

      const updated = [newCust, ...customers];
      setCustomers(updated);

      await addAuditLog('Customer Added', `Added customer ${newCust.name} (${newCust.mobile})`);
      toast.push(`Customer ${newCust.name} successfully added.`);
      setIsAddCustomerOpen(false);
      resetCustomerForm();
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to save customer: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCustomerClick = (c: Customer) => {
    setSelectedCustomer(c);
    setCustFormName(c.name);
    setCustFormMobile(c.mobile);
    setCustFormEmail(c.email);
    setCustFormAddress(c.address);
    setCustFormDob(c.dob);
    setCustFormKyc(c.kycStatus);
    setCustFormBranch(c.branch);
    setCustFormPassword(c.password || 'Cust@123');
    setIsEditCustomerOpen(true);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('customers').update({
          name: custFormName,
          mobile: custFormMobile,
          email: custFormEmail,
          address: custFormAddress,
          dob: custFormDob || null,
          kyc_status: custFormKyc,
          branch: custFormBranch,
          password: custFormPassword,
        }).eq('id', selectedCustomer.id);
        if (error) throw error;
      }

      const updated = customers.map(c => {
        if (c.id === selectedCustomer.id) {
          return {
            ...c,
            name: custFormName,
            mobile: custFormMobile,
            email: custFormEmail,
            address: custFormAddress,
            dob: custFormDob,
            kycStatus: custFormKyc,
            branch: custFormBranch,
            password: custFormPassword,
          };
        }
        return c;
      });
      setCustomers(updated);

      await addAuditLog('Customer Updated', `Updated profile of customer ${custFormName}`);
      toast.push(`Customer profile updated successfully.`);
      setIsEditCustomerOpen(false);
      resetCustomerForm();
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to edit profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomerClick = async (c: Customer) => {
    if (!confirm(`Are you sure you want to delete customer "${c.name}"? This will permanently delete all of this customer's loans, requests, and login access.`)) return;
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        // Get all loans of this customer to delete their payments
        const { data: customerLoans } = await supabase
          .from('loans')
          .select('id, loan_id')
          .eq('customer_id', c.id);

        if (customerLoans && customerLoans.length > 0) {
          const loanDbIds = customerLoans.map((l: any) => l.id);
          const loanHumanIds = customerLoans.map((l: any) => l.loan_id);
          await Promise.all([
            supabase.from('loan_payments').delete().in('loan_db_id', loanDbIds),
            supabase.from('loan_payments').delete().in('loan_id', loanHumanIds),
          ]);
        }

        // Delete all associated database rows for this customer
        await Promise.all([
          supabase.from('loans').delete().eq('customer_id', c.id),
          supabase.from('loan_sanction_requests').delete().eq('customer_id', c.id),
          supabase.from('loan_close_requests').delete().eq('customer_id', c.id),
          supabase.from('repledge_requests').delete().eq('customer_id', c.id),
          supabase.from('access_requests').delete().or(`customer_id.eq.${c.id},mobile.eq.${c.mobile},email.eq.${c.email}`),
        ]);

        // Soft-delete the customer record: prefix password with 'DELETED_'
        const cleanPass = c.password || 'Cust@123';
        const newPass = cleanPass.startsWith('DELETED_') ? cleanPass : 'DELETED_' + cleanPass;
        const { error } = await supabase
          .from('customers')
          .update({ password: newPass })
          .eq('id', c.id);
        if (error) throw error;
      }

      // Update local state to show soft-deleted status
      const updatedCustomers = customers.map(item => {
        if (item.id === c.id) {
          const cleanPass = item.password || 'Cust@123';
          const newPass = cleanPass.startsWith('DELETED_') ? cleanPass : 'DELETED_' + cleanPass;
          return { ...item, password: newPass };
        }
        return item;
      });
      setCustomers(updatedCustomers);

      // Clean up local states of deleted data
      setLoans(prev => prev.filter(l => l.customerId !== c.id));
      setSanctionRequests(prev => prev.filter(r => r.customerId !== c.id));
      setCloseRequests(prev => prev.filter(r => r.customerId !== c.id));
      setAccessRequests(prev => prev.filter(r => r.mobile !== c.mobile && r.email !== c.email));

      await addAuditLog('Customer Deleted', `Deleted customer ${c.name} and purged all associated database records`);
      toast.push(`Customer "${c.name}" deleted and associated database records purged.`);
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to delete customer: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanFormCustomerId) {
      toast.push('Please select a customer.');
      return;
    }
    const cust = customers.find(c => c.id === loanFormCustomerId);
    if (!cust) return;
    setIsLoading(true);

    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(startDate.getMonth() + Number(loanFormTenure));

    const autoNextDue = new Date();
    if (loanFormLoanType === 'Weekly Loan') {
      autoNextDue.setDate(startDate.getDate() + 7);
    } else {
      autoNextDue.setMonth(startDate.getMonth() + 1);
    }
    const nextDueDateStr = loanFormLoanType === 'Weekly Loan'
      ? autoNextDue.toISOString().split('T')[0]
      : (loanFormDueDate || autoNextDue.toISOString().split('T')[0]);

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanId: generateNextLoanId(loanFormLoanType),
      customerId: cust.id,
      customerName: cust.name,
      status: 'active',
      principal: loanFormPrincipal,
      outstanding: loanFormPrincipal,
      interestDue: loanFormLoanType === 'Weekly Loan' ? Math.round(loanFormPrincipal * (loanFormInterestRate / 100)) : 0,
      interestRate: loanFormInterestRate,
      startDate: startDate.toISOString().split('T')[0],
      maturityDate: maturityDate.toISOString().split('T')[0],
      nextDueDate: nextDueDateStr,
      goldWeight: loanFormLoanType === 'Weekly Loan' ? 0 : loanFormGoldWeight,
      goldPurity: loanFormLoanType === 'Weekly Loan' ? 0 : loanFormGoldPurity,
      estimatedGoldValue: loanFormLoanType === 'Weekly Loan' ? 0 : loanFormEstimatedGoldValue,
      branch: cust.branch || 'Musthafa Nagar Branch',
      loanType: loanFormLoanType || 'Gold Loan',
      tenureMonths: Number(loanFormTenure) || 6,
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('loans').insert({
          id: newLoan.id,
          loan_id: newLoan.loanId,
          customer_id: newLoan.customerId,
          customer_name: newLoan.customerName,
          status: newLoan.status,
          principal: newLoan.principal,
          outstanding: newLoan.outstanding,
          interest_due: newLoan.interestDue,
          interest_rate: newLoan.interestRate,
          start_date: newLoan.startDate,
          maturity_date: newLoan.maturityDate,
          next_due_date: newLoan.nextDueDate,
          gold_weight: newLoan.goldWeight,
          gold_purity: newLoan.goldPurity,
          estimated_gold_value: newLoan.estimatedGoldValue,
          branch: newLoan.branch,
          loan_type: newLoan.loanType,
          tenure_months: newLoan.tenureMonths,
        });
        if (error) throw error;
      }

      const updated = [newLoan, ...loans];
      setLoans(updated);

      await addAuditLog('Loan Issued', `Issued ${loanFormLoanType} ${newLoan.loanId} to ${cust.name} for ₹${newLoan.principal.toLocaleString('en-IN')}. Due: ${nextDueDateStr}`);
      toast.push(`Loan ${newLoan.loanId} successfully issued.`);
      setIsIssueLoanOpen(false);
      resetLoanForm();
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to issue loan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustLoanClick = (l: Loan) => {
    setSelectedLoan(l);
    setAdjustAmount(0);
    setAdjustInterest(0);
    setAdjustType('payment');
    setAdjustPaymentType('mixed');
    setAdjustDescription('');
    setIsAdjustLoanOpen(true);
  };

  const handleAdjustLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setIsLoading(true);

    let updatedOutstanding = selectedLoan.outstanding;
    let updatedInterestDue = selectedLoan.interestDue;
    let detailMsg = '';

    if (adjustType === 'payment') {
      if (adjustPaymentType === 'principal_only') {
        // Direct principal reduction — interest is unchanged (calculated dynamically)
        updatedOutstanding = Math.max(0, updatedOutstanding - adjustAmount);
        detailMsg = `Recorded principal payment of ₹${adjustAmount.toLocaleString('en-IN')}. New principal balance: ₹${updatedOutstanding.toLocaleString('en-IN')}`;
      } else {
        // Mixed: clear interest first, remainder goes to principal
        let paymentLeft = adjustAmount;
        if (paymentLeft <= updatedInterestDue) {
          updatedInterestDue -= paymentLeft;
        } else {
          paymentLeft -= updatedInterestDue;
          updatedInterestDue = 0;
          updatedOutstanding = Math.max(0, updatedOutstanding - paymentLeft);
        }
        detailMsg = `Recorded payment of ₹${adjustAmount.toLocaleString('en-IN')}. New outstanding: ₹${updatedOutstanding.toLocaleString('en-IN')}`;
      }
    } else {
      updatedOutstanding += adjustAmount;
      updatedInterestDue += adjustInterest;
      detailMsg = `Accrued adjustments: Principal +₹${adjustAmount.toLocaleString('en-IN')}, Interest +₹${adjustInterest.toLocaleString('en-IN')}`;
    }

    const updatedStatus = updatedOutstanding === 0 && updatedInterestDue === 0 ? 'closed' : selectedLoan.status;

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('loans').update({
          outstanding: updatedOutstanding,
          interest_due: updatedInterestDue,
          status: updatedStatus,
        }).eq('id', selectedLoan.id);
        if (error) throw error;

        // Insert payment record so it appears in customer repayment history
        if (adjustType === 'payment') {
          const { error: payError } = await supabase.from('loan_payments').insert({
            id: `pay-${Date.now()}`,
            loan_id: selectedLoan.loanId,
            loan_db_id: selectedLoan.id,
            amount: adjustAmount,
            payment_type: adjustPaymentType === 'principal_only' ? 'principal' : 'mixed',
            payment_date: new Date().toISOString().split('T')[0],
            notes: adjustDescription.trim() || detailMsg,
          });
          if (payError) throw payError;
        }
      }

      const updated = loans.map(l => {
        if (l.id === selectedLoan.id) {
          return {
            ...l,
            outstanding: updatedOutstanding,
            interestDue: updatedInterestDue,
            status: updatedStatus as Loan['status'],
          };
        }
        return l;
      });
      setLoans(updated);

      await addAuditLog('Loan Adjusted', `Adjusted balance for loan ${selectedLoan.loanId}: ${detailMsg}`);
      toast.push(`Loan ${selectedLoan.loanId} updated.`);
      setIsAdjustLoanOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to adjust loan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLoanStatus = async (l: Loan) => {
    const nextStatusMap: Record<Loan['status'], Loan['status']> = {
      active: 'overdue',
      overdue: 'closed',
      closed: 'active',
      pending: 'active',
    };
    const nextStatus = nextStatusMap[l.status];
    const newOutstanding = nextStatus === 'closed' ? 0 : l.outstanding === 0 ? l.principal : l.outstanding;
    const newInterest = nextStatus === 'closed' ? 0 : l.interestDue;
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('loans').update({
          status: nextStatus,
          outstanding: newOutstanding,
          interest_due: newInterest,
        }).eq('id', l.id);
        if (error) throw error;
      }

      const updated = loans.map(item => {
        if (item.id === l.id) {
          return {
            ...item,
            status: nextStatus,
            outstanding: newOutstanding,
            interestDue: newInterest,
          };
        }
        return item;
      });
      setLoans(updated);

      await addAuditLog('Loan Status Toggled', `Changed status of loan ${l.loanId} to ${nextStatus.toUpperCase()}`);
      toast.push(`Loan ${l.loanId} status updated to ${nextStatus}.`);
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to toggle status: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccrueInterest = async () => {
    setIsAccruing(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Fetch the latest Interest Accrual log
      const { data: logs, error: logErr } = await supabase
        .from('audit_logs')
        .select('timestamp')
        .eq('action', 'Interest Accrual')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (logErr) throw logErr;

      const lastRunDateStr = logs && logs.length > 0
        ? new Date(logs[0].timestamp).toISOString().split('T')[0]
        : null;

      // 2. Fetch all active and overdue loans from database to ensure fresh data
      const { data: dbLoans, error: loanErr } = await supabase
        .from('loans')
        .select('*')
        .in('status', ['active', 'overdue']);

      if (loanErr) throw loanErr;

      const getDaysBetween = (dateStr1: string, dateStr2: string) => {
        const d1 = new Date(dateStr1);
        const d2 = new Date(dateStr2);
        d1.setUTCHours(0, 0, 0, 0);
        d2.setUTCHours(0, 0, 0, 0);
        const diffMs = d2.getTime() - d1.getTime();
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      };

      let updatedCount = 0;
      let totalAccrued = 0;

      const updatePromises = dbLoans.map(async (loan: any) => {
        const baselineDateStr = lastRunDateStr && new Date(lastRunDateStr) > new Date(loan.start_date)
          ? lastRunDateStr
          : loan.start_date;

        const elapsedDays = getDaysBetween(baselineDateStr, todayStr);
        if (elapsedDays <= 0) return;

        const principalBasis = Number(loan.principal);
        const rate = Number(loan.interest_rate);
        const accrued = Math.round(principalBasis * (rate / 100) * (elapsedDays / 365));

        if (accrued > 0) {
          const newInterestDue = Number(loan.interest_due || 0) + accrued;
          const { error: updateErr } = await supabase
            .from('loans')
            .update({ interest_due: newInterestDue })
            .eq('id', loan.id);

          if (updateErr) {
            console.error(`Error updating loan ${loan.loan_id}:`, updateErr);
          } else {
            updatedCount++;
            totalAccrued += accrued;
          }
        }
      });

      await Promise.all(updatePromises);

      // 3. Log the process in audit_logs
      if (updatedCount > 0 || totalAccrued > 0 || !lastRunDateStr) {
        await supabase
          .from('audit_logs')
          .insert({
            id: `log-accrual-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Interest Accrual',
            details: `Accrued interest manually. Updated ${updatedCount} loans. Total accrued: ₹${totalAccrued.toLocaleString('en-IN')}. Date: ${todayStr}`,
            admin: user?.name ?? 'Admin'
          });
      }

      toast.push(`Interest accrual completed. Accrued ₹${totalAccrued.toLocaleString('en-IN')} across ${updatedCount} loans.`);
      
      // Reload dashboard data
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to accrue interest: ${err.message}`);
    } finally {
      setIsAccruing(false);
    }
  };

  const handleApproveRequest = async (req: AccessRequest) => {
    setIsLoading(true);
    try {
      const custExists = req.userId ? customers.some(c => c.id === req.userId) : false;

      let newLoan: Loan | null = null;
      if (req.loanType) {
        const startDate = new Date();
        const tenureMonths = 6;
        const maturityDate = new Date();
        maturityDate.setMonth(startDate.getMonth() + tenureMonths);
        const nextDueDate = new Date();
        nextDueDate.setMonth(startDate.getMonth() + 1);

        newLoan = {
          id: `loan-${Date.now()}`,
          loanId: generateNextLoanId(req.loanType || 'Gold Loan'),
          customerId: req.userId || `cust-${Date.now()}`,
          customerName: req.name,
          status: 'active',
          principal: 10000,
          outstanding: 10000,
          interestDue: 0,
          interestRate: 9.5,
          startDate: startDate.toISOString().split('T')[0],
          maturityDate: maturityDate.toISOString().split('T')[0],
          nextDueDate: nextDueDate.toISOString().split('T')[0],
          goldWeight: 15,
          goldPurity: 22,
          estimatedGoldValue: 99000,
          branch: req.branch || 'Musthafa Nagar Branch',
          loanType: req.loanType || 'Gold Loan',
          tenureMonths: tenureMonths,
        };
      }

      if (req.userId && custExists) {
        if (isSupabaseConfigured) {
          const updateCust = supabase.from('customers').update({
            kyc_status: 'Verified',
          }).eq('id', req.userId);

          const updateReq = supabase.from('access_requests').update({
            status: 'approved',
          }).eq('id', req.id);

          const promises = [updateCust, updateReq];

          if (newLoan) {
            promises.push(
              supabase.from('loans').insert({
                id: newLoan.id,
                loan_id: newLoan.loanId,
                customer_id: newLoan.customerId,
                customer_name: newLoan.customerName,
                status: newLoan.status,
                principal: newLoan.principal,
                outstanding: newLoan.outstanding,
                interest_due: newLoan.interestDue,
                interest_rate: newLoan.interestRate,
                start_date: newLoan.startDate,
                maturity_date: newLoan.maturityDate,
                next_due_date: newLoan.nextDueDate,
                gold_weight: newLoan.goldWeight,
                gold_purity: newLoan.goldPurity,
                estimated_gold_value: newLoan.estimatedGoldValue,
                branch: newLoan.branch,
                loan_type: newLoan.loanType,
                tenure_months: newLoan.tenureMonths,
              })
            );
          }

          const results = await Promise.all(promises);
          for (const res of results) {
            if (res.error) throw res.error;
          }
        }

        // Local state update: mark existing customer as Verified
        setCustomers(prev => prev.map(c => c.id === req.userId ? { ...c, kycStatus: 'Verified' } : c));
        if (newLoan) {
          setLoans(prev => [newLoan!, ...prev]);
        }

        const updatedReqs = accessRequests.map(r => {
          if (r.id === req.id) return { ...r, status: 'approved' as const };
          return r;
        });
        setAccessRequests(updatedReqs);

        await addAuditLog('Access Request Approved', `Approved existing customer profile access/KYC verification for ${req.name}.`);
        toast.push(`Access/KYC verification approved for customer ${req.name}.`);
      } else {
        // Create new customer (or recreate if userId was provided but record was deleted/missing)
        const targetCustomerId = req.userId || (newLoan ? newLoan.customerId : `cust-${Date.now()}`);
        if (newLoan) {
          newLoan.customerId = targetCustomerId;
        }

        const newCust: Customer = {
          id: targetCustomerId,
          name: req.name,
          mobile: req.mobile,
          email: req.email,
          address: req.address,
          dob: req.dob,
          kycStatus: 'Verified',
          branch: req.branch,
          joinedDate: new Date().toISOString().split('T')[0],
          password: req.password_hash || 'Cust@123',
        };

        if (isSupabaseConfigured) {
          const insertCust = supabase.from('customers').insert({
            id: newCust.id,
            name: newCust.name,
            mobile: newCust.mobile,
            email: newCust.email,
            address: newCust.address,
            dob: newCust.dob || null,
            kyc_status: newCust.kycStatus,
            branch: newCust.branch,
            joined_date: newCust.joinedDate,
            password: newCust.password,
          });

          const updateReq = supabase.from('access_requests').update({
            status: 'approved',
          }).eq('id', req.id);

          const promises = [insertCust, updateReq];

          if (newLoan) {
            promises.push(
              supabase.from('loans').insert({
                id: newLoan.id,
                loan_id: newLoan.loanId,
                customer_id: newLoan.customerId,
                customer_name: newLoan.customerName,
                status: newLoan.status,
                principal: newLoan.principal,
                outstanding: newLoan.outstanding,
                interest_due: newLoan.interestDue,
                interest_rate: newLoan.interestRate,
                start_date: newLoan.startDate,
                maturity_date: newLoan.maturityDate,
                next_due_date: newLoan.nextDueDate,
                gold_weight: newLoan.goldWeight,
                gold_purity: newLoan.goldPurity,
                estimated_gold_value: newLoan.estimatedGoldValue,
                branch: newLoan.branch,
                loan_type: newLoan.loanType,
                tenure_months: newLoan.tenureMonths,
              })
            );
          }

          const results = await Promise.all(promises);
          for (const res of results) {
            if (res.error) throw res.error;
          }
        }

        // Local State Update
        const updatedCusts = [newCust, ...customers];
        setCustomers(updatedCusts);
        if (newLoan) {
          setLoans(prev => [newLoan!, ...prev]);
        }

        const updatedReqs = accessRequests.map(r => {
          if (r.id === req.id) return { ...r, status: 'approved' as const };
          return r;
        });
        setAccessRequests(updatedReqs);

        await addAuditLog('Access Request Approved', `Approved access for ${req.name} and auto-created customer record.`);
        toast.push(`Access approved for ${req.name}. Customer record created.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to approve request: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (req: AccessRequest) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('access_requests').update({
          status: 'rejected',
        }).eq('id', req.id);
        if (error) throw error;
      }

      const updatedReqs = accessRequests.map(r => {
        if (r.id === req.id) return { ...r, status: 'rejected' as const };
        return r;
      });
      setAccessRequests(updatedReqs);

      await addAuditLog('Access Request Rejected', `Rejected access request from ${req.name}`);
      toast.push(`Access request from ${req.name} has been rejected.`);
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to reject request: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs?')) return;
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('audit_logs').delete().neq('id', 'keep-dummy-placeholder');
        if (error) throw error;
      }
      setAuditLogs([]);
      toast.push('Audit logs cleared.');
    } catch (err: any) {
      console.error(err);
      toast.push(`Failed to clear logs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Staff Handlers ---

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormName || !staffFormMobile || !staffFormEmail) {
      toast.push('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      name: staffFormName,
      mobile: staffFormMobile,
      email: staffFormEmail,
      password: staffFormPassword,
      branch: staffFormBranch,
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0],
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('staff').insert({
          id: newStaff.id,
          name: newStaff.name,
          mobile: newStaff.mobile,
          email: newStaff.email,
          password: newStaff.password,
          branch: newStaff.branch,
          is_active: true,
          created_date: newStaff.createdDate,
          role: 'staff',
        });
        if (error) throw error;
      }
      setStaffList(prev => [newStaff, ...prev]);
      await addAuditLog('Staff Added', `Admin added staff member ${newStaff.name} (${newStaff.mobile})`);
      toast.push(`Staff member ${newStaff.name} added successfully.`);
      setIsAddStaffOpen(false);
      setStaffFormName(''); setStaffFormMobile(''); setStaffFormEmail(''); setStaffFormPassword('Staff@123');
    } catch (err: any) {
      toast.push(`Failed to add staff: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('staff').update({
          name: staffFormName,
          email: staffFormEmail,
          password: staffFormPassword,
          branch: staffFormBranch,
        }).eq('id', selectedStaff.id);
        if (error) throw error;
      }
      setStaffList(prev => prev.map(s => s.id === selectedStaff.id
        ? { ...s, name: staffFormName, email: staffFormEmail, password: staffFormPassword, branch: staffFormBranch }
        : s
      ));
      await addAuditLog('Staff Updated', `Admin updated profile of staff ${staffFormName}`);
      toast.push('Staff profile updated.');
      setIsEditStaffOpen(false);
    } catch (err: any) {
      toast.push(`Failed to update staff: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStaffActive = async (s: Staff) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('staff').update({ is_active: !s.isActive }).eq('id', s.id);
        if (error) throw error;
      }
      setStaffList(prev => prev.map(m => m.id === s.id ? { ...m, isActive: !m.isActive } : m));
      await addAuditLog('Staff Status Changed', `${s.name} marked as ${!s.isActive ? 'Active' : 'Inactive'}`);
      toast.push(`${s.name} is now ${!s.isActive ? 'active' : 'inactive'}.`);
    } catch (err: any) {
      toast.push(`Failed to update status: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaffClick = async (s: Staff) => {
    if (!confirm(`Are you sure you want to delete staff member ${s.name}? This action cannot be undone and they will no longer be able to log in.`)) {
      return;
    }
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('staff').delete().eq('id', s.id);
        if (error) throw error;
      }
      setStaffList(prev => prev.filter(m => m.id !== s.id));
      await addAuditLog('Staff Deleted', `Admin deleted staff member ${s.name} (${s.mobile})`);
      toast.push(`Staff member ${s.name} has been deleted.`);
    } catch (err: any) {
      toast.push(`Failed to delete staff: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Sanction Request Handlers ---

  const handleApproveSanction = async (req: SanctionRequest) => {
    setIsLoading(true);
    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(startDate.getMonth() + req.tenureMonths);
    const autoNextDue = new Date();
    if (req.loanType === 'Weekly Loan') {
      autoNextDue.setDate(startDate.getDate() + 7);
    } else {
      autoNextDue.setMonth(startDate.getMonth() + 1);
    }
    const sanctionNextDue = req.loanType === 'Weekly Loan'
      ? autoNextDue.toISOString().split('T')[0]
      : (req.requestedDueDate || autoNextDue.toISOString().split('T')[0]);

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanId: generateNextLoanId(req.loanType || 'Gold Loan'),
      customerId: req.customerId,
      customerName: req.customerName,
      status: 'active',
      principal: req.principal,
      outstanding: req.principal,
      interestDue: req.loanType === 'Weekly Loan' ? Math.round(req.principal * (req.interestRate / 100)) : 0,
      interestRate: req.interestRate,
      startDate: startDate.toISOString().split('T')[0],
      maturityDate: maturityDate.toISOString().split('T')[0],
      nextDueDate: sanctionNextDue,
      goldWeight: req.goldWeight,
      goldPurity: req.goldPurity,
      estimatedGoldValue: req.estimatedGoldValue,
      branch: req.branch,
      loanType: req.loanType || 'Gold Loan',
      tenureMonths: req.tenureMonths || 6,
    };

    try {
      if (isSupabaseConfigured) {
        let custId = req.customerId;

        // Create customer account only if customerId is not already set (meaning it is a new customer request)
        if (!custId) {
          custId = `cust-${Date.now()}`;
          const custPassword = req.customerMobile || req.customerName.replace(/\s+/g, '').toLowerCase();
          const { error: custErr } = await supabase.from('customers').insert({
            id: custId,
            name: req.customerName,
            mobile: req.customerMobile || '',
            email: req.customerEmail || '',
            address: req.customerAddress || '',
            dob: req.customerDob || null,
            kyc_status: 'Pending',
            branch: req.branch,
            joined_date: startDate.toISOString().split('T')[0],
            password: custPassword,
          });
          if (custErr) throw custErr;
        }

        // Update loan with real customer id
        newLoan.customerId = custId;

        // Step 2: Create the loan
        const { error: loanErr } = await supabase.from('loans').insert({
          id: newLoan.id,
          loan_id: newLoan.loanId,
          customer_id: custId,
          customer_name: newLoan.customerName,
          status: newLoan.status,
          principal: newLoan.principal,
          outstanding: newLoan.outstanding,
          interest_due: newLoan.interestDue,
          interest_rate: newLoan.interestRate,
          start_date: newLoan.startDate,
          maturity_date: newLoan.maturityDate,
          next_due_date: newLoan.nextDueDate,
          gold_weight: newLoan.goldWeight,
          gold_purity: newLoan.goldPurity,
          estimated_gold_value: newLoan.estimatedGoldValue,
          branch: newLoan.branch,
          loan_type: newLoan.loanType,
          tenure_months: newLoan.tenureMonths,
        });
        if (loanErr) throw loanErr;

        // Step 3: Mark sanction as approved
        const { error: sanctErr } = await supabase.from('loan_sanction_requests').update({
          status: 'approved',
          reviewed_by: user?.name ?? 'Admin',
          reviewed_date: new Date().toISOString(),
          admin_notes: sanctionAdminNotes,
          customer_id: custId,
        }).eq('id', req.id);
        if (sanctErr) throw sanctErr;

        // Refresh customers list
        const { data: newCusts } = await supabase.from('customers').select('*');
        if (newCusts) {
          setCustomers(newCusts.map((c: any) => ({
            id: c.id, name: c.name, mobile: c.mobile, email: c.email,
            address: c.address || '', dob: c.dob || '',
            kycStatus: c.kyc_status, branch: c.branch, joinedDate: c.joined_date,
            password: c.password || '',
          })));
        }
      }

      setLoans(prev => [newLoan, ...prev]);
      setSanctionRequests(prev => prev.map(r => r.id === req.id
        ? { ...r, status: 'approved', reviewedBy: user?.name ?? 'Admin', adminNotes: sanctionAdminNotes }
        : r
      ));
      await addAuditLog('Loan Sanction Approved', `Admin approved ${req.loanType || 'Gold Loan'} sanction for ${req.customerName} — Loan ${newLoan.loanId} created. Customer login: mobile number as password. Requested by ${req.staffName}.`);
      toast.push(`✅ Approved! Loan ${newLoan.loanId} created. ${req.customerName} can now log in with their mobile number.`);
      setIsSanctionReviewOpen(false);
      setSanctionAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed to approve sanction: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectSanction = async (req: SanctionRequest) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('loan_sanction_requests').update({
          status: 'rejected',
          reviewed_by: user?.name ?? 'Admin',
          reviewed_date: new Date().toISOString(),
          admin_notes: sanctionAdminNotes,
        }).eq('id', req.id);
        if (error) throw error;
      }
      setSanctionRequests(prev => prev.map(r => r.id === req.id
        ? { ...r, status: 'rejected', reviewedBy: user?.name ?? 'Admin', adminNotes: sanctionAdminNotes }
        : r
      ));
      await addAuditLog('Loan Sanction Rejected', `Admin rejected sanction request from ${req.staffName} for ${req.customerName}.`);
      toast.push(`Sanction request from ${req.staffName} rejected.`);
      setIsSanctionReviewOpen(false);
      setSanctionAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed to reject sanction: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRepledge = async (req: RepledgeRequest) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('repledge_requests').update({
        status: 'approved',
        decided_at: new Date().toISOString(),
        admin_note: repledgeAdminNotes,
      }).eq('id', Number(req.id));
      if (error) throw error;
      setRepledgeRequests(prev => prev.map(r => r.id === req.id
        ? { ...r, status: 'approved', reviewedBy: user?.name ?? 'Admin', adminNotes: repledgeAdminNotes }
        : r
      ));
      await addAuditLog('Re-Pledge Approved', `Admin approved re-pledge request from ${req.customerName} for loan ${req.loanId}.`);
      toast.push(`Re-pledge request from ${req.customerName} approved.`);
      setIsRepledgeReviewOpen(false);
      setRepledgeAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed to approve re-pledge: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRepledge = async (req: RepledgeRequest) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('repledge_requests').update({
        status: 'rejected',
        decided_at: new Date().toISOString(),
        admin_note: repledgeAdminNotes,
      }).eq('id', Number(req.id));
      if (error) throw error;
      setRepledgeRequests(prev => prev.map(r => r.id === req.id
        ? { ...r, status: 'rejected', reviewedBy: user?.name ?? 'Admin', adminNotes: repledgeAdminNotes }
        : r
      ));
      await addAuditLog('Re-Pledge Rejected', `Admin rejected re-pledge request from ${req.customerName} for loan ${req.loanId}.`);
      toast.push(`Re-pledge request from ${req.customerName} rejected.`);
      setIsRepledgeReviewOpen(false);
      setRepledgeAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed to reject re-pledge: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCustomerForm = () => {
    setSelectedCustomer(null);
    setCustFormName('');
    setCustFormMobile('');
    setCustFormEmail('');
    setCustFormAddress('');
    setCustFormDob('');
    setCustFormKyc('Verified');
    setCustFormPassword('Cust@123');
  };

  const resetLoanForm = () => {
    setLoanFormCustomerId('');
    setLoanFormCustSearch('');
    setLoanFormPrincipal(100000);
    setLoanFormInterestRate(9.5);
    setLoanFormGoldWeight(15);
    setLoanFormGoldPurity(22);
    setLoanFormEstimatedGoldValue(99000);
    setIsLoanFormEstimatedGoldValueManuallyEdited(false);
    setLoanFormTenure(6);
    setLoanFormLoanType('Gold Loan');
    setLoanFormDueDate('');
  };

  // --- Sub-Renders ---

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metric Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-brand/10 p-4 text-brand">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#888888]">Customers</div>
            <div className="mt-1 text-2xl font-bold text-text">{activeCustomersCount}</div>
            <div className="text-xs text-[#555555]">Active database</div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#888888]">Active Loans</div>
            <div className="mt-1 text-2xl font-bold text-text">{activeLoansCount}</div>
            <div className="text-xs text-[#555555]">Accruing interest</div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#888888]">Total Outstanding</div>
            <div className="mt-1 text-2xl font-bold text-text">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            <div className="text-xs text-[#555555]">Principal: ₹{totalPrincipalRemaining.toLocaleString('en-IN')} · Interest: ₹{totalInterestDue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-600">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#888888]">Interest Gaining</div>
            <div className="mt-1 text-2xl font-bold text-text">₹{totalInterestGainingCurrentMonth.toLocaleString('en-IN')}</div>
            <div className="text-xs text-[#555555]">Gained/accruing this month</div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-violet-50 p-4 text-violet-600">
            <UserCog className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#888888]">Staff Members</div>
            <div className="mt-1 text-2xl font-bold text-text">{staffList.length}</div>
            <div className="text-xs text-[#555555]">{staffList.filter(s => s.isActive).length} active</div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-rose-50 p-4 text-rose-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#888888]">Loan Sanctions</div>
            <div className="mt-1 text-2xl font-bold text-text">{pendingSanctionsCount}</div>
            <div className="text-xs text-[#555555]">Pending approval</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Loan Overview */}
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand" /> Active Portfolio Summary
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-[#F0F0F0] pb-2 text-sm">
              <span className="text-[#555555]">Total Principal Disbursed:</span>
              <span className="font-semibold text-text">
                ₹{loans.reduce((sum, l) => sum + (l.status === 'active' || l.status === 'overdue' ? l.principal : 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#F0F0F0] pb-2 text-sm">
              <span className="text-[#555555]">Avg. Interest Rate:</span>
              <span className="font-semibold text-text">9.5% per annum</span>
            </div>
            <div className="flex justify-between border-b border-[#F0F0F0] pb-2 text-sm">
              <span className="text-[#555555]">Gold collateral held:</span>
              <span className="font-semibold text-text">
                {loans.reduce((sum, l) => sum + (l.status === 'active' || l.status === 'overdue' ? l.goldWeight : 0), 0)} grams
              </span>
            </div>
            <div className="flex justify-between pb-2 text-sm">
              <span className="text-[#555555]">Estimated Value of Collateral:</span>
              <span className="font-semibold text-emerald-600">
                ₹{loans.reduce((sum, l) => sum + (l.status === 'active' || l.status === 'overdue' ? l.estimatedGoldValue : 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-surface p-4 text-xs text-[#555555] border border-[#E5E5E5]">
            💡 Outstanding loan amounts automatically update as interest accrues or payments are logged. Use the <strong>Loans</strong> tab to adjust balances.
          </div>
        </div>

        {/* Timeline Log */}
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text flex items-center gap-2">
              <History className="h-5 w-5 text-brand" /> Recent Operations
            </h2>
            <Button variant="ghost" className="text-xs py-1 px-3" onClick={() => setActiveTab('logs')}>
              View all
            </Button>
          </div>
          <div className="space-y-4">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Check className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-text">{log.action}</span>
                    <span className="text-xs text-[#888888]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-[#555555] mt-1">{log.details}</p>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="py-6 text-center text-[#888888] text-sm">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const handleUploadAvatar = async (customer: Customer, file: File) => {
    setUploadingAvatarId(customer.id);
    try {
      const ext = file.name.split('.').pop();
      const path = `${customer.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('customers').update({ avatar_url: publicUrl }).eq('id', customer.id);
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, avatarUrl: publicUrl } : c));
      toast({ title: 'Photo updated', description: `Profile photo set for ${customer.name}` });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload photo. Check storage bucket.', variant: 'destructive' });
    } finally {
      setUploadingAvatarId(null);
    }
  };

  const renderCustomers = () => (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-3xl border border-[#E5E5E5]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              placeholder="Search by name, mobile, email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#E5E5E5] bg-surface pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-2xl border border-[#E5E5E5] shrink-0">
            <button
              onClick={() => setShowDeletedCustomers(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !showDeletedCustomers
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-[#555555] hover:text-text'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowDeletedCustomers(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                showDeletedCustomers
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#555555] hover:text-text'
              }`}
            >
              Deleted
            </button>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-surface">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">KYC Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Branch</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Joined Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#888888]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-[#E5E5E5]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-text">{c.name}</div>
                        <div className="text-xs text-[#888888]">DOB: {c.dob || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-text text-sm">{c.mobile}</div>
                    <div className="text-xs text-[#888888]">{c.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {c.kycStatus === 'Verified' && (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Verified</span>
                    )}
                    {c.kycStatus === 'Pending' && (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>
                    )}
                    {c.kycStatus === 'Rejected' && (
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Rejected</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">{c.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">{c.joinedDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {showDeletedCustomers ? (
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Deleted</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <label className="cursor-pointer p-2 h-auto text-purple-600 hover:bg-purple-50 rounded-lg inline-flex items-center" title="Upload profile photo">
                          {uploadingAvatarId === c.id
                            ? <span className="h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
                            : <Camera className="h-4 w-4" />
                          }
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAvatar(c, f); e.target.value = ''; }} />
                        </label>
                        <Button variant="ghost" onClick={() => handleDownloadPdfClick(c)} className="p-2 h-auto text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Download PDF">
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleEditCustomerClick(c)} className="p-2 h-auto text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleDeleteCustomerClick(c)} className="p-2 h-auto text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#888888] text-sm">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-3xl border border-[#E5E5E5]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search by loan ID or customer..."
            value={loanSearch}
            onChange={(e) => setLoanSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-surface pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAccrueInterest}
            disabled={isAccruing || isLoading}
            className="flex items-center gap-2 py-2.5 border-[#E5E5E5] hover:bg-surface text-text font-semibold rounded-2xl"
          >
            <RefreshCw className={`h-4 w-4 ${isAccruing ? 'animate-spin' : ''}`} />
            {isAccruing ? 'Accruing...' : 'Accrue Interest'}
          </Button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-surface">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Loan ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Date Applied</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Valuation & Principal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Outstanding & Int.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Due Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#888888]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredLoans.map((l) => (
                <tr key={l.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold rounded bg-[#F0F0F0] px-2 py-1 text-text">{l.loanId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text">{l.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">
                    {l.startDate ? new Date(l.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-text text-sm">₹{l.principal.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-[#888888]">Gold: {l.goldWeight}g ({l.goldPurity}K) - Est. ₹{l.estimatedGoldValue?.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-rose-600 font-semibold text-sm">₹{(l.outstanding + l.interestDue).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-[#888888]">Principal: ₹{l.outstanding.toLocaleString('en-IN')} · Int: ₹{l.interestDue.toLocaleString('en-IN')} ({l.interestRate}%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {l.status === 'active' && (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>
                    )}
                    {l.status === 'overdue' && (
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 animate-pulse">Overdue</span>
                    )}
                    {l.status === 'closed' && (
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Closed</span>
                    )}
                    {l.status === 'pending' && (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">
                    {l.status !== 'closed' ? l.nextDueDate : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="text-xs py-1.5 px-3 rounded-xl" onClick={() => handleAdjustLoanClick(l)} disabled={l.status === 'closed'}>
                        Adjust
                      </Button>
                      <Button variant="ghost" className="text-xs py-1.5 px-3 text-[#555555] rounded-xl hover:bg-surface" onClick={() => handleToggleLoanStatus(l)}>
                        Status
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#888888] text-sm">
                    No loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => {
    const searchedRequests = requestSearch
      ? accessRequests.filter(r =>
          r.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.mobile.includes(requestSearch) ||
          r.email.toLowerCase().includes(requestSearch.toLowerCase()) ||
          (r.loanType || '').toLowerCase().includes(requestSearch.toLowerCase())
        )
      : accessRequests;

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-3xl border border-[#E5E5E5] text-sm text-[#555555]">
          📋 These are customers who viewed our loan products and indicated their interest in applying.
        </div>

        {/* Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
            <input type="text" placeholder="Search by name, mobile, email or loan type…" value={requestSearch}
              onChange={e => setRequestSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#E5E5E5] bg-white pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>
        </div>

        {/* Requests Table */}
        <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-surface">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Interested Loan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Address & DOB</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Interest Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {searchedRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-text">{r.name}</div>
                      <div className="text-xs text-[#888888]">{r.mobile} | {r.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {r.loanType ? (
                        <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                          {r.loanType}
                        </span>
                      ) : (
                        <span className="text-xs text-[#888888] italic">General Interest</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-[#555555] max-w-[200px] truncate">{r.address}</div>
                      <div className="text-xs text-[#888888]">DOB: {r.dob}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">{r.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">{r.requestDate}</td>
                  </tr>
                ))}
                {searchedRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#888888] text-sm">
                      No interested customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLogs = () => (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-3xl border border-[#E5E5E5]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search logs by action, details, admin..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-surface pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <Button variant="outline" onClick={handleClearLogs} className="text-rose-600 border-rose-600 hover:bg-rose-50 py-2.5">
          Clear Logs
        </Button>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-surface">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">
                    {new Date(l.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex rounded bg-[#F0F0F0] px-2.5 py-1 text-xs font-semibold text-text">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#555555] max-w-md break-words">{l.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text">{l.admin}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#888888] text-sm">
                    No audit logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStaff = () => {
    const filteredStaff = staffSearch
      ? staffList.filter(s =>
          s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
          s.mobile.includes(staffSearch) ||
          s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
          s.branch.toLowerCase().includes(staffSearch.toLowerCase())
        )
      : staffList;

    return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-3xl border border-[#E5E5E5]">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input type="text" placeholder="Search by name, mobile, email or branch…" value={staffSearch}
            onChange={e => setStaffSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-white pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand" />
        </div>
        <Button onClick={() => { setStaffFormName(''); setStaffFormMobile(''); setStaffFormEmail(''); setStaffFormPassword('Staff@123'); setStaffFormBranch('Musthafa Nagar Branch'); setIsAddStaffOpen(true); }} className="flex items-center gap-2 py-2.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-surface">
                {['Name', 'Contact', 'Branch', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredStaff.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#888888]">{staffSearch ? 'No staff match your search.' : 'No staff members found.'}</td></tr>
              )}
              {filteredStaff.map(s => (
                <tr key={s.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-text">{s.name}</div>
                    <div className="text-xs text-[#888888]">{s.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{s.mobile}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">{s.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {s.isActive
                      ? <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>
                      : <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">Inactive</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#888888]">{s.createdDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="ghost" className="p-2 h-auto text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => {
                        setSelectedStaff(s);
                        setStaffFormName(s.name);
                        setStaffFormMobile(s.mobile);
                        setStaffFormEmail(s.email);
                        setStaffFormPassword(s.password);
                        setStaffFormBranch(s.branch);
                        setIsEditStaffOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" className={`p-2 h-auto rounded-lg text-xs font-semibold ${s.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => handleToggleStaffActive(s)}>
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="ghost" className="p-2 h-auto text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDeleteStaffClick(s)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
  };

  const renderSanctions = () => {
    const searchedSanctions = sanctionSearch
      ? sanctionRequests.filter(r =>
          r.staffName.toLowerCase().includes(sanctionSearch.toLowerCase()) ||
          r.customerName.toLowerCase().includes(sanctionSearch.toLowerCase()) ||
          (r.loanType || '').toLowerCase().includes(sanctionSearch.toLowerCase())
        )
      : sanctionRequests;

    const filteredSanctions = sanctionStatusFilter === 'all'
      ? searchedSanctions
      : searchedSanctions.filter(r => r.status === sanctionStatusFilter);

    const counts = {
      all: searchedSanctions.length,
      pending: searchedSanctions.filter(r => r.status === 'pending').length,
      approved: searchedSanctions.filter(r => r.status === 'approved').length,
      rejected: searchedSanctions.filter(r => r.status === 'rejected').length,
    };

    const tabs: { key: 'all' | 'pending' | 'approved' | 'rejected'; label: string; activeClass: string }[] = [
      { key: 'all', label: 'All', activeClass: 'bg-brand text-white border-brand' },
      { key: 'pending', label: 'Pending', activeClass: 'bg-amber-500 text-white border-amber-500' },
      { key: 'approved', label: 'Approved', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
      { key: 'rejected', label: 'Rejected', activeClass: 'bg-rose-600 text-white border-rose-600' },
    ];

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-3xl border border-[#E5E5E5] text-sm text-[#555555]">
          Loan sanction requests submitted by staff. Approving a request creates the loan immediately and notifies the staff member.
        </div>

        {/* Search + Filter Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
            <input type="text" placeholder="Search by staff, customer or loan type…" value={sanctionSearch}
              onChange={e => setSanctionSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#E5E5E5] bg-white pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const isActive = sanctionStatusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSanctionStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive ? tab.activeClass : 'bg-white border-[#E5E5E5] text-[#555555] hover:border-brand/40 hover:text-brand'
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F0F0F0] text-[#555555]'
                  }`}>
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-surface">
                   {['Staff', 'Customer', 'Loan Details', 'Collateral / Details', 'Status', 'Requested', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredSanctions.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#888888]">No {sanctionStatusFilter === 'all' ? '' : sanctionStatusFilter + ' '}sanction requests.</td></tr>
                )}
                {filteredSanctions.map(r => (
                  <tr key={r.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-text text-sm">{r.staffName}</div>
                      <div className="text-xs text-[#888888]">{r.branch}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text font-semibold flex items-center gap-1.5">
                        {r.customerName}
                        {r.customerId && (
                          <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[9px] font-bold">
                            Additional Loan
                          </span>
                        )}
                      </div>
                      {r.loanType && <span className="inline-flex mt-0.5 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">{r.loanType}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-text">₹{r.principal.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-[#888888]">{r.interestRate}% · {r.tenureMonths} months{r.requestedDueDate ? ` · Due ${r.requestedDueDate}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {r.loanType === 'Gold Loan' ? (
                        <>
                          <div className="text-sm text-text">{r.goldWeight}g · {r.goldPurity}K</div>
                          <div className="text-xs text-[#888888]">Est. ₹{r.estimatedGoldValue.toLocaleString('en-IN')}</div>
                        </>
                      ) : r.loanType === 'Business Loan' ? (
                        <>
                          <div className="text-sm text-text font-medium">{(r as any).businessName || '—'}</div>
                          <div className="text-xs text-[#888888]">{(r as any).businessType || 'Business'}{(r as any).businessYears ? ` · ${(r as any).businessYears} yrs` : ''}</div>
                        </>
                      ) : (
                        <div className="text-xs text-[#888888] italic">{r.loanType || 'General Loan'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {r.status === 'pending' && <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>}
                      {r.status === 'approved' && <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Approved</span>}
                      {r.status === 'rejected' && <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Rejected</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">
                      {new Date(r.requestedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {r.status === 'pending' ? (
                        <Button variant="outline" className="text-xs py-1.5 px-3 rounded-xl" onClick={() => {
                          setSelectedSanction(r);
                          setSanctionAdminNotes('');
                          setIsSanctionReviewOpen(true);
                        }}>
                          Review
                        </Button>
                      ) : (
                        <span className="text-xs text-[#888888] italic">
                          {r.reviewedBy ? `by ${r.reviewedBy}` : 'Completed'}
                        </span>
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

  // --- Loan Close Request Handlers ---
  const handleApproveClosure = async (req: any) => {
    setIsLoading(true);
    try {
      // Mark close request as approved
      await supabase.from('loan_close_requests').update({
        status: 'approved',
        admin_notes: closeAdminNotes,
        reviewed_by: user?.name ?? 'Admin',
        reviewed_at: new Date().toISOString(),
      }).eq('id', req.id);

      // Update loan status to closed
      await supabase.from('loans').update({
        status: 'closed',
        outstanding: 0,
        interest_due: 0,
      }).eq('loan_id', req.loanId);

      setCloseRequests(prev => prev.map(r =>
        r.id === req.id ? { ...r, status: 'approved', adminNotes: closeAdminNotes, reviewedBy: user?.name } : r
      ));
      setLoans(prev => prev.map(l =>
        l.loanId === req.loanId ? { ...l, status: 'closed' as const, outstanding: 0, interestDue: 0 } : l
      ));

      await addAuditLog('Loan Closed', `Admin approved closure of loan ${req.loanId} for ${req.customerName}. ${closeAdminNotes ? 'Note: ' + closeAdminNotes : ''}`);
      toast.push(`Loan ${req.loanId} closed successfully.`);
      setIsCloseReviewOpen(false);
      setCloseAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed to close loan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectClosure = async (req: any) => {
    setIsLoading(true);
    try {
      await supabase.from('loan_close_requests').update({
        status: 'rejected',
        admin_notes: closeAdminNotes,
        reviewed_by: user?.name ?? 'Admin',
        reviewed_at: new Date().toISOString(),
      }).eq('id', req.id);

      setCloseRequests(prev => prev.map(r =>
        r.id === req.id ? { ...r, status: 'rejected', adminNotes: closeAdminNotes, reviewedBy: user?.name } : r
      ));

      await addAuditLog('Loan Closure Rejected', `Admin rejected closure request for loan ${req.loanId} from ${req.customerName}.`);
      toast.push('Closure request rejected.');
      setIsCloseReviewOpen(false);
      setCloseAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Outstanding Edit Request Handlers ---
  const handleApproveOutstandingEdit = async (req: any) => {
    setIsLoading(true);
    try {
      // 1. Mark request as approved in database
      const { error: reqErr } = await supabase.from('outstanding_edit_requests').update({
        status: 'approved',
        admin_notes: outstandingEditAdminNotes,
        reviewed_by: user?.name ?? 'Admin',
        reviewed_at: new Date().toISOString(),
      }).eq('id', req.id);
      if (reqErr) throw reqErr;

      // 2. Update loan outstanding amount in database
      const { error: loanErr } = await supabase.from('loans').update({
        outstanding: req.newOutstanding,
      }).eq('id', req.loanDbId);
      if (loanErr) throw loanErr;

      // Update state locally
      setOutstandingEditRequests(prev => prev.map(r =>
        r.id === req.id ? { ...r, status: 'approved', adminNotes: outstandingEditAdminNotes, reviewedBy: user?.name } : r
      ));
      setLoans(prev => prev.map(l =>
        l.id === req.loanDbId ? { ...l, outstanding: req.newOutstanding } : l
      ));

      await addAuditLog('Loan Outstanding Edited', `Admin approved outstanding edit for loan ${req.loanId} (${req.customerName}) from ₹${req.currentOutstanding.toLocaleString('en-IN')} to ₹${req.newOutstanding.toLocaleString('en-IN')}. ${outstandingEditAdminNotes ? 'Note: ' + outstandingEditAdminNotes : ''}`);
      toast.push(`Outstanding amount updated for ${req.loanId}.`);
      setIsOutstandingEditReviewOpen(false);
      setOutstandingEditAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed to approve: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectOutstandingEdit = async (req: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('outstanding_edit_requests').update({
        status: 'rejected',
        admin_notes: outstandingEditAdminNotes,
        reviewed_by: user?.name ?? 'Admin',
        reviewed_at: new Date().toISOString(),
      }).eq('id', req.id);
      if (error) throw error;

      setOutstandingEditRequests(prev => prev.map(r =>
        r.id === req.id ? { ...r, status: 'rejected', adminNotes: outstandingEditAdminNotes, reviewedBy: user?.name } : r
      ));

      await addAuditLog('Loan Outstanding Edit Rejected', `Admin rejected outstanding edit request for loan ${req.loanId} from ${req.customerName}.`);
      toast.push('Outstanding edit request rejected.');
      setIsOutstandingEditReviewOpen(false);
      setOutstandingEditAdminNotes('');
    } catch (err: any) {
      toast.push(`Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderClosures = () => {
    const pending = closeRequests.filter(r => r.status === 'pending');
    const others = closeRequests.filter(r => r.status !== 'pending');
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
              <h3 className="font-bold text-text">Loan Closure Requests</h3>
              <p className="text-xs text-[#888888] mt-0.5">Staff-submitted requests to close a loan. Approving marks the loan as Closed.</p>
            </div>
            {pendingCloseCount > 0 && (
              <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">{pendingCloseCount} Pending</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-[#E5E5E5]">
                  {['Loan ID', 'Customer', 'Requested By', 'Reason', 'Requested At', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {sorted.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#888888]">No closure requests yet.</td></tr>
                )}
                {sorted.map(req => (
                  <tr key={req.id} className={`hover:bg-surface/40 ${req.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-5 py-3 font-bold font-mono text-text">{req.loanId}</td>
                    <td className="px-5 py-3 text-text">{req.customerName}</td>
                    <td className="px-5 py-3 text-[#555555]">{req.requestedBy}</td>
                    <td className="px-5 py-3 text-[#555555] max-w-[200px] truncate">{req.reason || '—'}</td>
                    <td className="px-5 py-3 text-[#888888] whitespace-nowrap text-xs">{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-5 py-3">{statusBadge(req.status)}</td>
                    <td className="px-5 py-3">
                      {req.status === 'pending' ? (
                        <Button
                          variant="ghost"
                          className="text-xs py-1 px-3"
                          onClick={() => { setSelectedCloseReq(req); setCloseAdminNotes(''); setIsCloseReviewOpen(true); }}
                        >
                          Review
                        </Button>
                      ) : (
                        <span className="text-xs text-[#888888] italic">{req.adminNotes || 'No notes'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Close Review Modal */}
        {isCloseReviewOpen && selectedCloseReq && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 max-w-md w-full">
              <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-text">Review Closure Request</h3>
                  <span className="text-xs text-[#888888]">Loan: {selectedCloseReq.loanId} · {selectedCloseReq.customerName}</span>
                </div>
                <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsCloseReviewOpen(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-surface rounded-2xl p-4 text-sm space-y-2 border border-[#E5E5E5]">
                  <div className="flex justify-between"><span className="text-[#888888]">Customer:</span><span className="font-semibold">{selectedCloseReq.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-[#888888]">Loan ID:</span><span className="font-semibold font-mono">{selectedCloseReq.loanId}</span></div>
                  <div className="flex justify-between"><span className="text-[#888888]">Requested By:</span><span className="font-semibold">{selectedCloseReq.requestedBy}</span></div>
                  <div className="flex justify-between"><span className="text-[#888888]">Reason:</span><span className="font-semibold">{selectedCloseReq.reason || '—'}</span></div>
                  <div className="pt-2 border-t border-[#E5E5E5]">
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 font-medium">⚠ Approving will set loan status to <strong>Closed</strong> and outstanding to ₹0.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Admin Notes (optional)</label>
                  <Input placeholder="Remarks for staff/customer…" value={closeAdminNotes} onChange={e => setCloseAdminNotes(e.target.value)} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                    onClick={() => handleApproveClosure(selectedCloseReq)}
                  >
                    <Check className="h-4 w-4" /> Approve & Close Loan
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 text-rose-600 border-rose-300 hover:bg-rose-50"
                    disabled={isLoading}
                    onClick={() => handleRejectClosure(selectedCloseReq)}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOutstandingEdits = () => {
    const pending = outstandingEditRequests.filter(r => r.status === 'pending');
    const others = outstandingEditRequests.filter(r => r.status !== 'pending');
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
              <h3 className="font-bold text-text">Outstanding Balance Edit Requests</h3>
              <p className="text-xs text-[#888888] mt-0.5">Staff-submitted requests to adjust a customer's loan outstanding balance. Requires admin approval.</p>
            </div>
            {pendingOutstandingEditCount > 0 && (
              <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">{pendingOutstandingEditCount} Pending</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-[#E5E5E5]">
                  {['Loan ID', 'Customer', 'Current Balance', 'Requested Balance', 'Difference', 'Reason', 'Requested By', 'Requested At', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {sorted.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-sm text-[#888888]">No outstanding balance edit requests yet.</td></tr>
                )}
                {sorted.map(req => {
                  const diff = req.newOutstanding - req.currentOutstanding;
                  return (
                    <tr key={req.id} className={`hover:bg-surface/40 ${req.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-3 font-bold font-mono text-text">{req.loanId}</td>
                      <td className="px-5 py-3 text-text">{req.customerName}</td>
                      <td className="px-5 py-3 text-text">₹{req.currentOutstanding.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 font-semibold text-brand font-mono">₹{req.newOutstanding.toLocaleString('en-IN')}</td>
                      <td className={`px-5 py-3 font-semibold ${diff < 0 ? 'text-emerald-600' : diff > 0 ? 'text-rose-600' : 'text-[#888888]'}`}>
                        {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}₹${Math.abs(diff).toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-5 py-3 text-[#555555] max-w-[150px] truncate" title={req.reason}>{req.reason || '—'}</td>
                      <td className="px-5 py-3 text-[#555555]">{req.requestedBy}</td>
                      <td className="px-5 py-3 text-[#888888] whitespace-nowrap text-xs">{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-5 py-3">{statusBadge(req.status)}</td>
                      <td className="px-5 py-3">
                        {req.status === 'pending' ? (
                          <Button
                            variant="ghost"
                            className="text-xs py-1 px-3"
                            onClick={() => { setSelectedOutstandingEditReq(req); setOutstandingEditAdminNotes(''); setIsOutstandingEditReviewOpen(true); }}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="text-xs text-[#888888] italic" title={req.adminNotes}>{req.adminNotes || 'No notes'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outstanding Edit Review Modal */}
        {isOutstandingEditReviewOpen && selectedOutstandingEditReq && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 max-w-md w-full">
              <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-text">Review Outstanding Edit</h3>
                  <span className="text-xs text-[#888888]">Loan: {selectedOutstandingEditReq.loanId} · {selectedOutstandingEditReq.customerName}</span>
                </div>
                <Button variant="ghost" className="p-1 rounded-full animate-hover" onClick={() => setIsOutstandingEditReviewOpen(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-surface rounded-2xl p-4 text-sm space-y-2 border border-[#E5E5E5]">
                  <div className="flex justify-between"><span className="text-[#888888]">Customer:</span><span className="font-semibold">{selectedOutstandingEditReq.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-[#888888]">Loan ID:</span><span className="font-semibold font-mono">{selectedOutstandingEditReq.loanId}</span></div>
                  <div className="flex justify-between"><span className="text-[#888888]">Current Outstanding:</span><span className="font-semibold text-text">₹{selectedOutstandingEditReq.currentOutstanding.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-[#888888]">Requested Outstanding:</span><span className="font-semibold text-brand">₹{selectedOutstandingEditReq.newOutstanding.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between pt-1 border-t border-[#E5E5E5]/60">
                    <span className="text-[#888888]">Difference:</span>
                    <span className={`font-semibold ${(selectedOutstandingEditReq.newOutstanding - selectedOutstandingEditReq.currentOutstanding) < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {((selectedOutstandingEditReq.newOutstanding - selectedOutstandingEditReq.currentOutstanding) > 0 ? '+' : '')}₹{(selectedOutstandingEditReq.newOutstanding - selectedOutstandingEditReq.currentOutstanding).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-[#888888]">Requested By:</span><span className="font-semibold">{selectedOutstandingEditReq.requestedBy}</span></div>
                  <div className="flex justify-between"><span className="text-[#888888]">Reason:</span><span className="font-semibold text-[#555555]">{selectedOutstandingEditReq.reason || '—'}</span></div>
                  <div className="pt-2 border-t border-[#E5E5E5]">
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 font-medium">⚠ Approving this will immediately change the outstanding balance in the database.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Admin Notes (optional)</label>
                  <Input placeholder="Remarks for staff/customer…" value={outstandingEditAdminNotes} onChange={e => setOutstandingEditAdminNotes(e.target.value)} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                    onClick={() => handleApproveOutstandingEdit(selectedOutstandingEditReq)}
                  >
                    <Check className="h-4 w-4" /> Approve & Update
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 text-rose-600 border-rose-300 hover:bg-rose-50"
                    disabled={isLoading}
                    onClick={() => handleRejectOutstandingEdit(selectedOutstandingEditReq)}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderRepledge = () => {
    const tabs: { key: 'all' | 'pending' | 'approved' | 'rejected'; label: string; activeClass: string }[] = [
      { key: 'all', label: 'All', activeClass: 'bg-brand text-white border-brand' },
      { key: 'pending', label: 'Pending', activeClass: 'bg-amber-500 text-white border-amber-500' },
      { key: 'approved', label: 'Approved', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
      { key: 'rejected', label: 'Rejected', activeClass: 'bg-rose-600 text-white border-rose-600' },
    ];

    const searchedRepledge = repledgeSearch
      ? repledgeRequests.filter(r =>
          r.customerName.toLowerCase().includes(repledgeSearch.toLowerCase()) ||
          r.reason.toLowerCase().includes(repledgeSearch.toLowerCase()) ||
          (r.loanId || '').toLowerCase().includes(repledgeSearch.toLowerCase())
        )
      : repledgeRequests;

    const filteredRepledge = repledgeStatusFilter === 'all'
      ? searchedRepledge
      : searchedRepledge.filter(r => r.status === repledgeStatusFilter);

    const counts = {
      all: searchedRepledge.length,
      pending: searchedRepledge.filter(r => r.status === 'pending').length,
      approved: searchedRepledge.filter(r => r.status === 'approved').length,
      rejected: searchedRepledge.filter(r => r.status === 'rejected').length,
    };

    return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-3xl border border-[#E5E5E5] text-sm text-[#555555]">
        Re-pledge requests submitted by customers. Review and approve or reject each request.
      </div>

      {/* Search + Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input type="text" placeholder="Search by customer, loan ID or reason…" value={repledgeSearch}
            onChange={e => setRepledgeSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-white pl-10 pr-4 py-2.5 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand" />
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const isActive = repledgeStatusFilter === tab.key;
            return (
              <button key={tab.key} onClick={() => setRepledgeStatusFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? tab.activeClass : 'bg-white border-[#E5E5E5] text-[#555555] hover:border-brand/40 hover:text-brand'
                }`}>
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#F0F0F0] text-[#555555]'}`}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-surface">
                {['Customer', 'Loan ID', 'Reason', 'Notes', 'Status', 'Requested', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredRepledge.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#888888]">{repledgeSearch || repledgeStatusFilter !== 'all' ? 'No requests match your filter.' : 'No re-pledge requests yet.'}</td></tr>
              )}
              {filteredRepledge.map(r => (
                <tr key={r.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-text text-sm">{r.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">{r.loanId || '—'}</td>
                  <td className="px-6 py-4 text-sm text-text max-w-[180px] truncate">{r.reason}</td>
                  <td className="px-6 py-4 text-sm text-[#555555] max-w-[180px] truncate">{r.notes || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {r.status === 'pending' && <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>}
                    {r.status === 'approved' && <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Approved</span>}
                    {r.status === 'rejected' && <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Rejected</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">
                    {new Date(r.requestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {r.status === 'pending' ? (
                      <Button variant="outline" className="text-xs py-1.5 px-3 rounded-xl" onClick={() => {
                        setSelectedRepledge(r);
                        setRepledgeAdminNotes('');
                        setIsRepledgeReviewOpen(true);
                      }}>
                        Review
                      </Button>
                    ) : (
                      <span className="text-xs text-[#888888] italic">
                        {r.reviewedBy ? `by ${r.reviewedBy}` : 'Completed'}
                      </span>
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

  return (
    <div className="min-h-screen flex bg-surface text-text relative overflow-x-hidden">
      {/* 1. Sidebar Container */}
      <aside className={`w-64 bg-white border-r border-[#E5E5E5] flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-transform duration-300 z-40
        fixed md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:relative'}
      `}>
        <div>
          {/* Logo Section */}
          <div className="px-6 py-6 border-b border-[#E5E5E5] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand/10">R</div>
                <div>
                  <span className="font-extrabold tracking-wide text-brand text-lg block leading-none">RAPID</span>
                  <span className="text-[10px] uppercase font-bold text-[#888888] tracking-widest mt-0.5 block">Consultancy</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="p-1 md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150
                ${activeTab === 'overview' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <LayoutDashboard className="h-5 w-5" />
              Overview
            </button>

            <button
              onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150
                ${activeTab === 'customers' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <Users className="h-5 w-5" />
              Customers
            </button>

            <button
              onClick={() => { setActiveTab('loans'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150
                ${activeTab === 'loans' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <Coins className="h-5 w-5" />
              Loan Operations
            </button>

            <button
              onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 relative
                ${activeTab === 'requests' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <UserPlus className="h-5 w-5" />
              Interested Customers
            </button>

            <button
              onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150
                ${activeTab === 'logs' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <History className="h-5 w-5" />
              Audit Logs
            </button>

            <button
              onClick={() => { setActiveTab('staff'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150
                ${activeTab === 'staff' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <UserCog className="h-5 w-5" />
              Staff Members
            </button>

            <button
              onClick={() => { setActiveTab('sanctions'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 relative
                ${activeTab === 'sanctions' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <ShieldCheck className="h-5 w-5" />
              Loan Sanctions
              {pendingSanctionsCount > 0 && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${activeTab === 'sanctions' ? 'bg-white text-brand' : 'bg-brand text-white'}
                `}>
                  {pendingSanctionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('closures'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 relative
                ${activeTab === 'closures' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <XCircle className="h-5 w-5" />
              Loan Closures
              {pendingCloseCount > 0 && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${activeTab === 'closures' ? 'bg-white text-brand' : 'bg-brand text-white'}
                `}>
                  {pendingCloseCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('outstanding-edits'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 relative
                ${activeTab === 'outstanding-edits' ? 'bg-brand text-white' : 'text-[#555555] hover:bg-surface'}
              `}
            >
              <Edit className="h-5 w-5" />
              Outstanding Edits
              {pendingOutstandingEditCount > 0 && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${activeTab === 'outstanding-edits' ? 'bg-white text-brand' : 'bg-brand text-white'}
                `}>
                  {pendingOutstandingEditCount}
                </span>
              )}
            </button>


          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#E5E5E5] space-y-3">
          <div className="flex items-center gap-3 bg-surface p-3 rounded-2xl">
            <div className="h-9 w-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-text block truncate">{user?.name ?? 'Admin'}</span>
              <span className="text-[10px] text-[#888888] block">Musthafa Nagar Branch</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-[#E5E5E5] hover:bg-[#FEEAEA] hover:text-rose-600 hover:border-rose-300"
            onClick={() => { logout(); router.push('/admin/login'); }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="p-1 md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold text-text capitalize">
              {activeTab === 'requests' ? 'Interested Customers' : activeTab === 'logs' ? 'Audit Logs' : activeTab === 'staff' ? 'Staff Members' : activeTab === 'sanctions' ? 'Loan Sanctions' : activeTab === 'outstanding-edits' ? 'Outstanding Edits' : activeTab}
            </h1>
          </div>
          {/* Connection Mode Indicator */}
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                <Database className="h-3.5 w-3.5" /> Supabase Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-100">
                <WifiOff className="h-3.5 w-3.5" /> Offline Sandbox
              </span>
            )}
            <div className="text-xs text-[#888888] font-medium hidden lg:block">
              📅 Session: <span className="font-mono text-text">ADM-77562</span>
            </div>
          </div>
        </header>

        {/* Offline Fallback Alert Banner */}
        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Running in local sandbox mode. Configure your Supabase keys in <code className="font-mono bg-white/60 px-1 py-0.5 rounded">.env.local</code> to sync live.</span>
            </div>
            <Button variant="ghost" className="h-auto py-1 px-2.5 text-xs text-amber-900 border border-amber-300 hover:bg-amber-100" onClick={fetchData}>
              Check Connection
            </Button>
          </div>
        )}

        {/* View Content Panel */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2 text-sm text-[#555555] font-semibold">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5E5E5] border-t-brand" />
                Updating Database...
              </div>
            </div>
          )}

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'loans' && renderLoans()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'staff' && renderStaff()}
          {activeTab === 'sanctions' && renderSanctions()}
          {activeTab === 'closures' && renderClosures()}
          {activeTab === 'outstanding-edits' && renderOutstandingEdits()}
        </div>
      </main>

      {/* Sidebar Overlay on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* ============================== MODALS =================================== */}
      {/* ========================================================================= */}

      {/* PDF Loan Select Modal */}
      {isPdfLoanSelectOpen && pdfCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-text">Download Customer PDF</h3>
                <p className="text-xs text-[#888888] mt-0.5">{pdfCustomer.name} has multiple active loans. Select one to include.</p>
              </div>
              <button onClick={() => setIsPdfLoanSelectOpen(false)} className="p-2 rounded-xl hover:bg-surface text-[#888888]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {pdfCustomerLoans.map((loan) => (
                <button
                  key={loan.id}
                  disabled={isGeneratingPdf}
                  onClick={async () => {
                    setIsGeneratingPdf(true);
                    await generateCustomerPdf(pdfCustomer, loan);
                    setIsGeneratingPdf(false);
                    setIsPdfLoanSelectOpen(false);
                  }}
                  className="w-full text-left rounded-2xl border border-[#E5E5E5] px-4 py-3 hover:border-brand hover:bg-red-50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-semibold bg-[#F0F0F0] px-2 py-0.5 rounded text-text">{loan.loanId}</span>
                      <span className="ml-2 text-sm font-semibold text-text">{loan.loanType}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${loan.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#555555]">
                    Principal: ₹{loan.principal.toLocaleString('en-IN')} &nbsp;·&nbsp; Outstanding: ₹{(loan.outstanding + loan.interestDue).toLocaleString('en-IN')}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-6 pb-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPdfLoanSelectOpen(false)} className="rounded-2xl">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-lg font-bold text-text">Add Customer Profile</h3>
              <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsAddCustomerOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Customer Name *</label>
                <Input
                  required
                  placeholder="Enter full name"
                  value={custFormName}
                  onChange={(e) => setCustFormName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Mobile Number *</label>
                  <Input
                    required
                    placeholder="+91 98xxx xxxxx"
                    value={custFormMobile}
                    onChange={(e) => setCustFormMobile(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="name@example.com"
                    value={custFormEmail}
                    onChange={(e) => setCustFormEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Date of Birth</label>
                  <Input
                    type="date"
                    value={custFormDob}
                    onChange={(e) => setCustFormDob(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Password <span className="text-red-500">*</span></label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={custFormPassword}
                    onChange={(e) => setCustFormPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Permanent Address</label>
                <Textarea
                  placeholder="Enter full address"
                  value={custFormAddress}
                  onChange={(e) => setCustFormAddress(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">KYC Status</label>
                  <select
                    value={custFormKyc}
                    onChange={(e) => setCustFormKyc(e.target.value as any)}
                    className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Branch</label>
                  <Input
                    value={custFormBranch}
                    onChange={(e) => setCustFormBranch(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>Cancel</Button>
                <Button type="submit">Add Customer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditCustomerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-lg font-bold text-text">Edit Customer Profile</h3>
              <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsEditCustomerOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleEditCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Customer Name *</label>
                <Input
                  required
                  placeholder="Enter full name"
                  value={custFormName}
                  onChange={(e) => setCustFormName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Mobile Number *</label>
                  <Input
                    required
                    placeholder="+91 98xxx xxxxx"
                    value={custFormMobile}
                    onChange={(e) => setCustFormMobile(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="name@example.com"
                    value={custFormEmail}
                    onChange={(e) => setCustFormEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Date of Birth</label>
                  <Input
                    type="date"
                    value={custFormDob}
                    onChange={(e) => setCustFormDob(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={custFormPassword}
                    onChange={(e) => setCustFormPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Permanent Address</label>
                <Textarea
                  placeholder="Enter full address"
                  value={custFormAddress}
                  onChange={(e) => setCustFormAddress(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">KYC Status</label>
                  <select
                    value={custFormKyc}
                    onChange={(e) => setCustFormKyc(e.target.value as any)}
                    className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Branch</label>
                  <Input
                    value={custFormBranch}
                    onChange={(e) => setCustFormBranch(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditCustomerOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Loan Modal */}
      {isIssueLoanOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center bg-surface">
              <div>
                <h3 className="text-lg font-bold text-text">New Gold Loan Disbursal</h3>
                <span className="text-xs text-[#888888]">Issue loan against collateral valuation</span>
              </div>
              <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsIssueLoanOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleIssueLoanSubmit} className="p-6 space-y-4">
              {/* Searchable Customer */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Select Customer *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search by name or mobile…"
                    value={loanFormCustSearch}
                    onChange={e => {
                      setLoanFormCustSearch(e.target.value);
                      setLoanFormCustDropdown(true);
                      if (!e.target.value) setLoanFormCustomerId('');
                    }}
                    onFocus={() => setLoanFormCustDropdown(true)}
                    onBlur={() => setTimeout(() => setLoanFormCustDropdown(false), 150)}
                    className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                    autoComplete="off"
                  />
                  {loanFormCustDropdown && loanFormCustSearch && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-[#E5E5E5] rounded-2xl shadow-lg max-h-48 overflow-y-auto">
                      {customers.filter(c =>
                        !(c.password?.startsWith('DELETED_') ?? false) &&
                        c.kycStatus === 'Verified' && (
                          c.name.toLowerCase().includes(loanFormCustSearch.toLowerCase()) ||
                          c.mobile.includes(loanFormCustSearch)
                        )
                      ).map(c => (
                        <button
                          type="button"
                          key={c.id}
                          onMouseDown={() => {
                            setLoanFormCustomerId(c.id);
                            setLoanFormCustSearch(`${c.name} (${c.mobile})`);
                            setLoanFormCustDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface border-b border-[#F0F0F0] last:border-0"
                        >
                          <div className="font-medium text-text">{c.name}</div>
                          <div className="text-xs text-[#888888]">{c.mobile}</div>
                        </button>
                      ))}
                      {customers.filter(c =>
                        !(c.password?.startsWith('DELETED_') ?? false) &&
                        c.kycStatus === 'Verified' && (
                          c.name.toLowerCase().includes(loanFormCustSearch.toLowerCase()) ||
                          c.mobile.includes(loanFormCustSearch)
                        )
                      ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-[#888888]">No verified customers found</div>
                      )}
                    </div>
                  )}
                </div>
                {customers.filter(c => !(c.password?.startsWith('DELETED_') ?? false) && c.kycStatus === 'Verified').length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">⚠️ No verified customers. Verify a profile in the Customers tab first.</p>
                )}
              </div>

              {/* Loan Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Loan Type</label>
                <select
                  value={loanFormLoanType}
                  onChange={e => setLoanFormLoanType(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {LOAN_TYPE_INFO[loanFormLoanType] && (
                  <div className="mt-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
                    <p className="text-xs text-[#555555] mb-2 leading-relaxed">{LOAN_TYPE_INFO[loanFormLoanType].description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {LOAN_TYPE_INFO[loanFormLoanType].features.map(f => (
                        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-white border border-brand/20 px-2 py-0.5 text-[10px] font-medium text-brand">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {loanFormLoanType === 'Gold Loan' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-[#E5E5E5] grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-[#555555] mb-1.5 flex items-center gap-1"><Calculator className="h-3.5 w-3.5" /> Gold Weight (grams)</label>
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={loanFormGoldWeight}
                      onChange={(e) => setLoanFormGoldWeight(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#555555] mb-1.5">Gold Purity (Karat)</label>
                    <select
                      value={loanFormGoldPurity}
                      onChange={(e) => setLoanFormGoldPurity(Number(e.target.value))}
                      className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text focus:border-brand"
                    >
                      <option value={18}>18 Karat (75%)</option>
                      <option value={22}>22 Karat (91.6%)</option>
                      <option value={24}>24 Karat (99.9%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#555555] mb-1.5">Est. Market Value (₹)</label>
                    <Input
                      type="number"
                      value={loanFormEstimatedGoldValue}
                      onChange={(e) => {
                        setLoanFormEstimatedGoldValue(Number(e.target.value));
                        setIsLoanFormEstimatedGoldValueManuallyEdited(true);
                      }}
                      className="font-bold text-emerald-600"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Loan Principal (₹) *</label>
                  <Input
                    type="number"
                    min="1000"
                    step="any"
                    value={loanFormPrincipal}
                    onChange={(e) => setLoanFormPrincipal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Interest Rate (% p.a.)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={loanFormInterestRate}
                    onChange={(e) => setLoanFormInterestRate(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Tenure</label>
                  <select
                    value={loanFormTenure}
                    onChange={(e) => setLoanFormTenure(Number(e.target.value))}
                    className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Due Date <span className="text-[#888888] font-normal normal-case">(optional — defaults to 1 month from today)</span></label>
                <input
                  type="date"
                  value={loanFormDueDate}
                  onChange={e => setLoanFormDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsIssueLoanOpen(false)}>Cancel</Button>
                <Button type="submit">Disburse Loan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-lg font-bold text-text">Add Staff Member</h3>
              <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsAddStaffOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Full Name <span className="text-red-500">*</span></label>
                <Input required placeholder="Staff full name" value={staffFormName} onChange={e => setStaffFormName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Mobile <span className="text-red-500">*</span></label>
                <Input required placeholder="+91 99xxx xxxxx" type="tel" value={staffFormMobile} onChange={e => setStaffFormMobile(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Email <span className="text-red-500">*</span></label>
                <Input required placeholder="staff@rapidconsult.com" type="email" value={staffFormEmail} onChange={e => setStaffFormEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Password</label>
                  <Input type="password" placeholder="Staff@123" value={staffFormPassword} onChange={e => setStaffFormPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Branch</label>
                  <Input value={staffFormBranch} onChange={e => setStaffFormBranch(e.target.value)} />
                </div>
              </div>
              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddStaffOpen(false)}>Cancel</Button>
                <Button type="submit">Add Staff</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditStaffOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-lg font-bold text-text">Edit Staff — {selectedStaff.name}</h3>
              <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsEditStaffOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <form onSubmit={handleEditStaffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Full Name</label>
                <Input value={staffFormName} onChange={e => setStaffFormName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Email</label>
                <Input type="email" value={staffFormEmail} onChange={e => setStaffFormEmail(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Password</label>
                  <Input type="password" value={staffFormPassword} onChange={e => setStaffFormPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Branch</label>
                  <Input value={staffFormBranch} onChange={e => setStaffFormBranch(e.target.value)} />
                </div>
              </div>
              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditStaffOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sanction Review Modal */}
      {isSanctionReviewOpen && selectedSanction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-text">Review Loan Sanction</h3>
                <span className="text-xs text-[#888888]">Requested by {selectedSanction.staffName}</span>
              </div>
              <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsSanctionReviewOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface rounded-2xl p-4 text-sm space-y-2 border border-[#E5E5E5]">
                <p className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-2">Customer Details</p>
                <div className="flex justify-between"><span className="text-[#888888]">Name:</span><span className="font-semibold">{selectedSanction.customerName}</span></div>
                {selectedSanction.customerMobile && <div className="flex justify-between"><span className="text-[#888888]">Mobile:</span><span className="font-semibold">{selectedSanction.customerMobile}</span></div>}
                {selectedSanction.customerEmail && <div className="flex justify-between"><span className="text-[#888888]">Email:</span><span className="font-semibold">{selectedSanction.customerEmail}</span></div>}
                {selectedSanction.customerDob && <div className="flex justify-between"><span className="text-[#888888]">DOB:</span><span className="font-semibold">{selectedSanction.customerDob}</span></div>}
                {selectedSanction.customerAddress && <div className="flex justify-between"><span className="text-[#888888]">Address:</span><span className="font-semibold">{selectedSanction.customerAddress}</span></div>}
              </div>
              <div className="bg-surface rounded-2xl p-4 text-sm space-y-2 border border-[#E5E5E5]">
                <p className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-2">Loan Details</p>
                {selectedSanction.loanType && <div className="flex justify-between"><span className="text-[#888888]">Loan Type:</span><span className="font-semibold text-brand">{selectedSanction.loanType}</span></div>}
                <div className="flex justify-between"><span className="text-[#888888]">Principal:</span><span className="font-semibold">₹{selectedSanction.principal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-[#888888]">Interest Rate:</span><span className="font-semibold">{selectedSanction.interestRate}% p.a.</span></div>
                <div className="flex justify-between"><span className="text-[#888888]">Tenure:</span><span className="font-semibold">{selectedSanction.tenureMonths} months</span></div>
                {selectedSanction.requestedDueDate && <div className="flex justify-between"><span className="text-[#888888]">Requested Due Date:</span><span className="font-semibold">{selectedSanction.requestedDueDate}</span></div>}
                {selectedSanction.loanType === 'Gold Loan' && (
                  <div className="flex justify-between"><span className="text-[#888888]">Gold:</span><span className="font-semibold">{selectedSanction.goldWeight}g · {selectedSanction.goldPurity}K · Est. ₹{selectedSanction.estimatedGoldValue.toLocaleString('en-IN')}</span></div>
                )}
                {selectedSanction.loanType === 'Gold Loan' && selectedSanction.estimatedGoldValue > 0 && (
                  <div className="flex justify-between"><span className="text-[#888888]">LTV:</span><span className="font-bold text-text">{(selectedSanction.principal / selectedSanction.estimatedGoldValue * 100).toFixed(1)}%</span></div>
                )}
                {selectedSanction.loanType === 'Business Loan' && (
                  <>
                    {selectedSanction.businessName && <div className="flex justify-between"><span className="text-[#888888]">Business Name:</span><span className="font-semibold">{selectedSanction.businessName}</span></div>}
                    {selectedSanction.businessType && <div className="flex justify-between"><span className="text-[#888888]">Business Type:</span><span className="font-semibold">{selectedSanction.businessType}</span></div>}
                    {selectedSanction.businessYears && (
                      <div className="flex justify-between">
                        <span className="text-[#888888]">Years in Operation:</span>
                        <span className={`font-bold ${Number(selectedSanction.businessYears) < 3 ? 'text-red-600' : 'text-emerald-600'}`}>{selectedSanction.businessYears} years {Number(selectedSanction.businessYears) < 3 ? '⚠ Below minimum' : '✓ Eligible'}</span>
                      </div>
                    )}
                  </>
                )}
                {selectedSanction.notes && <div className="pt-1 border-t border-[#E5E5E5]"><span className="text-[#888888]">Staff notes: </span>{selectedSanction.notes}</div>}
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                <strong>On approval:</strong> A customer account will be created automatically. The customer's mobile number will be their login password.
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Admin Notes (optional)</label>
                <Input placeholder="Add remarks for the staff member…" value={sanctionAdminNotes} onChange={e => setSanctionAdminNotes(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApproveSanction(selectedSanction)}>
                  <Check className="h-4 w-4" /> Approve & Issue Loan
                </Button>
                <Button variant="outline" className="flex-1 flex items-center justify-center gap-2 text-rose-600 border-rose-300 hover:bg-rose-50" onClick={() => handleRejectSanction(selectedSanction)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Adjust Outstanding Modal */}
      {isAdjustLoanOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-text">Adjust Loan Balance</h3>
                <span className="text-xs text-[#888888] font-mono">Loan Ref: {selectedLoan.loanId}</span>
              </div>
              <Button variant="ghost" className="p-1 rounded-full" onClick={() => setIsAdjustLoanOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleAdjustLoanSubmit} className="p-6 space-y-4">
              <div className="bg-surface p-3 rounded-2xl text-xs space-y-1.5 border border-[#E5E5E5]">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Customer:</span>
                  <span className="font-semibold">{selectedLoan.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Current Principal:</span>
                  <span className="font-semibold">₹{selectedLoan.outstanding.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Current Interest Due:</span>
                  <span className="font-semibold">₹{selectedLoan.interestDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-[#E5E5E5] pt-1.5 mt-1.5 text-rose-600 font-medium">
                  <span>Total Outstanding:</span>
                  <span className="font-bold">₹{(selectedLoan.outstanding + selectedLoan.interestDue).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAdjustType('payment'); setAdjustPaymentType('mixed'); setAdjustAmount(selectedLoan.outstanding + selectedLoan.interestDue); }}
                    className={`py-2 px-4 rounded-xl text-sm font-semibold border transition-all
                      ${adjustType === 'payment' ? 'bg-brand text-white border-brand' : 'bg-white border-[#E5E5E5] text-[#555555]'}
                    `}
                  >
                    Log Repayment
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdjustType('accrual'); setAdjustAmount(0); setAdjustInterest(500); }}
                    className={`py-2 px-4 rounded-xl text-sm font-semibold border transition-all
                      ${adjustType === 'accrual' ? 'bg-brand text-white border-brand' : 'bg-white border-[#E5E5E5] text-[#555555]'}
                    `}
                  >
                    Accrue Interest
                  </button>
                </div>
              </div>

              {adjustType === 'payment' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Payment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setAdjustPaymentType('mixed'); setAdjustAmount(selectedLoan.outstanding + selectedLoan.interestDue); }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all
                          ${adjustPaymentType === 'mixed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-[#E5E5E5] text-[#555555]'}
                        `}
                      >
                        Mixed (Interest + Principal)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAdjustPaymentType('principal_only'); setAdjustAmount(0); }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all
                          ${adjustPaymentType === 'principal_only' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-[#E5E5E5] text-[#555555]'}
                        `}
                      >
                        Principal Only
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">
                      {adjustPaymentType === 'principal_only' ? 'Principal Amount Paid (₹)' : 'Payment Amount Received (₹)'}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    />
                    <p className="text-[11px] text-[#888888] mt-1.5">
                      {adjustPaymentType === 'principal_only'
                        ? 'Directly reduces principal balance. Interest is not affected (calculated on initial principal).'
                        : 'Payment applied to outstanding interest first, then to the principal balance.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Accrue Principal (₹)</label>
                    <Input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Accrue Interest (₹)</label>
                    <Input
                      type="number"
                      value={adjustInterest}
                      onChange={(e) => setAdjustInterest(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">Remarks / Details</label>
                <Input
                  placeholder="e.g. Cash payment at branch, Monthly interest run"
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAdjustLoanOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Adjustment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
