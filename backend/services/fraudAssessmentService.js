// =====================================================================
// Assembles the feature vector for the AI fraud detection model from live
// database state (the policy being claimed against + the customer's recent
// claim history), then delegates scoring to mlService.assessFraud. Shared by:
//   - POST /api/claims/assess-fraud     (live preview while filling the form)
//   - POST /api/claims                   (persisted at submission time)
// =====================================================================
const pool = require('../config/db');
const { assessFraud } = require('./mlService');

async function buildAndAssessFraud({ policyId, claimType, claimAmount, incidentDate, filedDate }) {
  const [policyRows] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [policyId]);
  if (policyRows.length === 0) {
    const err = new Error('Policy not found');
    err.statusCode = 404;
    throw err;
  }
  const policy = policyRows[0];

  const daysSincePolicyStart = Math.floor((new Date(incidentDate) - new Date(policy.policy_start_date)) / (24 * 60 * 60 * 1000));
  const daysToFile = Math.floor((new Date(filedDate) - new Date(incidentDate)) / (24 * 60 * 60 * 1000));
  const daysToPolicyEnd = Math.floor((new Date(policy.policy_end_date) - new Date(incidentDate)) / (24 * 60 * 60 * 1000));
  const isNearPolicyEnd = daysToPolicyEnd >= 0 && daysToPolicyEnd <= 30;

  const oneYearBefore = new Date(incidentDate);
  oneYearBefore.setFullYear(oneYearBefore.getFullYear() - 1);
  const [[{ priorClaims12m }]] = await pool.query(
    `SELECT COUNT(*) AS priorClaims12m FROM claims cl
     JOIN policies p ON cl.policy_id = p.policy_id
     WHERE p.customer_id = ? AND cl.filed_date BETWEEN ? AND ?`,
    [policy.customer_id, oneYearBefore.toISOString().slice(0, 10), filedDate]
  );

  const assessment = assessFraud({
    claimAmount,
    sumInsured: Number(policy.sum_insured),
    daysSincePolicyStart: Math.max(0, daysSincePolicyStart),
    daysToFile: Math.max(0, daysToFile),
    priorClaims12m,
    claimType,
    isNearPolicyEnd
  });

  return {
    ...assessment,
    policy,
    inputs: { daysSincePolicyStart, daysToFile, priorClaims12m, isNearPolicyEnd, sumInsured: Number(policy.sum_insured) }
  };
}

module.exports = { buildAndAssessFraud };
