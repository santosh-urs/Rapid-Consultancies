'use client';

import { useState } from 'react';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Phone, MapPin, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const loanProducts = [
  {
    title: 'Gold Loan',
    telugu: 'బంగారంపై బుణం',
    description: 'Get instant funds against your gold jewellery. Quick processing, minimal documentation, and competitive interest rates.',
    features: ['Same-day disbursement', 'No income proof required', 'Gold safely stored at branch', 'Flexible repayment options'],
  },
  {
    title: 'Business Loan',
    telugu: 'వ్యాపార బుణం',
    description: 'Fuel your business growth with our business loans. Tailored for small and medium enterprises.',
    features: ['Working capital support', 'Expansion financing', 'Quick approval', 'Flexible tenure'],
  },
  {
    title: 'Home Loan',
    telugu: 'ఇంటి బుణం',
    description: 'Make your dream home a reality with our affordable home loan schemes.',
    features: ['Long repayment tenure', 'Competitive interest rates', 'Up to 80% financing', 'Tax benefits available'],
  },
  {
    title: 'Car Loan',
    telugu: 'కారు బుణం',
    description: 'Drive home your dream car with our easy car loan schemes. New and used vehicles covered.',
    features: ['Up to 90% financing', 'New & used vehicles', 'Quick approval', 'Door-step service'],
  },
  {
    title: 'Two Wheeler Loan',
    telugu: 'ద్విచక్ర వాహన బుణం',
    description: 'Get your two-wheeler financed at attractive interest rates with easy monthly installments.',
    features: ['Minimal down payment', 'Quick disbursal', 'Flexible EMIs', 'All brands covered'],
  },
  {
    title: 'Mortgage Loan',
    telugu: 'ఇంటి తాకట్టు బుణం',
    description: 'Unlock the value in your property with our mortgage loan facility. Large amounts, long tenure.',
    features: ['High loan amounts', 'Commercial & residential', 'Long repayment period', 'Balance transfer available'],
  },
  {
    title: 'Weekly Loan',
    telugu: 'వారపు రుణం',
    description: 'Get instant short-term cash with our weekly payment plan. Initial starting amount from ₹10,000 up to ₹1,00,000.',
    features: ['Min ₹10,000 - Max ₹1,00,000', 'Cleared in exactly 1 month', '4 equal weekly payments', 'Initial interest rate of 35%'],
  },
  {
    title: 'Home Take Loans',
    telugu: 'హోమ్ టేక్ లోన్స్',
    description: 'Our representatives come to your doorstep to process your loan application — completely at your convenience.',
    features: ['Doorstep service', 'Zero branch visits', 'Quick processing', 'All loan types covered'],
  },
];

export default function LoanProductsPage() {
  const { user } = useAuth();
  const [applyModal, setApplyModal] = useState<string | null>(null);

  const logInterest = async (loanType: string) => {
    if (!user) return;
    try {
      // Fetch current customer details to populate access request accurately
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const customerName = customer?.name || user.name || 'Unknown Customer';
      const customerMobile = customer?.mobile || user.mobile || '';
      const customerEmail = customer?.email || '';
      const customerAddress = customer?.address || '';
      const customerDob = customer?.dob || null;

      await supabase.from('access_requests').insert({
        id: `req-${Date.now()}`,
        name: customerName,
        mobile: customerMobile,
        email: customerEmail,
        address: customerAddress,
        dob: customerDob,
        branch: 'Musthafa Nagar Branch',
        status: 'pending',
        request_date: new Date().toISOString().split('T')[0],
        password_hash: `CUSTOMER_ID:${user.id}|PASSWORD:${customer?.password || ''}|LOAN_TYPE:${loanType}`,
      });
    } catch (err) {
      console.error('Failed to log interest:', err);
    }
  };

  const openModal = (title: string) => {
    setApplyModal(title);
    logInterest(title);
  };

  const closeModal = () => {
    setApplyModal(null);
  };

  return (
    <CustomerLayout title="Loan Products" subtitle="All loan services offered by Rapid Consultancy">
      {/* Hero */}
      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center font-bold text-white text-lg shadow-md shadow-brand/20 shrink-0">RC</div>
          <div>
            <div className="text-lg font-bold text-text">Rapid Consultancy</div>
            <div className="text-sm text-[#555555] mt-0.5">Wide range of loan products with <strong>low interest rates</strong> and quick processing.</div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-brand font-semibold"><Phone size={14} /> 9502453969</span>
              <span className="flex items-center gap-1.5 text-[#555555]"><MapPin size={14} /> Musthafa Nagar, Khammam</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing fee notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 mb-6">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-800 text-sm">Standard Processing Fee Notice</div>
          <div className="text-xs text-amber-700 mt-0.5">
            Please note that a standard initial processing fee of <strong>₹7,500</strong> will be charged/taken for all new approved loan accounts in this platform.
          </div>
        </div>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loanProducts.map(product => (
          <div key={product.title} className="rounded-2xl border border-[#E8E8E8] bg-white flex flex-col overflow-hidden">
            <div className="h-1.5 w-full bg-brand" />
            <div className="flex flex-col flex-1 p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-bold text-text leading-tight">{product.title}</div>
                  <div className="text-[10px] text-[#888888] italic mt-0.5">{product.telugu}</div>
                </div>
                <span className="bg-brand/10 text-brand text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 whitespace-nowrap">Available</span>
              </div>
              <p className="text-xs text-[#555555] mb-4 leading-relaxed flex-1">{product.description}</p>
              <ul className="space-y-1.5 mb-5">
                {product.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-text">
                    <CheckCircle2 size={11} className="text-brand shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openModal(product.title)}
                className="w-full rounded-xl bg-brand text-white text-xs font-semibold py-2.5 hover:bg-brand/90 transition-colors active:scale-95"
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 text-center">
        <div className="text-base font-bold text-text mb-1">Interested? Visit or call us</div>
        <div className="text-sm text-[#555555] mb-4">Our team will guide you through the best loan option for your needs.</div>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <a href="tel:9502453969" className="flex items-center gap-2 font-semibold text-brand hover:underline"><Phone size={16} /> 9502453969</a>
          <span className="flex items-center gap-2 text-[#555555]"><MapPin size={16} /> Musthafa Nagar, Khammam</span>
        </div>
      </div>

      {/* Informational Modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden border border-[#E8E8E8]">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              {/* Branch/Info Icon */}
              <div className="h-14 w-14 rounded-full bg-brand/10 flex items-center justify-center mb-4 text-brand">
                <MapPin size={28} />
              </div>
              
              <div className="text-sm font-semibold text-text uppercase tracking-wide mb-1">
                Apply for {applyModal}
              </div>
              
              {/* Highlighted Warning/Information Box */}
              <div className="w-full bg-brand/5 border border-brand/20 rounded-xl p-4 my-4">
                <div className="text-sm font-bold text-brand leading-snug">
                  PLEASE VISIT THE BRANCH FOR MORE INFORMATION
                </div>
              </div>
              
              {/* Branch Details */}
              <div className="w-full text-left bg-neutral-50 border border-[#F0F0F0] rounded-xl p-4 mb-6 space-y-2.5">
                <div className="text-xs font-bold text-text border-b border-[#E8E8E8] pb-1.5 uppercase tracking-wider">
                  Branch Information
                </div>
                <div className="flex items-start gap-2 text-xs text-text">
                  <MapPin size={14} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Musthafa Nagar Branch</div>
                    <div className="text-[#666]">Musthafa Nagar, Khammam</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-text">
                  <Phone size={14} className="text-brand shrink-0" />
                  <div>
                    <span className="font-semibold">9502453969</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-text">
                  <AlertCircle size={14} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Business Hours</div>
                    <div className="text-[#666]">Mon–Sat, 9:00 AM – 6:00 PM</div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={closeModal} 
                className="w-full rounded-xl bg-brand text-white text-sm font-semibold py-3 hover:bg-brand/90 transition-colors active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
