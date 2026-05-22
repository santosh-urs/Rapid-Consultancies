'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  Lock,
  Percent,
  Zap,
  LayoutDashboard,
  RefreshCw,
  Users,
  Phone,
  Clock,
  ChevronDown,
  LogIn,
  Gem,
  Briefcase,
  Home as HomeIcon,
  Car,
  Building2,
  Truck,
  Gauge,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';

const loanServices = [
  {
    icon: Gem,
    title: 'Gold Loan',
    telugu: 'బంగారం రుణం',
    tagline: 'Instant cash against your gold jewellery with same-day disbursal.',
    features: ['Same-day disbursement', 'No income proof required', 'Safe gold storage', 'Flexible repayment'],
  },
  {
    icon: CalendarDays,
    title: 'Weekly Loan',
    telugu: 'వారపు రుణం',
    tagline: 'Short-term weekly repayment loans designed for quick cash needs with minimal formalities.',
    features: ['Weekly repayment schedule', 'Quick disbursal', 'Minimal documentation', 'Flexible loan amounts'],
  },
  {
    icon: Briefcase,
    title: 'Business Loan',
    telugu: 'వ్యాపార రుణం',
    tagline: 'Fuel your business growth with tailored financing for small and medium enterprises.',
    features: ['Working capital support', 'Quick approval', 'Expansion financing', 'Flexible tenure'],
  },
  {
    icon: HomeIcon,
    title: 'Home Loan',
    telugu: 'ఇంటి రుణం',
    tagline: 'Make your dream home a reality with our affordable home loan schemes.',
    features: ['Long repayment tenure', 'Competitive interest rates', 'Up to 80% financing', 'Tax benefits available'],
  },
  {
    icon: Car,
    title: 'Car Loan',
    telugu: 'కారు రుణం',
    tagline: 'Drive home your dream car — new or used — with easy, fast financing.',
    features: ['Up to 90% financing', 'New & used vehicles', 'Quick approval', 'Door-step service'],
  },
  {
    icon: Gauge,
    title: 'Two Wheeler Loan',
    telugu: 'ద్విచక్ర వాహన రుణం',
    tagline: 'Get your two-wheeler at attractive interest rates with easy monthly EMIs.',
    features: ['Minimal down payment', 'Quick disbursal', 'Flexible EMIs', 'All brands covered'],
  },
  {
    icon: Building2,
    title: 'Mortgage Loan',
    telugu: 'తాకట్టు రుణం',
    tagline: 'Unlock the value in your property with our mortgage loan facility.',
    features: ['High loan amounts', 'Commercial & residential', 'Long repayment period', 'Balance transfer'],
  },
  {
    icon: Truck,
    title: 'Home Take Loans',
    telugu: 'హోమ్ టేక్ లోన్స్',
    tagline: 'Our agents come to your doorstep — zero branch visits needed at all.',
    features: ['Doorstep service', 'Zero branch visits', 'Quick processing', 'All loan types covered'],
  },
];

const features = [
  {
    icon: Zap,
    title: 'Same-Day Disbursal',
    description:
      'Walk in with your gold, walk out with cash. Most approvals completed within 15 minutes of verification.',
  },
  {
    icon: Percent,
    title: 'Competitive Rates',
    description:
      'Interest rates starting from 11% per annum on simple interest. No hidden charges, no processing fees over 1%.',
  },
  {
    icon: ShieldCheck,
    title: 'Insured Vaults',
    description:
      'Your gold is stored in fully insured, bank-grade vaults under 24/7 CCTV with two-factor access.',
  },
  {
    icon: LayoutDashboard,
    title: 'Online Dashboard',
    description:
      'Track outstanding balance, view repayment history, and check interest accrued — anytime, anywhere.',
  },
  {
    icon: RefreshCw,
    title: 'Easy Re-Pledge',
    description:
      'Need more time? Submit a re-pledge request online and renew your loan with minimal paperwork.',
  },
  {
    icon: Users,
    title: 'Branch Support',
    description:
      'A dedicated branch manager assigned to every customer for personalised assistance throughout your loan tenure.',
  },
];

const steps = [
  {
    number: 1,
    title: 'Visit Branch',
    description: 'Walk into your nearest Rapid Consultancy branch with your gold ornaments and ID proof.',
  },
  {
    number: 2,
    title: 'Gold Valuation',
    description: 'Our certified appraisers assess the weight and purity of your gold on the spot.',
  },
  {
    number: 3,
    title: 'Approval & Sign',
    description: 'Receive loan offer, sign the agreement, and complete quick KYC verification.',
  },
  {
    number: 4,
    title: 'Get Cash + Portal Access',
    description: 'Receive funds in cash or bank transfer, plus credentials to manage your loan online.',
  },
];

const testimonials = [
  {
    name: 'Priya Reddy',
    role: 'Small Business Owner · Khammam',
    quote:
      'Got my loan approved in under 20 minutes. The branch staff at Musthafa Nagar explained every detail. The online portal makes it so easy to check my balance.',
    initials: 'PR',
  },
  {
    name: 'Mohammed Khan',
    role: 'Tailor · Khammam',
    quote:
      'Took a loan against my mother\'s jewellery to expand my workshop. Interest rates were the lowest I could find in the area. Renewed twice without any hassle.',
    initials: 'MK',
  },
  {
    name: 'Suresh Naidu',
    role: 'Farmer · Khammam',
    quote:
      'What I appreciate most is the transparency. Every rupee paid, every gram of gold weight — it\'s all there in the portal. No surprises, no hidden fees.',
    initials: 'SN',
  },
];

const faqItems = [
  {
    question: 'What documents do I need?',
    answer:
      'A government-issued photo ID (Aadhaar, PAN, Passport, or Voter ID), proof of address, and two passport-size photographs. That\'s it — no income proof required.',
  },
  {
    question: 'How is my gold valued?',
    answer:
      'Our certified appraisers weigh your gold and test its purity using non-destructive XRF analysis. Loan amount is up to 75% of the current market value of pure gold content.',
  },
  {
    question: 'Can I make repayments online?',
    answer:
      'Online payments are currently not available. All repayments are made at your assigned branch in person — this ensures every transaction is verified and recorded with a printed receipt.',
  },
  {
    question: 'What if I can\'t repay on time?',
    answer:
      'Contact your branch immediately. You can submit a re-pledge request through the online portal to extend your loan tenure, subject to gold revaluation and admin approval.',
  },
  {
    question: 'Is my gold safe?',
    answer:
      'Yes. All gold is stored in insured, climate-controlled vaults at the branch under 24/7 surveillance. Each item is tagged, sealed, and verifiable by the customer at any time.',
  },
  {
    question: 'How do I get portal access?',
    answer:
      'Customer accounts are created by the branch admin after your first loan is disbursed. You\'ll receive login credentials via SMS and email — sign in to track your loans anytime.',
  },
];

export default function Home() {
  const [weight, setWeight] = useState(25);
  const [purity, setPurity] = useState(22);
  const [tenure, setTenure] = useState(12);
  const [openFaq, setOpenFaq] = useState(0);

  const goldValue = useMemo(() => weight * 9000 * (purity / 24), [weight, purity]);
  const loanAmount = useMemo(() => Math.round((goldValue * 0.75) / 100) * 100, [goldValue]);
  const interest = useMemo(
    () => Math.round((loanAmount * 0.12 * (tenure / 12)) / 100) * 100,
    [loanAmount, tenure]
  );
  const total = useMemo(() => loanAmount + interest, [loanAmount, interest]);

  const formatINR = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    // Scroll-reveal IntersectionObserver
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

    // Nav shadow on scroll
    const nav = document.querySelector('.landing-nav') as HTMLElement | null;
    const onScroll = () => nav?.classList.toggle('nav-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div>
      <div className="top-accent" />
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="logo">
            <Image src="/logo.jpg" alt="RC Consultancy Gold Loan" width={44} height={44} style={{ borderRadius: '8px', objectFit: 'contain', background: '#fff' }} />
            <div>
              <div>Rapid Consultancy</div>
              <div className="logo-sub">LOAN MANAGEMENT</div>
            </div>
          </div>
          <div className="landing-nav-links">
            <button type="button" onClick={() => scrollToSection('loans')}>Loans</button>
            <button type="button" onClick={() => scrollToSection('features')}>Features</button>
            <button type="button" onClick={() => scrollToSection('how-it-works')}>How it Works</button>
            <button type="button" onClick={() => scrollToSection('calculator')}>Calculator</button>
            <button type="button" onClick={() => scrollToSection('faq')}>FAQ</button>
            <button type="button" onClick={() => scrollToSection('contact')}>Contact</button>
          </div>
          <div className="landing-nav-cta">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => scrollToSection('contact')}>
              Get a Loan
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <ShieldCheck size={18} className="icon" />
            Trusted by 25,000+ customers across Telangana
          </div>
          <h1 className="hero-title">
            Every loan you need,<br />
            <span className="accent">one trusted name.</span>
          </h1>
          <p className="hero-desc">
            From gold loans to home loans — get instant funds at competitive interest rates.
            Manage your loans, track repayments, and stay informed in one secure portal.
          </p>
          <div className="hero-ctas">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => scrollToSection('loans')}>
              Explore Loan Products <ArrowRight size={18} />
            </button>
            <Link href="/login" className="btn btn-outline btn-lg">
              <LogIn size={18} /> Customer Login
            </Link>
          </div>
          <div className="hero-trust">
            <div className="trust-item"><BadgeCheck size={16} /> RBI Compliant</div>
            <div className="trust-item"><Lock size={16} /> Bank-Grade Security</div>
            <div className="trust-item"><Clock size={16} /> Same-Day Disbursal</div>
            <div className="trust-item"><Percent size={16} /> From 11% p.a.</div>
          </div>
        </div>
        <div className="hero-visual" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            src="/logo.jpg"
            alt="RC Consultancy Gold Loan"
            width={380}
            height={380}
            style={{ objectFit: 'contain', maxWidth: '100%' }}
          />
        </div>
      </section>

      {/* Stats */}
      <section className="stats-band">
        <div className="stats-band-inner">
          {[
            { num: '25K+', label: 'Happy Customers' },
            { num: '₹450 Cr+', label: 'Loans Disbursed' },
            { num: '7', label: 'Loan Products' },
            { num: '15 min', label: 'Average Approval Time' },
          ].map((s, i) => (
            <div key={s.label} data-animate data-delay={String(i)}>
              <div className="band-stat-num">{s.num}</div>
              <div className="band-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Loan Services */}
      <section className="section" id="loans">
        <div className="section-inner">
          <div className="section-eyebrow" data-animate>Our Loan Products</div>
          <h2 className="section-title" data-animate data-delay="1">Financing for every need</h2>
          <p className="section-subtitle" data-animate data-delay="2">
            From gold loans to home loans — fast approvals, transparent terms, and doorstep service across Khammam.
          </p>
          <div className="loan-services-grid">
            {loanServices.map((service, i) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="loan-service-card"
                  data-animate
                  data-delay={String(i % 4)}
                >
                  <div className="lsc-top-bar" />
                  <div className="lsc-icon"><Icon size={22} /></div>
                  <div className="lsc-title">{service.title}</div>
                  <div className="lsc-telugu">{service.telugu}</div>
                  <p className="lsc-tagline">{service.tagline}</p>
                  <ul className="lsc-features">
                    {service.features.map(f => (
                      <li key={f}>
                        <CheckCircle2 size={11} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="lsc-apply-btn"
                    onClick={() => scrollToSection('contact')}
                  >
                    Apply Now <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section section-light" id="features">
        <div className="section-inner">
          <div className="section-eyebrow" data-animate>Why Rapid Consultancy</div>
          <h2 className="section-title" data-animate data-delay="1">Built for trust and speed</h2>
          <p className="section-subtitle" data-animate data-delay="2">
            Everything you need to manage your loans — without the paperwork hassle.
          </p>
          <div className="features">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="feature" data-animate data-delay={String((i % 3) + 1)}>
                  <div className="feature-icon"><Icon size={20} /></div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" id="how-it-works">
        <div className="section-inner">
          <div className="section-eyebrow" data-animate>Simple Process</div>
          <h2 className="section-title" data-animate data-delay="1">How it works</h2>
          <p className="section-subtitle" data-animate data-delay="2">Get a loan in four straightforward steps.</p>
          <div className="steps">
            {steps.map((step, i) => (
              <div key={step.number} className="step" data-animate data-delay={String(i)}>
                <div className="step-num">{step.number}</div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="section section-light" id="calculator">
        <div className="section-inner">
          <div className="section-eyebrow" data-animate>Loan Calculator</div>
          <h2 className="section-title" data-animate data-delay="1">Estimate your loan amount</h2>
          <p className="section-subtitle" data-animate data-delay="2">A quick estimate based on current gold rates. Final amount confirmed at branch.</p>
          <div className="calc-wrap" data-animate data-delay="3">
            <div className="calc-grid">
              <div>
                <div className="range-field">
                  <div className="range-head">
                    <span className="range-label">Gold Weight</span>
                    <span className="range-val">{weight} g</span>
                  </div>
                  <input
                    type="range"
                    className="range-input"
                    min={1}
                    max={200}
                    value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                  />
                </div>
                <div className="range-field">
                  <div className="range-head">
                    <span className="range-label">Gold Purity</span>
                    <span className="range-val">{purity}K</span>
                  </div>
                  <input
                    type="range"
                    className="range-input"
                    min={18}
                    max={24}
                    step={2}
                    value={purity}
                    onChange={e => setPurity(Number(e.target.value))}
                  />
                </div>
                <div className="range-field">
                  <div className="range-head">
                    <span className="range-label">Tenure</span>
                    <span className="range-val">{tenure} months</span>
                  </div>
                  <input
                    type="range"
                    className="range-input"
                    min={3}
                    max={36}
                    step={3}
                    value={tenure}
                    onChange={e => setTenure(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="calc-result">
                <div className="calc-result-label">Estimated Loan Amount</div>
                <div className="calc-result-val">{formatINR(loanAmount)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>At 12% p.a. simple interest</div>
                <div className="calc-result-sub">
                  Total interest ({tenure} mo): <strong style={{ color: 'var(--text)' }}>{formatINR(interest)}</strong><br />
                  Total payable: <strong style={{ color: 'var(--text)' }}>{formatINR(total)}</strong>
                </div>
                <button type="button" className="btn btn-primary btn-block" onClick={() => scrollToSection('contact')}>
                  Apply at Branch <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="section-inner">
          <div className="section-eyebrow" data-animate>Customer Stories</div>
          <h2 className="section-title" data-animate data-delay="1">What our customers say</h2>
          <p className="section-subtitle" data-animate data-delay="2">Real stories from real people across Telangana.</p>
          <div className="testimonials">
            {testimonials.map((testimonial, i) => (
              <div key={testimonial.name} className="testimonial" data-animate data-delay={String(i + 1)}>
                <div className="test-stars">★★★★★</div>
                <div className="test-quote">{testimonial.quote}</div>
                <div className="test-author">
                  <div className="test-avatar">{testimonial.initials}</div>
                  <div>
                    <div className="test-name">{testimonial.name}</div>
                    <div className="test-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-light" id="faq">
        <div className="section-inner">
          <div className="section-eyebrow" data-animate>Questions</div>
          <h2 className="section-title" data-animate data-delay="1">Frequently asked</h2>
          <p className="section-subtitle" data-animate data-delay="2">Everything you should know before applying for a loan.</p>
          <div className="faq-list" data-animate data-delay="3">
            {faqItems.map((item, index) => (
              <div
                key={item.question}
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
              >
                <div className="faq-q">
                  {item.question}
                  <ChevronDown size={18} />
                </div>
                {openFaq === index ? <div className="faq-a">{item.answer}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band" id="contact">
        <div className="cta-band-inner">
          <h2 data-animate>Ready to get started?</h2>
          <p data-animate data-delay="1">Visit our Musthafa Nagar branch or call us to learn more.</p>
          <div className="cta-band-btns" data-animate data-delay="2">
            <a href="tel:9502453969" className="btn btn-primary btn-lg">
              <Phone size={18} /> +91 95024 53969
            </a>
            <Link href="/login" className="btn btn-outline btn-lg cta-outline">
              <LogIn size={18} /> Customer Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-disclaimer">
            <strong style={{ color: '#BBB' }}>Disclaimer:</strong> Rapid Consultancy is a registered Non-Banking Financial Company providing loans against gold ornaments and other assets. Loans are subject to approval based on valuation and KYC verification. Interest rates and terms are subject to change. All transactions are governed by the loan agreement signed at the branch. This website does not facilitate online payments.
          </div>
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <Image src="/logo.jpg" alt="RC Consultancy Gold Loan" width={36} height={36} style={{ borderRadius: '6px', objectFit: 'contain', background: '#fff' }} />
                Rapid Consultancy
              </div>
              <div className="footer-desc">
                A trusted name in loan services across Telangana. Helping families and small businesses get the funds they need, safely and transparently.
              </div>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Product</div>
              <ul>
                <li><button type="button" onClick={() => scrollToSection('loans')}>Loan Products</button></li>
                <li><button type="button" onClick={() => scrollToSection('features')}>Features</button></li>
                <li><button type="button" onClick={() => scrollToSection('calculator')}>Calculator</button></li>
                <li><Link href="/login">Customer Login</Link></li>
                <li><Link href="/admin/login">Admin Login</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Company</div>
              <ul>
                <li><button type="button">About Us</button></li>
                <li><button type="button">Branch Locator</button></li>
                <li><button type="button">Careers</button></li>
                <li><button type="button">Press</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Legal</div>
              <ul>
                <li><Link href="/terms-of-service">Terms of Service</Link></li>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/grievance-redressal">Grievance Redressal</Link></li>
                <li><Link href="/fair-practices-code">Fair Practices Code</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 Rapid Consultancy Pvt Ltd. All rights reserved.</div>
            <div>Musthafa Nagar, Khammam, Telangana</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
