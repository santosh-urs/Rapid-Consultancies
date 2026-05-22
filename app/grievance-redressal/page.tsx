import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grievance Redressal — Rapid Consultancy',
};

export default function GrievanceRedressalPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#111', padding: '16px 32px' }}>
        <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' }}>
          ← Rapid Consultancy
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px 64px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111', marginBottom: 8 }}>Grievance Redressal</h1>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 40 }}>
          Last updated: 22 May 2026 &nbsp;|&nbsp; Rapid Consultancy Pvt Ltd, Musthafa Nagar, Khammam, Telangana
        </p>

        <Section title="Our Commitment">
          Rapid Consultancy is committed to providing fair, transparent, and efficient services to all customers.
          We take customer feedback and complaints seriously and have established a structured Grievance Redressal
          Mechanism to address your concerns promptly.
        </Section>

        <Section title="How to Register a Complaint">
          You may register your grievance through any of the following channels:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>In Person:</strong> Visit our branch at Musthafa Nagar, Khammam, Telangana during business hours (Mon–Sat, 9:00 AM – 5:00 PM)</li>
            <li><strong>Email:</strong> rapidconsultancy124@gmail.com</li>
            <li><strong>Phone:</strong> +91 7670870964</li>
          </ul>
          Please provide your name, loan account number (if applicable), a clear description of the grievance,
          and any supporting documents.
        </Section>

        <Section title="Grievance Resolution Timeline">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid #ddd' }}>Stage</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid #ddd' }}>Resolution Time</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Acknowledgement of complaint', 'Within 2 working days'],
                ['Resolution — simple queries', 'Within 7 working days'],
                ['Resolution — complex matters', 'Within 30 days'],
                ['Escalation to senior management', 'If unresolved within 30 days'],
              ].map(([stage, time]) => (
                <tr key={stage}>
                  <td style={{ padding: '10px 14px', border: '1px solid #ddd', color: '#333' }}>{stage}</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #ddd', color: '#555' }}>{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Escalation">
          If you are not satisfied with the resolution provided by our branch, you may escalate your grievance to:
          <br /><br />
          <strong>Grievance Officer</strong><br />
          Rapid Consultancy Pvt Ltd<br />
          Musthafa Nagar, Khammam, Telangana<br />
          Email: rapidconsultancy124@gmail.com<br />
          Phone: +91 7670870964
          <br /><br />
          If the grievance remains unresolved after exhausting our internal channels, you may approach the
          Reserve Bank of India&apos;s Integrated Ombudsman Scheme (RBI IOS) or the relevant consumer forum.
        </Section>

        <Section title="No Retaliation Policy">
          Rapid Consultancy guarantees that customers who raise legitimate grievances will not face any
          discriminatory treatment or retaliation in the processing of their loan accounts or services.
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
