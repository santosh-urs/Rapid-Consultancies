import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Rapid Consultancy',
  description: 'Privacy Policy for Rapid Consultancy app and website. How we collect, use, and protect your personal data.',
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
          Last updated: May 27, 2026 &nbsp;|&nbsp; Rapid Consultancy, beside Sri Ram Nagar Road No. 7, Khammam, Telangana
        </p>

        <Section title="1. Introduction">
          Rapid Consultancy (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, store, and protect your data when you use our website
          (<strong>www.rapidconsultancy.in</strong>) and the Rapid Consultancy mobile application.
          By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
        </Section>

        <Section title="2. Information We Collect">
          <strong>Personal Data</strong> — while using our Service, we may collect:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Name (first and last)</li>
            <li>Email address</li>
            <li>Mobile / phone number</li>
            <li>Residential address, city, state, postal code</li>
            <li>Date of birth</li>
            <li>Government-issued ID numbers (Aadhaar, PAN) for KYC verification</li>
            <li>Financial data: loan amounts, outstanding balance, repayment history, collateral details</li>
          </ul>
          <br />
          <strong>Usage Data</strong> — collected automatically when using the Service, including device IP address,
          browser type, pages visited, time and date of visit, and unique device identifiers.
          <br /><br />
          <strong>Camera / Photo Library</strong> — with your prior permission, we may collect photos
          (e.g. profile photo, gold collateral photo) to provide app features. You can disable this at any time
          through your device settings.
        </Section>

        <Section title="3. How We Use Your Information">
          We use your personal data to:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Process and manage your loan applications and accounts</li>
            <li>Verify your identity and conduct KYC checks as required by law</li>
            <li>Send account-related communications (payment reminders, loan statements, security updates)</li>
            <li>Comply with regulatory and legal obligations (RBI, applicable Indian laws)</li>
            <li>Prevent fraud and ensure platform security</li>
            <li>Improve and personalise our website and mobile application</li>
            <li>Manage your requests and enquiries</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          We do not sell your personal data. We may share your information with:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Regulatory Authorities:</strong> As required by RBI or other government bodies</li>
            <li><strong>Credit Bureaus:</strong> For credit reporting purposes as permitted by law</li>
            <li><strong>Service Providers:</strong> Third-party vendors who assist in our operations (e.g. cloud hosting via Supabase) under strict confidentiality agreements</li>
            <li><strong>Law Enforcement:</strong> When required by a valid legal order or to protect rights and safety</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your data may be transferred with prior notice</li>
          </ul>
          We do not share your data with advertisers or marketing partners.
        </Section>

        <Section title="5. Data Retention">
          We retain your personal data only for as long as necessary for the purposes set out in this Privacy Policy:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Account information:</strong> Retained for the duration of your account plus up to 24 months after account closure</li>
            <li><strong>Loan records:</strong> Retained for 7 years after loan closure, or as required by applicable financial regulations, whichever is longer</li>
            <li><strong>Usage data:</strong> Up to 24 months from the date of collection</li>
            <li><strong>KYC documents:</strong> As mandated by RBI guidelines</li>
          </ul>
          When retention periods expire, we securely delete or anonymise your personal data.
        </Section>

        <Section title="6. Data Security">
          We implement appropriate technical and organisational measures to protect your personal data:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>All data is transmitted over HTTPS (TLS encryption)</li>
            <li>Session data on our mobile app is stored using device-level encrypted secure storage (Android Keystore / iOS Secure Enclave)</li>
            <li>Access to our database is restricted and monitored</li>
          </ul>
          While we strive to use commercially reasonable means to protect your data, no method of transmission over
          the Internet is 100% secure. You are responsible for keeping your login credentials confidential.
        </Section>

        <Section title="7. Your Rights">
          You have the right to:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data where legally permissible</li>
            <li><strong>Withdrawal of consent:</strong> Withdraw consent for data processing where applicable</li>
            <li><strong>Complaint:</strong> Lodge a complaint with the relevant data protection authority</li>
          </ul>
          To exercise any of these rights, contact us at <strong>rapidconsultancy124@gmail.com</strong> or call <strong>+91 7670870964</strong>.
        </Section>

        <Section title="8. Children's Privacy">
          Our Service does not address anyone under the age of 16. We do not knowingly collect personally
          identifiable information from anyone under 16. If you are aware that your child has provided us with
          personal data, please contact us and we will take steps to remove that information.
        </Section>

        <Section title="9. Cookies">
          Our website may use cookies to enhance your browsing experience:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Essential cookies:</strong> Required for authentication and core website functionality</li>
            <li><strong>Functionality cookies:</strong> Remember your preferences and login details</li>
          </ul>
          You can configure your browser to refuse cookies; however, some features may not function correctly without them.
          Our mobile application does not use browser cookies.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
          updated policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review
          this policy periodically.
        </Section>

        <Section title="11. Contact Us">
          For any privacy-related queries or to exercise your data rights, please contact:<br /><br />
          <strong>Rapid Consultancy</strong><br />
          Beside Sri Ram Nagar Road No. 7, Khammam, Telangana<br />
          Email: <a href="mailto:rapidconsultancy124@gmail.com" style={{ color: '#B40000' }}>rapidconsultancy124@gmail.com</a><br />
          Phone: <a href="tel:+917670870964" style={{ color: '#B40000' }}>+91 7670870964</a>
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
