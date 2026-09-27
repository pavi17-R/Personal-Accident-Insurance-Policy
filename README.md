# Personal Accident Insurance Policy Administration & Claims Platform
### (AI-Augmented, Guidewire PolicyCenter + ClaimCenter&ndash;Inspired Implementation)

A full-stack insurance platform built with **React (Vite)**, **Node.js/Express**,
**MySQL**, and two **trained machine learning models**, developed entirely in
**VS Code**. Beyond basic policy administration (customer onboarding, issuance,
renewal, cancellation), this project adds the two modules most real insurance
suites are actually judged on and that a plain CRUD policy admin project skips:

1. **An AI Underwriting Risk Engine** — scores every policy applicant (Low /
   Medium / High) at issuance using a logistic regression model trained on
   occupation hazard class, coverage type, sum insured, and claim history, and
   feeds that score directly into the bound premium as a risk loading.
2. **A Claims Module with AI Fraud Detection** — conceptually the ClaimCenter
   half of Guidewire's suite, entirely missing from a policy-only project. Every
   claim is scored by a second trained model at submission, with explainable
   red flags (not just a black-box number) shown to the adjuster before they
   approve, reject, or pay it out.

> **Important disclaimer:** This project is **not** built on the actual Guidewire
> platform and does not use Gosu, PCF, or Guidewire Studio. It is an
> independent, Guidewire-inspired implementation created for academic demonstration
> purposes only. See [`GUIDEWIRE_ALIGNMENT.md`](./GUIDEWIRE_ALIGNMENT.md) for how each
> module conceptually maps to real Guidewire PolicyCenter/ClaimCenter/Predict terminology.

> **On the AI/ML:** the two models are genuinely trained (scikit-learn logistic
> regression) on a synthetic-but-realistic dataset — see [`ml/train_models.py`](./ml/train_models.py)
> to reproduce them and [`ml/MODEL_METRICS.md`](./ml/MODEL_METRICS.md) for accuracy/F1/confusion
> matrices. At runtime the trained coefficients are loaded and scored in plain
> JavaScript (`backend/services/mlService.js`) — no Python process needs to run
> the deployed app, keeping the stack to a single Node server.

---

## 1. Project Structure

```
pa-insurance/
├── frontend/                  React + Vite single-page application
│   ├── src/
│   │   ├── components/        Sidebar, Header, Layout, Modal, StatusBadge, RiskBadge
│   │   ├── pages/              Dashboard, Customers, Policies, Claims, forms, details
│   │   ├── services/api.js     Axios wrapper for all REST calls
│   │   ├── App.jsx             Route definitions
│   │   └── main.jsx             App entry point
│   ├── index.html
│   └── package.json
│
├── backend/                   Node.js + Express REST API
│   ├── controllers/            Request handlers incl. claimController.js
│   ├── routes/                  Express routers incl. claimRoutes.js
│   ├── services/                 Premium calc, policy numbering, activity log,
│   │                              mlService.js (AI inference), riskAssessmentService.js,
│   │                              fraudAssessmentService.js
│   ├── config/db.js               MySQL connection pool
│   ├── middleware/                Validation + centralized error handler
│   ├── server.js
│   └── package.json
│
├── ml/                          AI/ML model artifacts (this is what makes it AI-based)
│   ├── train_models.py            Reproducible training script (scikit-learn)
│   ├── risk_model.json             Trained underwriting risk model (coefficients)
│   ├── fraud_model.json            Trained fraud detection model (coefficients)
│   └── MODEL_METRICS.md            Accuracy / F1 / confusion matrices for both models
│
├── database/
│   └── schema.sql               CREATE TABLE statements + sample data (incl. claims)
│
├── README.md                     This file (setup + architecture + API docs)
├── GUIDEWIRE_ALIGNMENT.md         Guidewire PolicyCenter/ClaimCenter/Predict concept mapping
├── TEST_CASES.md                  Manual test case checklist
└── PROJECT_REPORT_AND_VIVA.md      Report content, PPT structure, viva Q&A (incl. AI/ML)
```

---

## 2. Technology Stack

| Layer            | Technology                          |
|-------------------|--------------------------------------|
| Frontend          | React 18 + Vite, React Router, Axios |
| Backend            | Node.js + Express.js                |
| Database           | MySQL 8 (MariaDB-compatible)        |
| AI/ML              | scikit-learn (offline training), plain-JS logistic regression inference at runtime |
| Styling            | Plain CSS (no framework)            |
| Dev Environment    | VS Code                             |
| Communication      | REST APIs (JSON)                    |

No authentication, payment gateway, external paid API, or Docker is used, per
project scope. Python/scikit-learn is only needed if you want to **retrain**
the models from scratch — the trained model files are already committed under
`ml/`, so running the app itself only needs Node.js and MySQL.

---

## 3. Prerequisites

Install the following before running the project:

- **Node.js** v18+ and npm (https://nodejs.org)
- **MySQL Server** 8.x (or MariaDB 10.x), running locally, with a user account you can log into
- **VS Code** (recommended extensions: ESLint, MySQL, REST Client)
- *(Optional, only to retrain the AI models)* **Python 3.9+** with `pip install scikit-learn pandas numpy`

Verify installs:
```bash
node -v
npm -v
mysql --version
```

---

## 4. Setup Instructions

### Step 1 — Clone / extract the project
Open the `pa-insurance` folder in VS Code.

### Step 2 — Create the database
Open a terminal (or MySQL Workbench / VS Code MySQL extension) and run:
```bash
mysql -u root -p < database/schema.sql
```
This drops (if exists) and recreates the `pa_insurance` database, creates all
tables, and inserts sample customers, policies, coverages, and activity logs.

### Step 3 — Configure and start the backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` and set your MySQL credentials:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pa_insurance
```
Start the API server:
```bash
npm run dev        # uses nodemon (auto-restart)
# or
npm start
```
You should see:
```
[DB] Connected to MySQL database: pa_insurance
[Server] PA Insurance backend running on http://localhost:5000
```
Test it: open `http://localhost:5000/api/health` in a browser &rarr; `{"success":true,...}`

### Step 4 — Start the frontend
In a **new terminal**:
```bash
cd frontend
npm install
npm run dev
```
Vite will start on `http://localhost:5173`. The dev server proxies all `/api/*`
requests to `http://localhost:5000` (configured in `vite.config.js`), so the
frontend and backend can run independently without CORS issues.

### Step 5 — Open the app
Visit **http://localhost:5173** in your browser. You should land on `/dashboard`
with sample data already loaded (5 customers, 5 policies, 2 claims — one of
which is already flagged High fraud risk by the AI model).

### Step 6 (optional) — Retrain the AI models
The trained model files (`ml/risk_model.json`, `ml/fraud_model.json`) are
already committed, so this step is **not required to run the app**. Only do
this if you want to regenerate them (e.g. to demonstrate reproducibility in
your viva):
```bash
cd ml
pip install scikit-learn pandas numpy
python3 train_models.py
```
This regenerates both JSON model files and `MODEL_METRICS.md` from a freshly
generated synthetic dataset (seeded, so results are stable run-to-run).

---

## 5. Application Routes

| Route                        | Page                                    |
|-------------------------------|-------------------------------------------|
| `/dashboard`                   | KPI cards, AI fraud alerts, high-risk policy count, recent activity |
| `/customers`                    | Customer list, search (shows occupation + hazard class) |
| `/customers/new`                | Add customer form (incl. occupation & hazard class for the risk model) |
| `/customers/:id`                | Customer details + their policies          |
| `/customers/:id/edit`           | Edit customer form                          |
| `/policies`                      | Policy list, search, status filter         |
| `/policies/new`                  | Create policy — live AI risk assessment + premium preview |
| `/policies/:id`                  | Full policy details, risk tier, renewal history |
| `/policies/:id/renew`            | Renewal transaction form (re-runs the risk model) |
| `/policies/:id/cancel`            | Cancellation transaction form               |
| `/claims`                         | Claims list, filter by status / AI fraud level |
| `/claims/new`                      | File a claim — live AI fraud assessment before submit |
| `/claims/:id`                       | Claim details, fraud explanation, adjudicate (approve/reject/mark paid) |

---

## 6. Premium Calculation & AI Risk Loading (Viva-Explainable)

Base premium is a simple rate table (unchanged from a plain policy-admin
project, so it's still easy to explain):
```
base rate (per ₹1000 of Sum Insured) depends on Coverage Type:
    Basic          -> 2.5
    Standard       -> 3.5
    Comprehensive  -> 5.0

base_premium = (sum_insured / 1000) * base_rate
base_premium = max(base_premium, ₹500)     // minimum premium floor
```

**What's new:** before the premium is finalized, the AI underwriting risk
model (`backend/services/mlService.js` → `assessRisk`) scores the applicant
and returns a risk tier with an associated loading:

```
Low risk tier     -> +0%  loading
Medium risk tier  -> +15% loading
High risk tier    -> +35% loading

final_premium = base_premium * (1 + loading_pct / 100)
```

**Example:** Standard coverage, Sum Insured = ₹5,00,000, applicant scored Medium risk
```
base_premium  = (500000 / 1000) * 3.5 = ₹1,750
final_premium = 1750 * 1.15            = ₹2,012.50
```
The risk tier, numeric score (0–100), and premium loading are all persisted on
the `policies` row, not just shown as a UI preview — see section 8 for how the
model itself works.

---

## 7. Database Design

### Tables
- **customers** — policyholder accounts (Guidewire Account/Contact equivalent); now includes `occupation` and `occupation_risk_category` (Low/Medium/High), which feed the AI risk model
- **policies** — one row per policy period (Guidewire PolicyPeriod equivalent); `parent_policy_id` links a renewed policy to its predecessor; now includes `risk_tier`, `risk_score`, and `premium_loading_pct` written by the AI model at issuance/renewal
- **policy_coverages** — coverage line items selected for a policy (Accidental Death / Permanent Disability / Medical Expense Coverage) — also used to validate claim amounts against coverage limits
- **policy_renewals** — audit trail of renewal transactions (old policy → new policy, premium before/after)
- **policy_cancellations** — cancellation reason and date for a cancelled policy
- **claims** — one row per claim (Guidewire ClaimCenter Claim equivalent); includes `fraud_score`, `fraud_level`, and `fraud_flags` (JSON) written by the AI fraud model at submission
- **activity_log** — feeds the Dashboard's "Recent Activities" widget

### ER Diagram (described)
```
customers (1) ──< (many) policies
policies  (1) ──< (many) policy_coverages
policies  (1) ──< (1) policy_cancellations
policies  (1) ──< (many) claims                                          [NEW]
policies  (1) ──< (many, self-referencing via parent_policy_id) policies   [renewal chain]
policies  (many) ──< policy_renewals >── (many) policies   [old_policy_id / new_policy_id]
```
Full CREATE TABLE statements, foreign keys, and sample data are in
`database/schema.sql`.

---

## 8. AI/ML Models

Both models are logistic regression, trained offline in `ml/train_models.py`
on a synthetic-but-realistic dataset (there's no real insurer data available
for a student project — this is disclosed openly, not hidden). See
`ml/MODEL_METRICS.md` for the full metrics; summary below.

### 8.1 Underwriting Risk Model (multinomial: Low / Medium / High)
- **Features:** applicant age, occupation hazard class, coverage type, sum
  insured, prior claims count, customer tenure with the company
- **No protected attributes** (gender, religion, caste, etc.) are used —
  a deliberate fairness choice worth mentioning in a viva
- **Test accuracy:** ~82%, macro F1 ~0.7 on a held-out 20% split
- **Output:** risk tier + 0–100 score (driven by P(High risk)) + plain-English reasons + premium loading %

### 8.2 Claims Fraud Detection Model (binary, class-balanced)
- **Features:** claim-to-sum-insured ratio, days between policy start and
  incident, days between incident and filing, prior claims in the last 12
  months, claim type, whether the incident is near policy expiry
- **Test accuracy:** ~68%, tuned to favor **recall over precision** — in fraud
  detection, missing real fraud (false negative) is costlier than flagging an
  honest claim for a closer look (false positive), so the model is
  intentionally biased toward catching more true fraud at the cost of some
  extra manual reviews. This tradeoff is a good viva talking point.
- **Output:** fraud score (0–100), fraud level (Low/Medium/High), and a list
  of explainable red flags — claims scored High are automatically routed to
  "Under Review" instead of "Submitted" for mandatory manual adjudication

### 8.3 Why plain-JS inference instead of a live Python model server?
Running a second Python/FastAPI process alongside Node would be more
"realistic" architecturally, but adds real operational cost (two processes,
two languages, two things that can fail) for a project that needs to demo
reliably and run fast. Logistic regression inference is just a dot product +
sigmoid/softmax, so `backend/services/mlService.js` re-implements it in plain
JavaScript from the exported coefficients — the model is genuinely trained
and evaluated in scikit-learn (reproducible via `ml/train_models.py`), but the
deployed app stays a single Node process. This tradeoff — and how you'd swap
in a real model-serving layer (Guidewire Predict does something conceptually
similar) if this went to production — is worth being ready to explain.

---

## 9. REST API Documentation

Base URL: `http://localhost:5000/api`

### Customers
| Method | Endpoint             | Description                     | Body |
|--------|------------------------|-----------------------------------|------|
| GET    | `/customers?search=`     | List / search customers         | — |
| GET    | `/customers/:id`          | Get one customer + their policies | — |
| POST   | `/customers`               | Create customer                   | `{full_name, date_of_birth, gender, phone, email, address, occupation, occupation_risk_category}` |
| PUT    | `/customers/:id`            | Update customer                    | same as above |
| DELETE | `/customers/:id`             | Delete customer (blocked if active policies exist) | — |

### Policies
| Method | Endpoint                          | Description                              | Body |
|--------|-------------------------------------|---------------------------------------------|------|
| GET    | `/policies?search=&status=&customer_id=` | List / search / filter policies      | — |
| GET    | `/policies/:id`                       | Full policy detail (coverages, renewals, cancellation, risk tier) | — |
| POST   | `/policies`                            | Create policy (AI risk model runs automatically) | `{customer_id, coverage_type, sum_insured, policy_start_date, policy_end_date, coverages:[{coverage_name, coverage_amount}], policy_status}` |
| PUT    | `/policies/:id`                         | Update draft policy fields                  | any subset of policy fields |
| POST   | `/policies/:id/renew`                    | Renew policy (re-runs AI risk model)     | `{policy_start_date, policy_end_date, sum_insured?, coverage_type?}` |
| POST   | `/policies/:id/cancel`                    | Cancel policy                                | `{cancellation_reason, cancellation_date}` |
| POST   | `/policies/calculate-premium`              | Preview premium without saving               | `{coverage_type, sum_insured, premium_loading_pct?}` |
| POST   | `/policies/assess-risk`                      | Live AI risk preview without saving          | `{customer_id, coverage_type, sum_insured, policy_start_date}` |

### Claims
| Method | Endpoint                     | Description                                  | Body |
|--------|---------------------------------|--------------------------------------------------|------|
| GET    | `/claims?search=&status=&fraud_level=&policy_id=` | List / search / filter claims  | — |
| GET    | `/claims/:id`                     | Full claim detail incl. AI fraud flags          | — |
| POST   | `/claims`                           | File a claim (AI fraud model runs automatically) | `{policy_id, claim_type, incident_date, filed_date?, claim_amount, description}` |
| POST   | `/claims/assess-fraud`               | Live AI fraud preview without saving             | `{policy_id, claim_type, claim_amount, incident_date, filed_date?}` |
| POST   | `/claims/:id/decide`                   | Adjudicate — approve or reject                    | `{decision: 'Approved'\|'Rejected', decision_notes?}` |
| POST   | `/claims/:id/mark-paid`                 | Mark an Approved claim as Paid                     | — |

### Dashboard
| Method | Endpoint       | Description |
|--------|------------------|--------------|
| GET    | `/dashboard`      | KPI counts, AI fraud alerts, high-risk policy count, recent policies, recent activity |

All responses follow the shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## 10. Business Rules Enforced by the Backend

- A customer cannot be deleted while they hold an **Active** policy.
- Only **Active** or **Expired** policies can be **renewed**.
- Only **Active** or **Draft** policies can be **cancelled**.
- `policy_end_date` must be after `policy_start_date`.
- Renewing a policy sets the old policy's status to `Renewed`, creates a brand-new
  policy row linked via `parent_policy_id`, re-runs the AI risk model, and logs
  the transaction in `policy_renewals`.
- Cancelling a policy inserts a row into `policy_cancellations` and sets
  `policy_status = 'Cancelled'`.
- Policy numbers are auto-generated as `PA-<YEAR>-<SEQUENCE>` (e.g. `PA-2026-0005`).
- Customer codes are auto-generated as `CUST-<SEQUENCE>`.
- A claim can only be filed against an **Active** or **Expired** policy.
- A claim's `incident_date` must fall within the policy's coverage period.
- A claim's type must match a coverage actually purchased on that policy, and
  its amount cannot exceed that coverage's limit.
- Claims scored **High** fraud risk by the AI model are auto-routed to
  `UnderReview` instead of `Submitted`.
- Only `Submitted`/`UnderReview` claims can be adjudicated (Approved/Rejected);
  only `Approved` claims can be marked `Paid`.
- Claim numbers are auto-generated as `CLM-<YEAR>-<SEQUENCE>` (e.g. `CLM-2026-0003`).

---

## 11. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `[DB] Failed to connect to MySQL` on backend start | Check `.env` credentials, confirm MySQL server is running, confirm `pa_insurance` database exists (re-run `schema.sql`) |
| Frontend loads but shows "Could not load dashboard data" | Backend isn't running on port 5000, or `.env` PORT was changed without updating `vite.config.js` proxy |
| `ER_DUP_ENTRY` when creating a customer | Email already exists — the `customers.email` column is unique |
| CORS errors in browser console | Confirm you're accessing the frontend via `http://localhost:5173` (uses the Vite proxy) and not opening `index.html` directly |
| `Cannot find module '../../ml/risk_model.json'` on backend start | You're running `node` from the wrong directory, or the `ml/` folder wasn't copied alongside `backend/` — both must sit under the same `pa-insurance/` root |
| Risk/fraud panel stuck on "Scoring…" in the UI | Backend isn't reachable, or the selected customer/policy no longer exists — check the browser console for the failed request |

---
