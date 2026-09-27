# Guidewire Suite Concept Alignment

This project is developed independently in **VS Code** using React, Node.js,
MySQL, and two trained ML models. It is **not** deployed on, or built inside,
any actual Guidewire platform, and does not use Gosu, PCF pages, Guidewire
Studio, or any Guidewire runtime. This document exists purely to help explain,
in a viva or report, how each module of this application **conceptually
corresponds** to real Guidewire terminology.

A plain policy-admin project only ever touches **PolicyCenter**. This project
deliberately covers three of Guidewire's real product lines conceptually:
**PolicyCenter** (policy lifecycle), **ClaimCenter** (the claims module —
usually skipped entirely in student projects), and **Guidewire
Predict/Cyence** (the predictive-analytics layer, mirrored here by the two
trained ML models scoring risk and fraud).

| This Application                     | Guidewire PolicyCenter Concept                                   | Notes |
|----------------------------------------|----------------------------------------------------------------------|-------|
| `customers` table / Customer module     | **Account** and **Contact**                                          | In real PolicyCenter, an Account holds one or more Contacts (policyholders). Here, one `customers` row plays both roles for simplicity. |
| `policies` table / Policy Creation       | **Policy** and **PolicyPeriod**                                       | Guidewire models a Policy as a series of time-bound PolicyPeriods (term periods). Each row in our `policies` table represents one such period. |
| Policy Creation form                       | **Submission** → **Underwriting** → **Issuance** workflow              | Real PolicyCenter routes a new business submission through underwriting approval before binding. This project simplifies that into a single "Create Policy" form that directly issues a Draft or Active policy. |
| Renewal (`/policies/:id/renew`)             | **Renewal Transaction / Job**                                          | Guidewire generates a Renewal job automatically near expiration, recalculates premium, and creates a new PolicyPeriod. This project does the same via a manual "Renew Policy" action. |
| Cancellation (`/policies/:id/cancel`)        | **Cancellation Transaction / Job**                                      | Guidewire's Cancellation job records a reason and effective date and terminates the PolicyPeriod. Mirrored here by `policy_cancellations` and the `Cancelled` status. |
| `policy_coverages` table / Coverage options   | **Coverage** (and underlying **Product Model** / line of business)       | Guidewire coverages are defined in a Product Model (PMDK) with patterns and rules. This project hardcodes three coverage options for the Personal Accident line. |
| `premiumService.js` rule-based formula          | **Rating Engine / Rate Books**                                           | Guidewire's rating engine uses rate tables, algorithms, and Gosu rules for actuarial-grade rating. This project uses one simple, transparent formula instead. |
| Dashboard KPI cards                              | **PolicyCenter Home Page / Activity queues**                              | Guidewire's landing page shows queued work and portfolio summaries; this dashboard shows portfolio counts and recent activity in a simplified form. |
| Policy Status: Draft / Active / Expired / Cancelled / Renewed | **PolicyPeriod Status** (Draft, Bound/In Force, Expired, Cancelled, Renewed) | Naming and lifecycle intentionally mirror Guidewire's status vocabulary. |
| Backend validation & business rules (Express middleware) | **Guidewire Business Rules (Gosu rule sets)**                          | Real PolicyCenter encodes business rules in Gosu (e.g. PCF validation rules, rule sets triggered on business events). This project implements equivalent checks in plain JavaScript (Express middleware and controller logic). |
| `claims` table / Claims module (`/claims`, `claimController.js`)  | **Guidewire ClaimCenter** — Claim, Exposure, Activity                | ClaimCenter is Guidewire's separate claims-management product (intake → adjudication → payment). This project's Claims module mirrors that lifecycle: `Submitted` → `UnderReview` → `Approved`/`Rejected` → `Paid`, scoped to a single Claim entity per incident rather than ClaimCenter's richer Claim/Exposure/Activity/Reserve model. |
| `mlService.js` risk & fraud models          | **Guidewire Predict** / **Guidewire Cyence** — predictive analytics layer | Guidewire Predict scores submissions and claims using ML models trained on the insurer's own historical data, surfaced back into PolicyCenter/ClaimCenter as a score an underwriter or adjuster sees alongside the record — exactly the pattern this project follows (score computed by a separate service, displayed inline, human makes the final call). This project's models are trained on synthetic data with scikit-learn rather than an insurer's real book of business. |
| AI Underwriting Risk panel on `/policies/new`   | **Guidewire Predict for Underwriting** (risk scoring at submission) | Real Predict-for-Underwriting products surface a risk score to the underwriter at point of quote; this project's live risk preview does the same, with the score also persisted on the bound policy. |
| AI Fraud Risk panel on `/claims/new` and claim adjudication | **Guidewire Predict for Claims / SIU (Special Investigation Unit) triage** | Real insurers use ML fraud scoring to triage claims into an SIU review queue. This project's auto-routing of High-fraud-score claims into `UnderReview` mirrors that triage step, with explainable red flags standing in for a real SIU referral rationale. |

## Why this approach was chosen
Guidewire PolicyCenter is an enterprise platform requiring a licensed
installation, Gosu programming knowledge, and infrastructure not accessible or
appropriate for a beginner academic project. Building a Guidewire-*inspired*
full-stack application in VS Code lets the project:
- Demonstrate understanding of the **PolicyCenter data model and workflow concepts**
- Be **fully runnable and demonstrable** on a personal laptop for a viva
- Use technologies (React, Node.js, MySQL) appropriate for a CSE (AI&ML) student's
  current skill level, without requiring Gosu or PCF development experience

## What this project explicitly does NOT claim
- It does not claim to run on, or be compatible with, actual Guidewire software (PolicyCenter, ClaimCenter, or Predict).
- It does not use Guidewire's Product Model, Rating Engine, Gosu, or PCF.
- It is not affiliated with or endorsed by Guidewire Software, Inc.
- The AI risk and fraud models are trained on **synthetic data generated for this
  project** (see `ml/train_models.py`), not on any real insurer's historical
  book of business — this is stated openly in `README.md` and `ml/MODEL_METRICS.md`
  rather than implied to be production-grade.
