// =====================================================================
// Assembles the feature vector for the AI underwriting risk model from
// live database state (customer + their policy/claim history), then
// delegates the actual scoring to mlService.assessRisk. Shared by:
//   - POST /api/policies/assess-risk   (live preview while filling the form)
//   - POST /api/policies                (persisted at issuance time)
// =====================================================================
const pool = require('../config/db');
const { assessRisk } = require('./mlService');

function ageOnDate(dateOfBirth, asOfDate) {
  const dob = new Date(dateOfBirth);
  const asOf = new Date(asOfDate);
  let age = asOf.getFullYear() - dob.getFullYear();
  const m = asOf.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < dob.getDate())) age--;
  return age;
}

async function buildAndAssessRisk({ customerId, coverageType, sumInsured, asOfDate }) {
  const [customerRows] = await pool.query(`SELECT * FROM customers WHERE customer_id = ?`, [customerId]);
  if (customerRows.length === 0) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }
  const customer = customerRows[0];

  const [earliestPolicyRows] = await pool.query(
    `SELECT MIN(policy_start_date) AS earliest FROM policies WHERE customer_id = ?`,
    [customerId]
  );
  const earliest = earliestPolicyRows[0].earliest;
  let tenureYears = 0;
  if (earliest) {
    const diffMs = new Date(asOfDate) - new Date(earliest);
    tenureYears = Math.max(0, Math.floor(diffMs / (365 * 24 * 60 * 60 * 1000)));
  }

  const [[{ priorClaims }]] = await pool.query(
    `SELECT COUNT(*) AS priorClaims FROM claims cl
     JOIN policies p ON cl.policy_id = p.policy_id
     WHERE p.customer_id = ?`,
    [customerId]
  );

  const age = ageOnDate(customer.date_of_birth, asOfDate);

  const assessment = assessRisk({
    age,
    occupationRiskCategory: customer.occupation_risk_category,
    coverageType,
    sumInsured,
    priorClaims,
    tenureYears
  });

  return { ...assessment, inputs: { age, occupationRiskCategory: customer.occupation_risk_category, coverageType, sumInsured, priorClaims, tenureYears } };
}

module.exports = { buildAndAssessRisk, ageOnDate };
