import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fair Practices Code — Rapid Consultancy',
};

export default function FairPracticesCodePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#111', padding: '16px 32px' }}>
        <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' }}>
          ← Rapid Consultancy
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px 64px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111', marginBottom: 8 }}>Fair Practices Code</h1>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 40 }}>
          Last updated: 22 May 2026 &nbsp;|&nbsp; Rapid Consultancy Pvt Ltd, Musthafa Nagar, Khammam, Telangana
        </p>

        <p style={{ color: '#555', lineHeight: 1.8, marginBottom: 32, fontSize: '0.95rem' }}>
          This Fair Practices Code (&quot;Code&quot;) has been adopted by Rapid Consultancy Pvt Ltd in compliance with the
          guidelines issued by the Reserve Bank of India (RBI) for Non-Banking Financial Companies (NBFCs).
          It sets out our commitment to treating customers fairly at every stage of our lending relationship.
        </p>

        <Section title="1. Loan Applications and Processing">
          <ul style={{ paddingLeft: 24, lineHeight: 2 }}>
            <li>All loan application forms will be provided in a language understood by the applicant.</li>
            <li>Acknowledgements will be issued for all loan applications received.</li>
            <li>Applicants will be informed of the reasons in writing if a loan application is rejected.</li>
            <li>We will not discriminate on the basis of religion, caste, gender, or any other protected characteristic.</li>
          </ul>
        </Section>

        <Section title="2. Loan Appraisal and Terms & Conditions">
          <ul style={{ paddingLeft: 24, lineHeight: 2 }}>
            <li>A written loan agreement will be provided to every borrower before disbursement.</li>
            <li>The agreement will clearly state the loan amount, interest rate, tenure, repayment schedule, and all applicable charges.</li>
            <li>All fees, charges, and penalties will be disclosed upfront — there are no hidden charges.</li>
            <li>Any change in interest rates or charges will be communicated to borrowers with adequate notice.</li>
          </ul>
        </Section>

        <Section title="3. Disbursement of Loans">
          <ul style={{ paddingLeft: 24, lineHeight: 2 }}>
            <li>Loan amounts will be disbursed only after execution of the loan agreement.</li>
            <li>Any conditions precedent to disbursement will be clearly communicated to the borrower in advance.</li>
            <li>Post-disbursement supervision will not interfere with day-to-day operations of the borrower.</li>
          </ul>
        </Section>

        <Section title="4. Interest Rate Policy">
          Rapid Consultancy adopts an interest rate policy that is:
          <ul style={{ paddingLeft: 24, lineHeight: 2, marginTop: 8 }}>
            <li>Transparent and non-discriminatory across borrowers of similar risk profiles</li>
            <li>Clearly communicated in the loan sanction letter and agreement</li>
            <li>Reviewed periodically in line with market conditions and RBI guidelines</li>
          </ul>
          Our interest rates are fixed per loan type and communicated at the time of application.
          Penal interest (if any) for delayed repayment will be separately stated in the loan agreement.
        </Section>

        <Section title="5. Recovery Practices">
          <ul style={{ paddingLeft: 24, lineHeight: 2 }}>
            <li>Recovery of dues will be conducted in a respectful and dignified manner.</li>
            <li>Recovery agents, if engaged, will carry proper identification and authorisation.</li>
            <li>Harassment or intimidation of any form is strictly prohibited.</li>
            <li>Recovery activities will be conducted only between 7:00 AM and 7:00 PM.</li>
            <li>Borrowers will be given adequate notice before any recovery action is initiated.</li>
          </ul>
        </Section>

        <Section title="6. Collateral Management">
          <ul style={{ paddingLeft: 24, lineHeight: 2 }}>
            <li>All pledged collateral (gold ornaments, etc.) will be held in secure custody at our branch.</li>
            <li>A receipt will be issued for every item pledged as collateral.</li>
            <li>Collateral will be returned upon full settlement of the loan.</li>
            <li>In case of auction due to default, adequate notice will be provided to the borrower as required by law.</li>
          </ul>
        </Section>

        <Section title="7. Grievance Redressal">
          All customer complaints will be handled as per our{' '}
          <Link href="/grievance-redressal" style={{ color: '#b40000', textDecoration: 'underline' }}>
            Grievance Redressal Policy
          </Link>
          . Customers may contact us at rapidconsultancy124@gmail.com or +91 7670870964.
        </Section>

        <Section title="8. General">
          This Code will be made available to all customers at the branch and on our website. It will be
          reviewed and updated periodically in accordance with changes in RBI guidelines or our internal policies.
          Compliance with this Code is mandatory for all staff of Rapid Consultancy.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #e5e5e5' }}>
        {title}
      </h2>
      <div style={{ color: '#444', lineHeight: 1.8, fontSize: '0.95rem' }}>{children}</div>
    </div>
  );
}
