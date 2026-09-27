// =====================================================================
// Claims module — conceptually similar to Guidewire ClaimCenter.
// Every claim is scored by the AI fraud detection model at submission
// time (see services/mlService.js + services/fraudAssessmentService.js);
// the score and its explainable red flags are stored alongside the claim
// so an adjuster can see exactly why it was flagged before deciding.
// =====================================================================
const pool = require('../config/db');
const { requireFields, isValidDate } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const { generateClaimNumber } = require('../services/policyNumberService');
const { logActivity } = require('../services/activityService');
const { buildAndAssessFraud } = require('../services/fraudAssessmentService');

const CLAIM_TYPES = ['Accidental Death', 'Permanent Disability', 'Medical Expense Coverage'];

// GET /api/claims?search=&status=&fraud_level=&policy_id=
exports.getAllClaims = async (req, res, next) => {
  try {
    const { search, status, fraud_level, policy_id } = req.query;
    let sql = `
      SELECT cl.*, p.policy_number, p.coverage_type, p.sum_insured, c.full_name, c.customer_code
      FROM claims cl
      JOIN policies p ON cl.policy_id = p.policy_id
      JOIN customers c ON p.customer_id = c.customer_id
      WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (cl.claim_number LIKE ? OR p.policy_number LIKE ? OR c.full_name LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status) { sql += ` AND cl.claim_status = ?`; params.push(status); }
    if (fraud_level) { sql += ` AND cl.fraud_level = ?`; params.push(fraud_level); }
    if (policy_id) { sql += ` AND cl.policy_id = ?`; params.push(policy_id); }
    sql += ` ORDER BY cl.created_at DESC`;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/claims/:id
exports.getClaimById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT cl.*, p.policy_number, p.coverage_type, p.sum_insured, p.policy_status, p.policy_start_date, p.policy_end_date,
              c.customer_id, c.full_name, c.customer_code, c.email, c.phone
       FROM claims cl
       JOIN policies p ON cl.policy_id = p.policy_id
       JOIN customers c ON p.customer_id = c.customer_id
       WHERE cl.claim_id = ?`,
      [id]
    );
    if (rows.length === 0) throw new AppError('Claim not found', 404);

    const claim = rows[0];
    claim.fraud_flags = typeof claim.fraud_flags === 'string' ? JSON.parse(claim.fraud_flags) : (claim.fraud_flags || []);

    res.json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
};

// POST /api/claims/assess-fraud
// Live AI fraud preview while filling out the claim form — does not persist anything.
// body: { policy_id, claim_type, claim_amount, incident_date, filed_date }
exports.assessFraudController = async (req, res, next) => {
  try {
    const { policy_id, claim_type, claim_amount, incident_date, filed_date } = req.body;
    requireFields(req.body, ['policy_id', 'claim_type', 'claim_amount', 'incident_date']);
    const assessment = await buildAndAssessFraud({
      policyId: policy_id,
      claimType: claim_type,
      claimAmount: Number(claim_amount),
      incidentDate: incident_date,
      filedDate: filed_date || new Date().toISOString().slice(0, 10)
    });
    res.json({ success: true, data: { fraudScore: assessment.fraudScore, fraudLevel: assessment.fraudLevel, flags: assessment.flags, modelVersion: assessment.modelVersion } });
  } catch (err) {
    next(err);
  }
};

// POST /api/claims
// body: { policy_id, claim_type, incident_date, filed_date, claim_amount, description }
exports.createClaim = async (req, res, next) => {
  try {
    const { policy_id, claim_type, incident_date, claim_amount, description } = req.body;
    const filed_date = req.body.filed_date || new Date().toISOString().slice(0, 10);
    requireFields(req.body, ['policy_id', 'claim_type', 'incident_date', 'claim_amount', 'description']);

    if (!CLAIM_TYPES.includes(claim_type)) throw new AppError('Invalid claim_type', 400);
    if (!isValidDate(incident_date) || !isValidDate(filed_date)) throw new AppError('Invalid date(s)', 400);
    if (new Date(incident_date) > new Date(filed_date)) throw new AppError('incident_date cannot be after filed_date', 400);
    if (Number(claim_amount) <= 0) throw new AppError('claim_amount must be positive', 400);

    const [policyRows] = await pool.query(
      `SELECT p.*, c.full_name FROM policies p JOIN customers c ON p.customer_id = c.customer_id WHERE p.policy_id = ?`,
      [policy_id]
    );
    if (policyRows.length === 0) throw new AppError('Policy not found', 404);
    const policy = policyRows[0];

    if (!['Active', 'Expired'].includes(policy.policy_status)) {
      throw new AppError(`Cannot file a claim against a policy with status '${policy.policy_status}'`, 400);
    }
    if (new Date(incident_date) < new Date(policy.policy_start_date) || new Date(incident_date) > new Date(policy.policy_end_date)) {
      throw new AppError('incident_date must fall within the policy period', 400);
    }

    const [coverageRows] = await pool.query(
      `SELECT * FROM policy_coverages WHERE policy_id = ? AND coverage_name = ?`,
      [policy_id, claim_type]
    );
    if (coverageRows.length === 0) {
      throw new AppError(`This policy does not include '${claim_type}' coverage`, 400);
    }
    const coverageLimit = Number(coverageRows[0].coverage_amount);
    if (Number(claim_amount) > coverageLimit) {
      throw new AppError(`Claim amount exceeds the coverage limit of \u20b9${coverageLimit.toLocaleString('en-IN')} for ${claim_type}`, 400);
    }

    // AI fraud assessment — runs before the claim is stored, result persisted with it
    const assessment = await buildAndAssessFraud({
      policyId: policy_id,
      claimType: claim_type,
      claimAmount: Number(claim_amount),
      incidentDate: incident_date,
      filedDate: filed_date
    });

    const claimNumber = await generateClaimNumber();
    const initialStatus = assessment.fraudLevel === 'High' ? 'UnderReview' : 'Submitted';

    const [result] = await pool.query(
      `INSERT INTO claims (claim_number, policy_id, claim_type, incident_date, filed_date, claim_amount, description, claim_status, fraud_score, fraud_level, fraud_flags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [claimNumber, policy_id, claim_type, incident_date, filed_date, claim_amount, description, initialStatus, assessment.fraudScore, assessment.fraudLevel, JSON.stringify(assessment.flags)]
    );

    await logActivity(
      'CLAIM_SUBMITTED',
      `Claim ${claimNumber} submitted against policy ${policy.policy_number} for ${policy.full_name} \u2014 AI fraud risk: ${assessment.fraudLevel} (score ${assessment.fraudScore})`
    );

    const [rows] = await pool.query(`SELECT * FROM claims WHERE claim_id = ?`, [result.insertId]);
    res.status(201).json({ success: true, data: { ...rows[0], fraud_flags: assessment.flags }, message: `Claim filed as ${claimNumber}` });
  } catch (err) {
    next(err);
  }
};

// POST /api/claims/:id/decide
// body: { decision: 'Approved' | 'Rejected', decision_notes }
// Adjudication step — an adjuster (or, for this project, whoever is at the keyboard)
// reviews the AI fraud score + flags alongside the claim and makes the call.
exports.decideClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, decision_notes } = req.body;
    requireFields(req.body, ['decision']);
    if (!['Approved', 'Rejected'].includes(decision)) throw new AppError('decision must be Approved or Rejected', 400);

    const [rows] = await pool.query(
      `SELECT cl.*, p.policy_number, c.full_name FROM claims cl
       JOIN policies p ON cl.policy_id = p.policy_id
       JOIN customers c ON p.customer_id = c.customer_id
       WHERE cl.claim_id = ?`,
      [id]
    );
    if (rows.length === 0) throw new AppError('Claim not found', 404);
    const claim = rows[0];

    if (!['Submitted', 'UnderReview'].includes(claim.claim_status)) {
      throw new AppError(`Cannot decide a claim with status '${claim.claim_status}'`, 400);
    }

    await pool.query(
      `UPDATE claims SET claim_status = ?, decision_notes = ?, decided_at = NOW() WHERE claim_id = ?`,
      [decision, decision_notes || null, id]
    );

    await logActivity('CLAIM_DECIDED', `Claim ${claim.claim_number} ${decision.toLowerCase()} for ${claim.full_name} on policy ${claim.policy_number}`);

    const [updated] = await pool.query(`SELECT * FROM claims WHERE claim_id = ?`, [id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/claims/:id/mark-paid
exports.markClaimPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT cl.*, p.policy_number, c.full_name FROM claims cl
       JOIN policies p ON cl.policy_id = p.policy_id
       JOIN customers c ON p.customer_id = c.customer_id
       WHERE cl.claim_id = ?`,
      [id]
    );
    if (rows.length === 0) throw new AppError('Claim not found', 404);
    const claim = rows[0];

    if (claim.claim_status !== 'Approved') {
      throw new AppError(`Only Approved claims can be marked Paid (current status: '${claim.claim_status}')`, 400);
    }

    await pool.query(`UPDATE claims SET claim_status = 'Paid' WHERE claim_id = ?`, [id]);
    await logActivity('CLAIM_PAID', `Claim ${claim.claim_number} paid out for ${claim.full_name} on policy ${claim.policy_number}`);

    const [updated] = await pool.query(`SELECT * FROM claims WHERE claim_id = ?`, [id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    next(err);
  }
};
