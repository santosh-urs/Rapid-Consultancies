import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Rapid Consultancy',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#111', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' }}>
          ← Rapid Consultancy
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px 64px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 40 }}>
          Last updated: 22 May 2026 &nbsp;|&nbsp; Rapid Consultancy Pvt Ltd, Musthafa Nagar, Khammam, Telangana
        </p>

        <Section title="1. Introduction">
          Rapid Consultancy Pvt Ltd (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal
          information. This Privacy Policy explains how we collect, use, store, and protect your data when you interact
          with our website and loan services.
        </Section>

        <Section title="2. Information We Collect">
          We collect the following categories of personal information:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Identity Data:</strong> Name, date of birth, government-issued ID numbers (Aadhaar, PAN)</li>
            <li><strong>Contact Data:</strong> Mobile number, email address, residential address</li>
            <li><strong>Financial Data:</strong> Loan amounts, repayment history, collateral details</li>
            <li><strong>KYC Data:</strong> Documents submitted for Know Your Customer verification</li>
            <li><strong>Technical Data:</strong> IP address, browser type, and usage data collected automatically when you visit our website</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          We use your personal data to:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Process and manage your loan applications and accounts</li>
            <li>Verify your identity and conduct KYC checks as required by law</li>
            <li>Send account-related communications such as payment reminders and loan statements</li>
            <li>Comply with regulatory and legal obligations</li>
            <li>Improve our website and services</li>
            <li>Prevent fraud and ensure platform security</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          We do not sell your personal data. We may share your information with:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Regulatory Authorities:</strong> As required by RBI, SEBI, or other government bodies</li>
            <li><strong>Credit Bureaus:</strong> For credit reporting purposes as permitted by law</li>
            <li><strong>Service Providers:</strong> Third-party vendors who assist in our operations under strict confidentiality agreements</li>
            <li><strong>Law Enforcement:</strong> When required by a valid legal order or to protect rights and safety</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          We retain your personal data for as long as your account is active and for a period of 7 years thereafter,
          or as required by applicable law, whichever is longer. Loan records may be retained for longer periods as
          mandated by financial regulations.
        </Section>

        <Section title="6. Data Security">
          We implement appropriate technical and organisational measures to protect your personal data against
          unauthorised access, disclosure, alteration, or destruction. Your account is password-protected, and
          you are responsible for keeping your credentials confidential.
        </Section>

        <Section title="7. Your Rights">
          You have the right to:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate or incomplete data</li>
            <li>Request deletion of data where legally permissible</li>
            <li>Withdraw consent for data processing (where applicable)</li>
            <li>Lodge a complaint with the relevant data protection authority</li>
          </ul>
          To exercise these rights, please contact us at rapidconsultancy124@gmail.com.
        </Section>

        <Section title="8. Cookies">
          Our website may use cookies to enhance your browsing experience. You can configure your browser to refuse
          cookies; however, some features of the website may not function correctly without them.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. The updated version will be posted on this page with a
          revised &quot;Last updated&quot; date. We encourage you to review this policy periodically.
        </Section>

        <Section title="10. Contact Us">
          For any privacy-related queries or to exercise your data rights, please contact:
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
