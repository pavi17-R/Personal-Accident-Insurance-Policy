# Project Report Content, PPT Structure & Viva Preparation

## Part 1 — Project Report Content (chapter-wise outline)

### 1. Introduction
- Insurance companies need efficient systems not just to administer policies
  (issuance, renewal, cancellation) but also to underwrite risk intelligently
  and process claims — the two areas where AI/ML delivers the most real-world
  value in insurance today.
- Guidewire is a leading commercial insurance suite: **PolicyCenter** for
  policy administration, **ClaimCenter** for claims, and **Predict/Cyence**
  for ML-driven risk and fraud analytics layered on top of both — but it
  requires enterprise licensing and Gosu development skills.
- This project builds an **AI-augmented, Guidewire-inspired** Personal
  Accident Insurance platform using an accessible, open web stack (React,
  Node.js, MySQL, scikit-learn), suitable for a beginner developer to build,
  demonstrate, and explain — and deliberately covers all three of those
  Guidewire product areas conceptually, not just PolicyCenter.

### 2. Objectives
1. Digitize the core Personal Accident policy administration workflow: customer
   onboarding, policy issuance, premium calculation, renewal, and cancellation.
2. Design a relational database that mirrors key Guidewire concepts
   (Account/Contact, PolicyPeriod, Coverage, Renewal/Cancellation transactions,
   and — new — Claim).
3. Build a professional, responsive enterprise-style UI.
4. Implement an **AI underwriting risk model** that scores every applicant at
   issuance and drives a dynamic premium loading, replacing a flat rule alone.
5. Build a **Claims module** (submission → AI fraud scoring → adjudication →
   payout) — the ClaimCenter half of the suite that a policy-only project
   would skip entirely.
6. Implement an **AI fraud detection model** that scores every claim at
   submission with explainable red flags, not a black-box number.
7. Expose all functionality, including both AI models, through documented
   REST APIs, and make the models themselves reproducible (`ml/train_models.py`).

### 3. Literature Survey / Existing System
- Brief overview of the Guidewire InsuranceSuite: **PolicyCenter** (Policy
  Administration System — submissions, underwriting, rating, issuance,
  endorsements, renewals, cancellations), **ClaimCenter** (claims intake,
  adjudication, payment), and **Predict/Cyence** (ML risk & fraud scoring
  surfaced into both).
- Most student "Guidewire-inspired" projects only replicate PolicyCenter's
  CRUD surface — issue/renew/cancel a policy — with no claims module and no
  actual machine learning, despite calling themselves AI-based.
- Limitations for a student project: licensing, infrastructure, and Gosu/PCF
  learning curve make direct development on the real platform impractical.
- Gap this project fills: a locally runnable, conceptually aligned demonstration
  that covers policy administration **and** claims **and** genuine trained
  ML models, built with mainstream, beginner-friendly web technologies.

### 4. System Analysis
- **Functional requirements:** customer CRUD, policy CRUD, premium calculation,
  renewal, cancellation, dashboard reporting, search/filter.
- **Non-functional requirements:** usability (professional UI), maintainability
  (clean MVC-style backend structure), responsiveness, data integrity
  (foreign keys, validation).
- **Feasibility:** technical (all tools free/open-source), economic (no cost),
  operational (runs on a single laptop).

### 5. System Design
- **Architecture diagram:** React SPA (frontend) ⇄ REST API (Express backend)
  ⇄ MySQL (database), with an **AI inference layer** (`mlService.js`) sitting
  inside the backend and consulted by the Policy and Claims controllers before
  a record is written. The two trained models are produced offline by a
  separate, one-time **training pipeline** (`ml/train_models.py`, scikit-learn)
  — this offline-train / online-serve split is deliberately called out because
  it's exactly how Guidewire Predict is architected relative to
  PolicyCenter/ClaimCenter (a model trained separately, consumed via an API by
  the transactional system).
- **ER Diagram:** customers → policies → policy_coverages; policies → claims
  [NEW]; policies → policy_renewals; policies → policy_cancellations;
  policies → activity_log (see `README.md` §7).
- **Data Flow Diagram (Level 0/1):** User → UI → API Controller → Service
  (risk/fraud scoring via `mlService.js`, premium calc, validation) →
  Database → Response.
- **Module design:** Dashboard (incl. AI fraud alerts), Customer Management,
  Policy Creation (with live AI risk assessment), Premium Calculation, Policy
  Management, Renewal, Cancellation, Policy Details, **Claims Module (new)**
  — filing, AI fraud scoring, adjudication, payout.

### 6. Implementation
- Backend implemented with Express controllers/routes/services/middleware
  separation (MVC-inspired structure); the Claims module follows the exact
  same layering as the existing Policy module (`claimController.js` →
  `claimRoutes.js`, mirroring `policyController.js` → `policyRoutes.js`).
- Frontend implemented with React functional components, React Router for
  navigation, and a central Axios service layer; new pages (`Claims.jsx`,
  `ClaimForm.jsx`, `ClaimDetails.jsx`) and a reusable `RiskBadge` component
  follow the same conventions as the existing Policy pages.
- **AI models trained offline** in `ml/train_models.py`: a synthetic dataset
  is generated from realistic weighted rules plus Gaussian noise, split
  80/20 train/test, and two scikit-learn `LogisticRegression` models are
  fit — one multinomial (risk tier) and one binary, class-balanced (fraud).
  Trained coefficients, the scaler's mean/scale, and evaluation metrics are
  exported to JSON/Markdown.
- **AI inference at runtime** re-implemented in plain JavaScript
  (`backend/services/mlService.js`): standardize the feature vector using the
  exported scaler stats, take the dot product with the exported coefficients,
  and apply softmax (risk, 3-class) or sigmoid (fraud, binary) — mathematically
  identical to what scikit-learn's `.predict_proba()` does internally, just
  ported to JS so the deployed app needs only Node.js, not a Python runtime.
- **Feature assembly services** (`riskAssessmentService.js`,
  `fraudAssessmentService.js`) query live data — a customer's occupation
  hazard class and claim history for risk; a policy's dates/sum-insured and
  the customer's recent claims for fraud — and hand a clean feature vector to
  `mlService.js`. This separation (data assembly vs. model math) keeps
  `mlService.js` a pure, unit-testable function.
- Premium calculation extended (not replaced): `premiumService.js` still uses
  the simple base-rate-per-₹1000 formula, now with an optional risk-driven
  loading percentage applied on top — the base formula stays as transparent
  and viva-explainable as before.
- Business rules (e.g., "cannot cancel an already-cancelled policy", "cannot
  claim more than the coverage limit", "claim must fall within the policy
  period") enforced server-side in controllers, independent of the UI.

### 7. Testing
- Manual functional test cases across all modules including the Claims module
  and both AI models — see `TEST_CASES.md` (sections H and I).
- API-level tests using curl / Postman for direct endpoint verification,
  including the two standalone assessment endpoints (`/policies/assess-risk`,
  `/claims/assess-fraud`) that let the models be tested independent of
  creating any record.
- Model-level validation: train/test split (80/20), accuracy, macro/binary F1,
  and confusion matrices for both models, reproducible via
  `ml/train_models.py` and documented in `ml/MODEL_METRICS.md`.

### 8. Results and Discussion
- Screenshots of Dashboard (incl. AI Fraud Alerts widget), Customer
  list/details (occupation hazard class), Policy creation with live AI risk
  assessment + premium preview, Policy details with risk tier, Claims list
  filtered by fraud level, Claim filing with live AI fraud assessment, and
  Claim adjudication with explainable red flags.
- Worked example: a High-hazard-occupation applicant with Comprehensive
  coverage and ₹15L sum insured was scored High risk (score ≈ 99.9/100) and
  received a +35% premium loading, moving the bound premium from a base
  ₹7,500 to ₹10,125 — demonstrating the model's output flowing all the way
  through to a persisted, bound premium rather than staying a cosmetic UI badge.
- Discussion of how the system mirrors Guidewire's PolicyCenter + ClaimCenter
  + Predict workflow vocabulary across all three product areas, while
  remaining simple enough to build, run, and explain end-to-end.

### 9. Conclusion and Future Scope
- **Conclusion:** Successfully implemented an end-to-end Personal Accident
  Insurance platform spanning policy administration, an AI underwriting risk
  engine, a full claims module, and an AI fraud detection engine — going
  beyond a policy-only CRUD project into the areas (claims, ML risk/fraud
  scoring) that mirror where real insurance platforms actually add value.
- **Future scope:** Add authentication/roles (agent vs. underwriter vs.
  adjuster), endorsements (mid-term policy changes), PDF policy/claim document
  generation, email/SMS notifications, a churn/non-renewal prediction model
  for proactive retention, richer NLP-based analysis of claim description text,
  a model-serving layer analogous to Guidewire Predict if this were
  productionized, and retraining the models on real historical data if it
  became available (with fairness/bias auditing before deployment).

### 10. References
- Guidewire PolicyCenter public product documentation (conceptual reference only)
- React, Express.js, MySQL official documentation

---

## Part 2 — PPT Structure (suggested slide-by-slide outline, ~14–16 slides)

1. **Title Slide** — Project title, your name, register number, guide name, college
2. **Agenda**
3. **Introduction & Problem Statement**
4. **Objectives**
5. **Existing System (Guidewire InsuranceSuite overview: PolicyCenter + ClaimCenter + Predict) & Limitations for student use**
6. **Proposed System Overview** — AI-augmented, Guidewire-inspired, VS Code-built architecture
7. **Technology Stack** — React, Node.js, Express, MySQL, scikit-learn
8. **System Architecture Diagram** (incl. the AI inference layer + offline training pipeline)
9. **Database ER Diagram** (incl. the new `claims` table)
10. **Module Overview** — Dashboard / Customer Mgmt / Policy Creation / Premium Calc / Renewal / Cancellation / **Claims (new)**
11. **AI Underwriting Risk Model** — features, how it drives premium loading, worked example
12. **AI Claims Fraud Detection Model** — features, explainable red flags, recall-vs-precision tradeoff
13. **UI Screenshots** — Dashboard (AI alerts), Policy Creation (AI risk panel), Claim Filing (AI fraud panel), Claim Adjudication (2-3 slides)
14. **Guidewire Concept Mapping Table** (from `GUIDEWIRE_ALIGNMENT.md`) — now spanning PolicyCenter, ClaimCenter, and Predict
15. **Model Metrics** — accuracy/F1/confusion matrices from `ml/MODEL_METRICS.md`
16. **Testing Summary** — key test cases and outcomes
17. **Conclusion & Future Scope**
18. **Thank You / Questions**

---

## Part 3 — Viva Questions & Answers

**Q1. Why did you build this in VS Code instead of actual Guidewire Studio?**
A: Guidewire PolicyCenter requires enterprise licensing, server infrastructure,
and Gosu programming knowledge that go beyond a beginner CSE (AI&ML) student's
current scope and available access. Building a Guidewire-inspired application
with React, Node.js, and MySQL lets me demonstrate the same core policy
administration concepts using tools I can fully build, run, and explain myself.

**Q2. What does "Guidewire-inspired" mean here — is this real PolicyCenter?**
A: No. It's an independent application that mirrors PolicyCenter's terminology
and workflow (Account/Contact → Customer, PolicyPeriod → Policy,
Renewal/Cancellation Transactions) but is built entirely with my own stack. It
doesn't use Guidewire's runtime, Gosu, PCF, or Product Model.

**Q3. Explain your premium calculation formula.**
A: `premium = (sum_insured / 1000) * base_rate`, where base_rate is 2.5 for
Basic, 3.5 for Standard, and 5.0 for Comprehensive coverage, with a ₹500
minimum premium floor. It's a simple, transparent rule — not a real actuarial
model — chosen so it's easy to explain and verify by hand.

**Q4. How does policy renewal work in your system?**
A: When a user renews an Active or Expired policy, the backend calculates a new
premium for the new period, creates a brand-new row in the `policies` table
linked to the original via `parent_policy_id`, marks the old policy's status as
`Renewed`, and logs the transaction in `policy_renewals` for audit/history.

**Q5. What happens when a policy is cancelled?**
A: The backend records the cancellation reason and date in
`policy_cancellations` and updates the policy's status to `Cancelled`. Only
policies in `Active` or `Draft` status can be cancelled — enforced by backend
validation, not just the UI.

**Q6. Why use a separate `policy_coverages` table instead of storing coverage in the `policies` table directly?**
A: A single policy can have multiple coverage options (Accidental Death,
Permanent Disability, Medical Expense Coverage) selected simultaneously. A
separate table with a foreign key to `policies` models this one-to-many
relationship correctly (3rd normal form) and mirrors how Guidewire models
Coverages under a Policy Line.

**Q7. How do frontend and backend communicate?**
A: The React frontend calls REST endpoints (e.g., `GET /api/policies`) via
Axios. In development, Vite's dev server proxies `/api/*` requests to the
Express backend on port 5000, avoiding CORS issues without needing extra
configuration.

**Q8. What validations are implemented and where?**
A: Both client-side (HTML5 required fields, dropdown constraints) and
server-side (in Express middleware/controllers): required field checks, email
format, date validity, coverage type whitelist, and business rules like
"cannot delete a customer with an active policy" or "cannot renew a cancelled
policy." Server-side validation is the authoritative layer.

**Q9. Why MySQL instead of MongoDB or another database?**
A: The domain has clear relational structure — a customer has many policies, a
policy has many coverages, and renewals/cancellations reference specific
policies via foreign keys. MySQL's relational model with foreign key
constraints enforces this integrity naturally, which fits an insurance
administration domain well.

**Q10. How would you extend this project further for real-world use?**
A: Add authentication and role-based access (agent vs. underwriter vs.
adjuster), an endorsement module for mid-term policy changes, PDF policy/claim
document generation, email/SMS notifications for renewal reminders and claim
status updates, a churn/non-renewal prediction model for proactive retention,
and — if real historical data became available — retraining the risk and
fraud models on it with a proper fairness/bias audit before relying on them
for actual underwriting decisions.

**Q11. What is a PolicyPeriod in Guidewire, and how did you represent it?**
A: In Guidewire, a Policy can span multiple time-bound PolicyPeriods (e.g. one
per year, or one per mid-term change). I represented each period as one row in
my `policies` table; renewals create a new row rather than overwriting the old
one, preserving history — similar in spirit to how Guidewire keeps a job/period
history per policy.

**Q12. What was the most challenging part of this project?**
A: Answers will vary per student — common honest answers include designing the
database relationships correctly (especially the self-referencing renewal
chain and the new claims-to-policy relationship), keeping the two AI models'
feature engineering consistent between Python (training) and JavaScript
(inference) so the numbers match exactly, and structuring the Express backend
cleanly (routes/controllers/services separation) rather than writing all logic
in one file.

**Q13. Where did you get the data to train your AI models?**
A: There's no real insurer dataset available for a student project, so both
models are trained on a **synthetic dataset** generated in `ml/train_models.py`
— I define realistic weighted rules (e.g. hazardous occupation, high sum
insured, and prior claims all push risk up) plus Gaussian noise, then bucket
the results into labels and train a real scikit-learn model on that data. I
say this openly rather than implying the model saw real claims — the point of
this project is demonstrating the ML pipeline and its integration into the
app, not claiming production-grade accuracy.

**Q14. Why logistic regression instead of a more powerful model like XGBoost or a neural network?**
A: Logistic regression is a strong baseline for this kind of binary/multi-class
tabular scoring problem, it's fast to train, and — most importantly for this
project — it's fully explainable: the score is a weighted sum of interpretable
features, which is exactly what lets me show plain-English "reasons" and "red
flags" to the underwriter/adjuster instead of a black-box number. It's also
trivial to port the trained model's inference (a dot product + sigmoid/softmax)
into plain JavaScript, which is what keeps the deployed app to a single Node
process.

**Q15. Why does the fraud model's accuracy (~68%) look lower than the risk model's (~82%)?**
A: I tuned the fraud model with `class_weight="balanced"` to prioritize
**recall over precision** — in fraud detection, missing a real fraudulent
claim (a false negative) is far costlier than sending an honest claim for one
extra manual review (a false positive). That tradeoff pulls raw accuracy down
because the model flags more claims overall, but it catches a much higher
share of actual fraud than a model tuned purely for accuracy would. I'd rather
defend a recall-oriented model than hide a lower accuracy number.

**Q16. Walk me through what happens end-to-end when a claim is filed.**
A: The frontend calls `POST /api/claims`. The controller first validates the
claim against business rules (policy must be Active/Expired, incident date
must fall inside the policy period, claim type must be a coverage the policy
actually has, and the amount can't exceed that coverage's limit). It then
calls `fraudAssessmentService.buildAndAssessFraud`, which pulls the policy's
dates/sum-insured and the customer's claim history from the database, builds
the six-feature vector, and passes it to `mlService.assessFraud`, which
standardizes the features, runs them through the trained logistic regression
coefficients, and returns a fraud score, level, and explainable flags. That
result is stored with the claim; if the fraud level is High, the claim is
created directly as `UnderReview` instead of `Submitted`, forcing mandatory
manual adjudication before it can be approved or paid.

**Q17. Why did you add a Claims module at all — wasn't the brief about policy administration?**
A: Personal Accident insurance exists specifically so a policyholder can claim
against it after an accident — a policy administration system with no claims
module only tells half the story, and it's also the single biggest reason
submissions built purely around PolicyCenter concepts look identical to each
other. Adding Claims (mapping to Guidewire ClaimCenter) let me build a genuine
second workflow with its own AI model, rather than reskinning the same
CRUD-and-premium-formula pattern a second time.

**Q18. Is the risk model using anything discriminatory, like gender or religion?**
A: No — deliberately. The risk model's features are age, occupation hazard
class, coverage type, sum insured, prior claims, and tenure; it does not use
gender, religion, caste, or any other protected attribute, even though those
columns exist in the `customers` table for contact/identification purposes.
This was a conscious fairness decision I can defend if asked, not an
oversight.

**Q19. How would you actually deploy this if it needed to scale — would the JS inference approach still work?**
A: For this project's scale and for genuinely lightweight linear models, yes —
the JS inference is exact, not an approximation. If the models grew more
complex (e.g. gradient-boosted trees or a neural network) or needed to be
retrained frequently on live data, I'd split them into a dedicated model-
serving service (e.g. a small FastAPI app, or a managed endpoint) that the
Node backend calls over REST — which is architecturally exactly what Guidewire
Predict is: a separate scoring service consumed by PolicyCenter/ClaimCenter.
I chose the simpler single-process approach here because it's more reliable to
demo and doesn't need two runtimes for a student project, while still keeping
the model genuinely trained and evaluated.
