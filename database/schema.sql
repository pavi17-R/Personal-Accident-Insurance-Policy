-- =====================================================================
-- Personal Accident Insurance Policy Administration System
-- Database Schema (MySQL)
-- Guidewire PolicyCenter + ClaimCenter inspired data model
-- (simplified for a college project - NOT the actual Guidewire schema)
-- v2: adds occupation/risk rating fields, claims module, and AI
--     model output columns (risk_tier/risk_score, fraud_score/fraud_level)
-- =====================================================================

DROP DATABASE IF EXISTS pa_insurance;
CREATE DATABASE pa_insurance;
USE pa_insurance;

-- -----------------------------------------------------------------
-- customers  -> conceptually similar to Account/Contact in Guidewire
-- occupation + occupation_risk_category feed the AI underwriting model
-- -----------------------------------------------------------------
CREATE TABLE customers (
    customer_id            INT AUTO_INCREMENT PRIMARY KEY,
    customer_code          VARCHAR(20) NOT NULL UNIQUE,      -- e.g. CUST-0001
    full_name              VARCHAR(100) NOT NULL,
    date_of_birth           DATE NOT NULL,
    gender                  ENUM('Male','Female','Other') NOT NULL,
    phone                   VARCHAR(15) NOT NULL,
    email                   VARCHAR(100) NOT NULL UNIQUE,
    address                 VARCHAR(255) NOT NULL,
    occupation              VARCHAR(100) NOT NULL DEFAULT 'Not Specified',
    occupation_risk_category ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',  -- underwriter-assigned occupation hazard class
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------
-- policies  -> conceptually similar to Policy / PolicyPeriod in Guidewire
-- risk_tier/risk_score/premium_loading_pct are written by the AI
-- underwriting risk model at issuance time (see backend/services/mlService.js)
-- -----------------------------------------------------------------
CREATE TABLE policies (
    policy_id         INT AUTO_INCREMENT PRIMARY KEY,
    policy_number     VARCHAR(30) NOT NULL UNIQUE,     -- e.g. PA-2026-0001
    customer_id       INT NOT NULL,
    policy_type       VARCHAR(50) NOT NULL DEFAULT 'Personal Accident',
    coverage_type     ENUM('Basic','Standard','Comprehensive') NOT NULL,
    sum_insured       DECIMAL(12,2) NOT NULL,
    premium           DECIMAL(12,2) NOT NULL,
    risk_tier         ENUM('Low','Medium','High') NULL,        -- AI underwriting model output
    risk_score        DECIMAL(5,2) NULL,                       -- 0-100 probability-derived score
    premium_loading_pct DECIMAL(5,2) NOT NULL DEFAULT 0,       -- extra % loaded onto base premium due to risk tier
    policy_start_date DATE NOT NULL,
    policy_end_date   DATE NOT NULL,
    policy_status     ENUM('Draft','Active','Expired','Cancelled','Renewed') NOT NULL DEFAULT 'Draft',
    parent_policy_id  INT DEFAULT NULL,                -- points to the original policy if this is a renewal
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_policy_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_policy_parent FOREIGN KEY (parent_policy_id) REFERENCES policies(policy_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------
-- policy_coverages -> conceptually similar to Coverage in Guidewire
-- -----------------------------------------------------------------
CREATE TABLE policy_coverages (
    coverage_id     INT AUTO_INCREMENT PRIMARY KEY,
    policy_id       INT NOT NULL,
    coverage_name   ENUM('Accidental Death','Permanent Disability','Medical Expense Coverage') NOT NULL,
    coverage_amount DECIMAL(12,2) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coverage_policy FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------
-- policy_renewals -> conceptually similar to a Renewal Transaction
-- -----------------------------------------------------------------
CREATE TABLE policy_renewals (
    renewal_id     INT AUTO_INCREMENT PRIMARY KEY,
    old_policy_id  INT NOT NULL,
    new_policy_id  INT NOT NULL,
    renewal_date   DATE NOT NULL,
    old_premium    DECIMAL(12,2) NOT NULL,
    new_premium    DECIMAL(12,2) NOT NULL,
    remarks        VARCHAR(255),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_renewal_old FOREIGN KEY (old_policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE,
    CONSTRAINT fk_renewal_new FOREIGN KEY (new_policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------
-- policy_cancellations -> conceptually similar to a Cancellation Transaction
-- -----------------------------------------------------------------
CREATE TABLE policy_cancellations (
    cancellation_id      INT AUTO_INCREMENT PRIMARY KEY,
    policy_id             INT NOT NULL UNIQUE,
    cancellation_reason   VARCHAR(255) NOT NULL,
    cancellation_date     DATE NOT NULL,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cancel_policy FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------
-- claims -> conceptually similar to Claim in Guidewire ClaimCenter
-- fraud_score/fraud_level/fraud_flags are written by the AI fraud
-- detection model at submission time (see backend/services/mlService.js)
-- -----------------------------------------------------------------
CREATE TABLE claims (
    claim_id        INT AUTO_INCREMENT PRIMARY KEY,
    claim_number    VARCHAR(30) NOT NULL UNIQUE,        -- e.g. CLM-2026-0001
    policy_id       INT NOT NULL,
    claim_type      ENUM('Accidental Death','Permanent Disability','Medical Expense Coverage') NOT NULL,
    incident_date   DATE NOT NULL,
    filed_date      DATE NOT NULL,
    claim_amount    DECIMAL(12,2) NOT NULL,
    description     VARCHAR(1000) NOT NULL,
    claim_status    ENUM('Submitted','UnderReview','Approved','Rejected','Paid') NOT NULL DEFAULT 'Submitted',
    fraud_score     DECIMAL(5,2) NOT NULL DEFAULT 0,    -- 0-100, AI fraud probability
    fraud_level     ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
    fraud_flags     JSON NULL,                          -- explainable rule-based red flags backing the score
    decision_notes  VARCHAR(255) NULL,
    decided_at      DATETIME NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_claim_policy FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------
-- activity_log -> feeds the "Recent activities" dashboard widget
-- -----------------------------------------------------------------
CREATE TABLE activity_log (
    activity_id    INT AUTO_INCREMENT PRIMARY KEY,
    activity_type  VARCHAR(50) NOT NULL,   -- e.g. CUSTOMER_CREATED, POLICY_ISSUED, POLICY_RENEWED, POLICY_CANCELLED, CLAIM_SUBMITTED, CLAIM_DECIDED
    description    VARCHAR(255) NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- SAMPLE DATA
-- =====================================================================

INSERT INTO customers (customer_code, full_name, date_of_birth, gender, phone, email, address, occupation, occupation_risk_category) VALUES
('CUST-0001', 'Arun Kumar', '1990-05-14', 'Male', '9876543210', 'arun.kumar@example.com', '12 Anna Nagar, Chennai, TN', 'Software Engineer', 'Low'),
('CUST-0002', 'Priya Sharma', '1988-11-02', 'Female', '9876500001', 'priya.sharma@example.com', '45 MG Road, Bengaluru, KA', 'Sales Manager (frequent travel)', 'Medium'),
('CUST-0003', 'Rahul Verma', '1995-03-22', 'Male', '9876500002', 'rahul.verma@example.com', '9 Park Street, Kolkata, WB', 'Construction Site Supervisor', 'High'),
('CUST-0004', 'Sneha Reddy', '1992-07-09', 'Female', '9876500003', 'sneha.reddy@example.com', '77 Jubilee Hills, Hyderabad, TS', 'School Teacher', 'Low');

INSERT INTO policies (policy_number, customer_id, policy_type, coverage_type, sum_insured, premium, risk_tier, risk_score, premium_loading_pct, policy_start_date, policy_end_date, policy_status) VALUES
('PA-2025-0001', 1, 'Personal Accident', 'Standard', 500000.00, 1750.00, 'Low', 22.50, 0, '2025-06-01', '2026-05-31', 'Active'),
('PA-2025-0002', 2, 'Personal Accident', 'Comprehensive', 1000000.00, 5750.00, 'Medium', 48.10, 15, '2025-01-15', '2026-01-14', 'Active'),
('PA-2024-0003', 3, 'Personal Accident', 'Basic', 200000.00, 690.00, 'High', 71.30, 38, '2024-08-01', '2025-07-31', 'Expired'),
('PA-2026-0004', 4, 'Personal Accident', 'Standard', 500000.00, 1750.00, 'Low', 18.90, 0, '2026-08-01', '2027-07-31', 'Draft');

INSERT INTO policy_coverages (policy_id, coverage_name, coverage_amount) VALUES
(1, 'Accidental Death', 500000.00),
(1, 'Permanent Disability', 250000.00),
(2, 'Accidental Death', 1000000.00),
(2, 'Permanent Disability', 500000.00),
(2, 'Medical Expense Coverage', 100000.00),
(3, 'Accidental Death', 200000.00),
(4, 'Accidental Death', 500000.00),
(4, 'Medical Expense Coverage', 50000.00);

INSERT INTO claims (claim_number, policy_id, claim_type, incident_date, filed_date, claim_amount, description, claim_status, fraud_score, fraud_level, fraud_flags) VALUES
('CLM-2025-0001', 3, 'Accidental Death', '2025-01-10', '2025-01-14', 190000.00, 'Fatal road accident during site commute; police FIR and death certificate attached.', 'UnderReview', 68.40, 'High', JSON_ARRAY('Claim amount is 95% of policy sum insured', 'Claim filed within 90 days of policy start')),
('CLM-2025-0002', 2, 'Medical Expense Coverage', '2025-03-02', '2025-03-05', 45000.00, 'Fractured wrist after a fall; hospital bills and X-ray report attached.', 'Approved', 14.20, 'Low', JSON_ARRAY());

INSERT INTO activity_log (activity_type, description) VALUES
('CUSTOMER_CREATED', 'New customer Arun Kumar (CUST-0001) registered'),
('POLICY_ISSUED', 'Policy PA-2025-0001 issued for Arun Kumar'),
('CUSTOMER_CREATED', 'New customer Priya Sharma (CUST-0002) registered'),
('POLICY_ISSUED', 'Policy PA-2025-0002 issued for Priya Sharma'),
('POLICY_ISSUED', 'Policy PA-2024-0003 issued for Rahul Verma'),
('CLAIM_SUBMITTED', 'Claim CLM-2025-0001 submitted against policy PA-2024-0003 — flagged High fraud risk by AI model'),
('CLAIM_SUBMITTED', 'Claim CLM-2025-0002 submitted against policy PA-2025-0002'),
('CLAIM_DECIDED', 'Claim CLM-2025-0002 approved after manual review');
