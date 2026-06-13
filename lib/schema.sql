-- SQL Schema for GoldSecure Finance / Rapid Consultancy Supabase Setup
-- Copy and paste this script into the Supabase SQL Editor and click 'Run'.

-- Drop existing tables if they exist to avoid schema conflicts
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    dob DATE,
    kyc_status TEXT DEFAULT 'Pending' CHECK (kyc_status IN ('Verified', 'Pending', 'Rejected')),
    branch TEXT DEFAULT 'Musthafa Nagar Branch',
    joined_date DATE DEFAULT CURRENT_DATE,
    password TEXT DEFAULT 'Cust@123',
    processing_fee NUMERIC DEFAULT 0
);
-- Migration for existing databases:
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS processing_fee NUMERIC DEFAULT 0;

-- 2. Loans Table
CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    loan_id TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'overdue')),
    principal NUMERIC NOT NULL,
    outstanding NUMERIC NOT NULL,
    interest_due NUMERIC DEFAULT 0,
    interest_rate NUMERIC NOT NULL,
    next_due_date DATE,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    gold_weight NUMERIC NOT NULL,
    gold_purity NUMERIC NOT NULL,
    estimated_gold_value NUMERIC NOT NULL,
    branch TEXT DEFAULT 'Musthafa Nagar Branch'
);

-- 3. Access Requests Table
CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    dob DATE,
    branch TEXT DEFAULT 'Musthafa Nagar Branch',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    request_date DATE DEFAULT CURRENT_DATE,
    password_hash TEXT
);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    details TEXT,
    admin TEXT NOT NULL
);

-- Enable RLS (Optional, for now we keep it open for easy testing with Anon key)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies (Select, Insert, Update, Delete for authenticated/anon keys)
CREATE POLICY "Allow read for anon" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow write for anon" ON customers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon loans" ON loans FOR SELECT USING (true);
CREATE POLICY "Allow write for anon loans" ON loans FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon requests" ON access_requests FOR SELECT USING (true);
CREATE POLICY "Allow write for anon requests" ON access_requests FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow write for anon logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Mock Data (Optional, delete if tables should start empty)
INSERT INTO customers (id, name, mobile, email, address, dob, kyc_status, branch, joined_date)
VALUES 
('cust-1', 'Priya Sharma', '+91 98765 43210', 'priya.sharma@example.com', '207 MG Road, Bengaluru, Karnataka 560001', '1991-08-14', 'Verified', 'Musthafa Nagar Branch', '2026-01-10'),
('cust-2', 'Rahul Verma', '+91 98123 45678', 'rahul.verma@example.com', '45 HSR Layout, Bengaluru, Karnataka 560102', '1988-11-23', 'Verified', 'Musthafa Nagar Branch', '2025-10-10')
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, loan_id, customer_id, customer_name, status, principal, outstanding, interest_due, interest_rate, next_due_date, start_date, maturity_date, gold_weight, gold_purity, estimated_gold_value, branch)
VALUES
('1', 'GL-2101', 'cust-1', 'Priya Sharma', 'active', 250000, 120000, 5200, 9.5, '2026-06-15', '2026-01-10', '2026-07-10', 32, 18, 380000, 'Musthafa Nagar Branch'),
('2', 'GL-2102', 'cust-1', 'Priya Sharma', 'active', 150000, 76000, 3100, 9.5, '2026-06-28', '2026-02-05', '2026-08-05', 18, 22, 215000, 'Musthafa Nagar Branch'),
('3', 'GL-2103', 'cust-2', 'Rahul Verma', 'closed', 100000, 0, 0, 9.5, '2026-04-10', '2025-10-10', '2026-04-10', 15, 22, 180000, 'Musthafa Nagar Branch')
ON CONFLICT (id) DO NOTHING;

INSERT INTO access_requests (id, name, mobile, email, address, dob, branch, status, request_date)
VALUES
('req-1', 'Amit Singh', '+91 95432 10987', 'amit.singh@example.com', '89 Indiranagar, Bengaluru, Karnataka 560038', '1993-05-12', 'Musthafa Nagar Branch', 'pending', '2026-05-19'),
('req-2', 'Sneha Patel', '+91 94321 09876', 'sneha.patel@example.com', '15 Whitefield, Bengaluru, Karnataka 560066', '1996-09-22', 'Musthafa Nagar Branch', 'pending', '2026-05-20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, timestamp, action, details, admin)
VALUES
('log-1', NOW() - INTERVAL '1 hour', 'System Initialized', 'Initial mock database successfully loaded into Supabase.', 'System')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STAFF & LOAN SANCTION EXTENSIONS
-- Run this block separately if the four tables above already exist
-- ============================================================

-- 5. Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT 'Staff@123',
    branch TEXT DEFAULT 'Musthafa Nagar Branch',
    is_active BOOLEAN DEFAULT TRUE,
    created_date DATE DEFAULT CURRENT_DATE
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for anon staff" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow write for anon staff" ON staff FOR ALL USING (true) WITH CHECK (true);

-- 6. Loan Sanction Requests Table
CREATE TABLE IF NOT EXISTS loan_sanction_requests (
    id TEXT PRIMARY KEY,
    staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
    staff_name TEXT NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    principal NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL DEFAULT 9.5,
    gold_weight NUMERIC NOT NULL,
    gold_purity NUMERIC NOT NULL,
    estimated_gold_value NUMERIC NOT NULL,
    tenure_months INTEGER NOT NULL DEFAULT 6,
    branch TEXT DEFAULT 'Musthafa Nagar Branch',
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_date TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by TEXT,
    reviewed_date TIMESTAMPTZ,
    admin_notes TEXT
);

ALTER TABLE loan_sanction_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for anon sanction" ON loan_sanction_requests FOR SELECT USING (true);
CREATE POLICY "Allow write for anon sanction" ON loan_sanction_requests FOR ALL USING (true) WITH CHECK (true);

-- Seed initial staff member
INSERT INTO staff (id, name, mobile, email, password, branch, is_active, created_date)
VALUES
('staff-1', 'Kavya Nair', '+91 99887 76655', 'kavya.nair@rapidconsult.com', 'Staff@123', 'Musthafa Nagar Branch', TRUE, '2026-01-01')
ON CONFLICT (id) DO NOTHING;

-- 7. Loan Payments Table
-- Tracks individual payment records for repayment history display.
CREATE TABLE IF NOT EXISTS loan_payments (
    id TEXT PRIMARY KEY,
    loan_id TEXT NOT NULL,
    loan_db_id TEXT,
    amount NUMERIC NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('interest', 'principal', 'mixed', 'emi')),
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for anon payments" ON loan_payments FOR SELECT USING (true);
CREATE POLICY "Allow write for anon payments" ON loan_payments FOR ALL USING (true) WITH CHECK (true);

-- 8. Repledge Requests Table
-- Run this block to add re-pledge tracking backed by the database.
CREATE TABLE IF NOT EXISTS repledge_requests (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    loan_id TEXT,
    reason TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    request_date TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by TEXT,
    reviewed_date TIMESTAMPTZ,
    admin_notes TEXT
);

ALTER TABLE repledge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for anon repledge" ON repledge_requests FOR SELECT USING (true);
CREATE POLICY "Allow write for anon repledge" ON repledge_requests FOR ALL USING (true) WITH CHECK (true);
