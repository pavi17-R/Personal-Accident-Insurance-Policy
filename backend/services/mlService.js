// =====================================================================
// AI/ML INFERENCE SERVICE
// -----------------------------------------------------------------------
// Loads two logistic-regression models trained offline in ../ml/train_models.py
// (scikit-learn, on a synthetic-but-realistic dataset) and re-implements
// inference in plain JavaScript: standardize -> linear score -> sigmoid/softmax.
// This keeps the deployed app to a single Node process (no Python runtime,
// no second server) while the models themselves are genuinely trained and
// evaluated — see ../ml/MODEL_METRICS.md for accuracy/F1/confusion matrices
// and ../ml/train_models.py to reproduce them from scratch.
//
// Two models:
//   1. Underwriting Risk Model   -> risk tier (Low/Medium/High) at policy issuance
//   2. Claims Fraud Model        -> fraud probability at claim submission
//
// Both also return a short list of human-readable "why" reasons so the
// score is explainable to an underwriter/claims adjuster, not a black box.
// =====================================================================
const fs = require('fs');
const path = require('path');

const riskModel = JSON.parse(fs.readFileSync(path.join(__dirname, '../../ml/risk_model.json'), 'utf8'));
const fraudModel = JSON.parse(fs.readFileSync(path.join(__dirname, '../../ml/fraud_model.json'), 'utf8'));

function standardize(values, mean, scale) {
  return values.map((v, i) => (v - mean[i]) / scale[i]);
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

// ---------------------------------------------------------------------
// 1. UNDERWRITING RISK MODEL
// Features (must match ml/train_models.py feature_order exactly):
//   [age, occupation_risk(0/1/2), coverage_type(0/1/2), sum_insured_lakh,
//    prior_claims, tenure_years]
// ---------------------------------------------------------------------
const OCCUPATION_RISK_MAP = { Low: 0, Medium: 1, High: 2 };
const COVERAGE_TYPE_MAP = { Basic: 0, Standard: 1, Comprehensive: 2 };
const RISK_TIER_LOADING_PCT = { Low: 0, Medium: 15, High: 35 };

function assessRisk({ age, occupationRiskCategory, coverageType, sumInsured, priorClaims, tenureYears }) {
  const x = [
    age,
    OCCUPATION_RISK_MAP[occupationRiskCategory] ?? 0,
    COVERAGE_TYPE_MAP[coverageType] ?? 1,
    sumInsured / 100000,
    priorClaims,
    tenureYears
  ];
  const xs = standardize(x, riskModel.scaler_mean, riskModel.scaler_scale);

  // multinomial logistic regression: one logit per class
  const logits = riskModel.coef.map((classCoef, classIdx) => {
    const dot = classCoef.reduce((sum, c, i) => sum + c * xs[i], 0);
    return dot + riskModel.intercept[classIdx];
  });
  const probs = softmax(logits);
  const classIdx = probs.indexOf(Math.max(...probs));
  const tier = riskModel.classes[classIdx]; // 'Low' | 'Medium' | 'High'
  const highRiskProb = probs[riskModel.classes.indexOf('High')];
  const score = Math.round(highRiskProb * 10000) / 100; // 0-100 scale, driven by P(High)

  const reasons = [];
  if (OCCUPATION_RISK_MAP[occupationRiskCategory] === 2) reasons.push('Occupation classified as High hazard');
  if (OCCUPATION_RISK_MAP[occupationRiskCategory] === 1) reasons.push('Occupation classified as Medium hazard');
  if (coverageType === 'Comprehensive') reasons.push('Comprehensive coverage carries a wider benefit exposure');
  if (sumInsured >= 1000000) reasons.push('High sum insured (\u2265 \u20b910L)');
  if (priorClaims >= 2) reasons.push(`${priorClaims} prior claims on record`);
  if (age >= 55) reasons.push('Applicant age 55+');
  if (reasons.length === 0) reasons.push('No elevated risk factors identified');

  return {
    riskTier: tier,
    riskScore: score,
    probabilities: { Low: Math.round(probs[0] * 10000) / 100, Medium: Math.round(probs[1] * 10000) / 100, High: Math.round(probs[2] * 10000) / 100 },
    premiumLoadingPct: RISK_TIER_LOADING_PCT[tier],
    reasons,
    modelVersion: 'risk-logreg-v1'
  };
}

// ---------------------------------------------------------------------
// 2. CLAIMS FRAUD DETECTION MODEL
// Features (must match ml/train_models.py feature_order exactly):
//   [claim_to_sum_insured_ratio, days_since_policy_start, days_to_file,
//    prior_claims_12m, claim_type_risk(0/1/2), is_near_policy_end(0/1)]
// ---------------------------------------------------------------------
const CLAIM_TYPE_RISK_MAP = { 'Medical Expense Coverage': 0, 'Permanent Disability': 1, 'Accidental Death': 2 };
const FRAUD_LEVEL_THRESHOLDS = { medium: 30, high: 60 }; // fraud_score (0-100) cut points

function assessFraud({ claimAmount, sumInsured, daysSincePolicyStart, daysToFile, priorClaims12m, claimType, isNearPolicyEnd }) {
  const ratio = Math.min(claimAmount / sumInsured, 1.2);
  const x = [
    ratio,
    daysSincePolicyStart,
    daysToFile,
    priorClaims12m,
    CLAIM_TYPE_RISK_MAP[claimType] ?? 0,
    isNearPolicyEnd ? 1 : 0
  ];
  const xs = standardize(x, fraudModel.scaler_mean, fraudModel.scaler_scale);
  const logit = fraudModel.coef.reduce((sum, c, i) => sum + c * xs[i], 0) + fraudModel.intercept;
  const prob = sigmoid(logit);
  const score = Math.round(prob * 10000) / 100; // 0-100

  let level = 'Low';
  if (score >= FRAUD_LEVEL_THRESHOLDS.high) level = 'High';
  else if (score >= FRAUD_LEVEL_THRESHOLDS.medium) level = 'Medium';

  // explainable rule-based red flags backing the statistical score
  const flags = [];
  if (ratio >= 0.85) flags.push(`Claim amount is ${Math.round(ratio * 100)}% of the policy's sum insured`);
  if (daysSincePolicyStart < 30) flags.push('Incident occurred within 30 days of policy start');
  if (daysToFile > 60) flags.push(`Claim filed ${daysToFile} days after the incident (unusually delayed)`);
  if (priorClaims12m >= 2) flags.push(`${priorClaims12m} prior claims from this customer in the last 12 months`);
  if (isNearPolicyEnd) flags.push('Incident occurred within 30 days of policy expiry');
  if (claimType === 'Accidental Death') flags.push('Accidental Death claims receive additional scrutiny by policy');

  return {
    fraudScore: score,
    fraudLevel: level,
    fraudProbability: Math.round(prob * 10000) / 10000,
    flags,
    modelVersion: 'fraud-logreg-v1'
  };
}

module.exports = { assessRisk, assessFraud, RISK_TIER_LOADING_PCT };
