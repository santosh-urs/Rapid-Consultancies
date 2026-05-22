import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Rapid Consultancy',
};

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' }}>
          ← Rapid Consultancy
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px 64px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 40 }}>
          Last updated: 22 May 2026 &nbsp;|&nbsp; Rapid Consultancy Pvt Ltd, Musthafa Nagar, Khammam, Telangana
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using the Rapid Consultancy website and services, you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use our services. These terms apply to all visitors, customers,
          and staff who access or use our platform.
        </Section>

        <Section title="2. Services Offered">
          Rapid Consultancy is a registered Non-Banking Financial Company (NBFC) offering secured loan products including
          Gold Loans, Weekly Loans, Business Loans, Home Loans, Car Loans, Two-Wheeler Loans, and Mortgage Loans.
          All loans are subject to approval based on collateral valuation and KYC verification at our branch.
        </Section>

        <Section title="3. Eligibility">
          To avail our loan services, you must:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Be an Indian citizen aged 18 years or above</li>
            <li>Hold a valid government-issued identity proof</li>
            <li>Complete the KYC (Know Your Customer) process at our branch</li>
            <li>Provide valid collateral as required by the loan type</li>
          </ul>
        </Section>

        <Section title="4. Loan Disbursement and Repayment">
          Loan amounts are disbursed only after successful verification of collateral and KYC documents at the branch.
          Repayment schedules, interest rates, and tenure are agreed upon at the time of loan issuance and are documented
          in the loan agreement. Interest rates are subject to change; customers will be notified of any revisions.
        </Section>

        <Section title="5. Online Portal Usage">
          The customer portal is provided for viewing loan information and account details only.
          This website does not facilitate online payments. All financial transactions must be conducted in person at
          our registered branch office. Rapid Consultancy is not liable for any loss arising from unauthorized access
          to your account due to your failure to keep your credentials secure.
        </Section>

        <Section title="6. Collateral and Security">
          For Gold Loans and other secured products, the pledged collateral is held in safe custody at our branch during
          the loan tenure. Collateral will be returned upon full repayment of the loan including principal, interest, and
          any applicable charges. In the event of default, Rapid Consultancy reserves the right to liquidate the collateral
          as per applicable law and the signed loan agreement.
        </Section>

        <Section title="7. Prohibited Activities">
          Users must not:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Provide false or misleading information during registration or KYC</li>
            <li>Attempt to access other customers&apos; accounts</li>
            <li>Use the portal for any unlawful purpose</li>
            <li>Interfere with the security or operation of the platform</li>
          </ul>
        </Section>

        <Section title="8. Limitation of Liability">
          Rapid Consultancy shall not be liable for any indirect, incidental, or consequential damages arising from
          your use of our services or website. Our total liability in any matter is limited to the amount of fees paid
          by you, if any, in connection with the relevant service.
        </Section>

        <Section title="9. Governing Law">
          These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction
          of courts in Khammam, Telangana.
        </Section>

        <Section title="10. Amendments">
          We reserve the right to modify these Terms at any time. Continued use of our services after changes are
          posted constitutes your acceptance of the revised Terms.
        </Section>

        <Section title="11. Contact Us">
          For any queries regarding these Terms, please contact us at:
          <br /><br />
          <strong>Rapid Consultancy Pvt Ltd</strong><br />
          Musthafa Nagar, Khammam, Telangana<br />
          Email: rapidconsultancy124@gmail.com<br />
          Phone: +91 7670870964
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
