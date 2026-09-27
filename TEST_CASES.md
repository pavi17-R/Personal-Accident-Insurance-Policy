# Test Cases — Personal Accident Insurance Policy Administration System

Manual functional test checklist. Perform these against a locally running
instance (`backend` on :5000, `frontend` on :5173) with the sample data loaded
from `database/schema.sql`.

## A. Customer Management

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| A1 | Add a new customer | Go to `/customers/new`, fill all fields, submit | Customer is created, auto-assigned a `CUST-000X` code, redirected to customer details page |
| A2 | Add customer with missing field | Leave "Email" blank, submit | Browser/HTML5 validation blocks submit; if bypassed, backend returns 400 "Missing required field(s): email" |
| A3 | Add customer with invalid email | Enter `abc@`, submit | Backend returns 400 "Invalid email format" |
| A4 | Add customer with duplicate email | Use an email that already exists | Backend returns 409 "Duplicate entry..." |
| A5 | Search customers | Type a partial name in the search box on `/customers` | List filters to matching customers within ~350ms |
| A6 | View customer details | Click a customer name | Customer details page shows all fields + list of their policies |
| A7 | Edit customer | Open `/customers/:id/edit`, change phone number, save | Details page reflects updated phone number |
| A8 | Delete customer with no policies | Delete a customer who has never had a policy | Customer removed from list |
| A9 | Delete customer with an active policy | Attempt to delete a customer holding an Active policy | Backend returns 409 "Cannot delete customer with active policies..." |

## B. Policy Creation & Premium Calculation

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| B1 | Create policy — Basic coverage | `/policies/new`, select a customer, Coverage=Basic, Sum Insured=₹2,00,000 | Premium preview shows ₹500 (200000/1000 × 2.5 = 500) |
| B2 | Create policy — Standard coverage | Coverage=Standard, Sum Insured=₹5,00,000 | Premium preview shows ₹1,750 |
| B3 | Create policy — Comprehensive coverage | Coverage=Comprehensive, Sum Insured=₹10,00,000 | Premium preview shows ₹5,000 |
| B4 | Minimum premium floor | Coverage=Basic, Sum Insured=₹50,000 | Calculated premium (125) is below ₹500 floor → preview shows ₹500 |
| B5 | End date auto-fill | Change Start Date | End Date auto-updates to 1 year minus 1 day later |
| B6 | Coverage option selection required | Uncheck all coverage checkboxes, submit | Frontend blocks submit with "Please select at least one coverage option" |
| B7 | Successful policy creation | Fill valid form, submit | New policy created with auto policy number `PA-<year>-000X`, redirected to policy details |
| B8 | End date before start date | Manually set End Date earlier than Start Date, submit | Backend returns 400 "policy_end_date must be after policy_start_date" |

## C. Policy Management (List / Search / Filter)

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| C1 | View all policies | Go to `/policies` | Table lists all policies with number, customer, coverage, premium, dates, status |
| C2 | Search by policy number | Type part of a policy number in search | List filters to matching policy |
| C3 | Search by customer name | Type a customer's name in search | List filters to that customer's policies |
| C4 | Filter by status | Select "Active" from status dropdown | Only Active policies shown |
| C5 | View policy details | Click a policy number | Full details page loads: customer info, policy info, coverages, renewal history |

## D. Policy Renewal

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| D1 | Renew an Active policy | Open an Active policy, click "Renew Policy" | Renewal form pre-fills next period dates and current coverage/sum insured |
| D2 | Confirm renewal | Adjust dates if needed, submit | New policy created (status Active), old policy status changes to `Renewed`, `policy_renewals` row created, redirected to new policy |
| D3 | Attempt to renew a Cancelled policy | Try to access renew flow for a Cancelled policy | "Renew Policy" button is not shown; direct API call returns 400 |
| D4 | Renewal history visible | Open the original (now Renewed) policy | "Renewal History" panel shows old → new policy number and premium change |

## E. Policy Cancellation

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| E1 | Cancel an Active policy | Open Active policy, click "Cancel Policy", select reason + date, confirm | Policy status becomes `Cancelled`, cancellation info visible on details page |
| E2 | Cancel without a reason | Leave reason dropdown unselected, submit | Frontend validation blocks submit |
| E3 | Attempt to cancel an already-Cancelled policy | Try to access cancel flow for a Cancelled policy | "Cancel Policy" button not shown; direct API call returns 400 |

## F. Dashboard

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| F1 | KPI counts accuracy | Compare dashboard counts to `/policies` filtered by status | Total Customers, Active, Expired, Pending Renewal counts match |
| F2 | Recent policies widget | Create a new policy | New policy appears at top of "Recent Policies" on dashboard |
| F3 | Recent activities widget | Perform a create/renew/cancel action | New entry appears at top of "Recent Activities" with timestamp |

## G. API-Level Tests (via curl / Postman)

| # | Test Case | Request | Expected Result |
|---|------------|---------|-------------------|
| G1 | Health check | `GET /api/health` | `{"success":true, "message":"PA Insurance API is running"}` |
| G2 | Premium calculation endpoint | `POST /api/policies/calculate-premium {"coverage_type":"Standard","sum_insured":500000}` | `{"success":true,"data":{"premium":1750,...}}` |
| G3 | Invalid coverage type | `POST /api/policies/calculate-premium {"coverage_type":"Gold","sum_insured":500000}` | 400 error, "Invalid coverage type: Gold" |
| G4 | 404 on unknown route | `GET /api/nonexistent` | 404, `{"success":false,"message":"Route not found"}` |

## H. Claims Module (AI Fraud Detection)

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| H1 | File a claim against an Active policy | `/claims/new`, select an Active policy, valid claim type/amount/dates, submit | Claim created with an auto-generated `CLM-<YEAR>-####` number; AI fraud panel showed a score before submit |
| H2 | Claim amount exceeds coverage limit | Enter a claim amount higher than the policy's coverage limit for that claim type | Backend returns 400, "Claim amount exceeds the coverage limit..." |
| H3 | Claim type not covered by the policy | Select a claim type the policy did not purchase (e.g. Medical Expense on a policy with only Accidental Death coverage) | Backend returns 400, "This policy does not include '...' coverage" |
| H4 | Incident date outside policy period | Enter an incident date before `policy_start_date` or after `policy_end_date` | Backend returns 400, "incident_date must fall within the policy period" |
| H5 | Claim against a Draft/Cancelled policy | Attempt to file a claim on a policy that is not Active/Expired | "File a Claim" button not shown on that policy; direct API call returns 400 |
| H6 | High-fraud-score claim auto-routes to Under Review | File a claim with claim amount ≈ sum insured, incident soon after policy start, and delayed filing | AI fraud panel shows High risk with red flags; claim is created with `claim_status = "UnderReview"` (not `Submitted`) |
| H7 | Low-fraud-score claim stays Submitted | File a claim well within limits, no red flags | Claim created with `claim_status = "Submitted"` |
| H8 | Approve a claim | Open an `UnderReview` claim, add notes, click "Approve Claim" | Status becomes `Approved`, `decision_notes` and `decided_at` populated |
| H9 | Reject a claim | Open a `Submitted`/`UnderReview` claim, click "Reject Claim", confirm | Status becomes `Rejected` |
| H10 | Mark an Approved claim Paid | Open an `Approved` claim, click "Mark as Paid" | Status becomes `Paid` |
| H11 | Cannot mark a non-Approved claim Paid | Attempt `POST /claims/:id/mark-paid` on a `Submitted` claim | Backend returns 400, "Only Approved claims can be marked Paid..." |
| H12 | Filter claims by fraud level | On `/claims`, filter by "High" fraud level | List shows only claims with `fraud_level = 'High'` |
| H13 | Fraud flags are explainable | Open a High-fraud claim's details page | "AI Fraud Risk Assessment" panel lists specific red flags (e.g. "Claim amount is 96% of sum insured"), not just a bare number |

## I. AI Models (Risk & Fraud)

| # | Test Case | Steps | Expected Result |
|---|------------|-------|-------------------|
| I1 | Risk model live preview | On `/policies/new`, select a High-hazard-occupation customer, Comprehensive coverage, high sum insured | AI panel shows "High Risk", score near 100, and reasons listing occupation/coverage/sum insured |
| I2 | Risk model persists on issuance | Submit the policy from I1 | Policy details page shows the same `risk_tier`/`risk_score` that the preview showed, and the bound premium includes the +35% High-risk loading |
| I3 | Low-risk applicant gets no loading | Create a policy for a Low-hazard-occupation customer with Basic coverage and low sum insured | AI panel shows "Low Risk", 0% loading, and the bound premium equals the base premium exactly |
| I4 | Risk re-assessed on renewal | Renew a policy for a customer who has since filed claims | New policy period's risk tier reflects the updated claim history (may differ from the original policy's tier) |
| I5 | assess-risk endpoint standalone | `POST /api/policies/assess-risk {"customer_id":1,"coverage_type":"Basic","sum_insured":200000,"policy_start_date":"2026-01-01"}` | Returns `riskTier`, `riskScore`, `premiumLoadingPct`, and a non-empty `reasons` array, without creating any record |
| I6 | assess-fraud endpoint standalone | `POST /api/claims/assess-fraud {"policy_id":1,"claim_type":"Accidental Death","claim_amount":480000,"incident_date":"2026-01-05"}` | Returns `fraudScore`, `fraudLevel`, and `flags`, without creating any record |
| I7 | Reproduce model training | `cd ml && python3 train_models.py` | Regenerates `risk_model.json`, `fraud_model.json`, and `MODEL_METRICS.md` with the same accuracy figures each run (seeded random state) |

