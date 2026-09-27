const pool = require('../config/db');
const { requireFields, isValidDate } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const { calculatePremium } = require('../services/premiumService');
const { generatePolicyNumber } = require('../services/policyNumberService');
const { logActivity } = require('../services/activityService');
const { buildAndAssessRisk } = require('../services/riskAssessmentService');

const COVERAGE_OPTIONS = ['Accidental Death', 'Permanent Disability', 'Medical Expense Coverage'];

// GET /api/policies?search=&status=&customer_id=
exports.getAllPolicies = async (req, res, next) => {
  try {
    const { search, status, customer_id } = req.query;
    let sql = `
      SELECT p.*, c.full_name, c.customer_code
      FROM policies p JOIN customers c ON p.customer_id = c.customer_id
      WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (p.policy_number LIKE ? OR c.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += ` AND p.policy_status = ?`;
      params.push(status);
    }
    if (customer_id) {
      sql += ` AND p.customer_id = ?`;
      params.push(customer_id);
    }
    sql += ` ORDER BY p.created_at DESC`;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/policies/:id
exports.getPolicyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, c.full_name, c.customer_code, c.email, c.phone, c.address, c.date_of_birth, c.gender, c.occupation, c.occupation_risk_category
       FROM policies p JOIN customers c ON p.customer_id = c.customer_id
       WHERE p.policy_id = ?`,
      [id]
    );
    if (rows.length === 0) throw new AppError('Policy not found', 404);

    const [coverages] = await pool.query(`SELECT * FROM policy_coverages WHERE policy_id = ?`, [id]);
    const [renewals] = await pool.query(
      `SELECT r.*, np.policy_number AS new_policy_number, op.policy_number AS old_policy_number
       FROM policy_renewals r
       JOIN policies np ON r.new_policy_id = np.policy_id
       JOIN policies op ON r.old_policy_id = op.policy_id
       WHERE r.old_policy_id = ? OR r.new_policy_id = ?
       ORDER BY r.created_at DESC`,
      [id, id]
    );
    const [cancellation] = await pool.query(`SELECT * FROM policy_cancellations WHERE policy_id = ?`, [id]);
    const [claims] = await pool.query(
      `SELECT cl.*, c.full_name
       FROM claims cl
       JOIN policies p ON cl.policy_id = p.policy_id
       JOIN customers c ON p.customer_id = c.customer_id
       WHERE cl.policy_id = ?
       ORDER BY cl.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        coverages,
        renewals,
        cancellation: cancellation[0] || null,
        claims: claims.map(c => ({
          ...c,
          fraud_flags: typeof c.fraud_flags === 'string' ? JSON.parse(c.fraud_flags) : (c.fraud_flags || [])
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/policies
// body: { customer_id, coverage_type, sum_insured, policy_start_date, policy_end_date, coverages: [{coverage_name, coverage_amount}] }
exports.createPolicy = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { customer_id, coverage_type, sum_insured, policy_start_date, policy_end_date, coverages, policy_status } = req.body;
    requireFields(req.body, ['customer_id', 'coverage_type', 'sum_insured', 'policy_start_date', 'policy_end_date']);

    if (!['Basic', 'Standard', 'Comprehensive'].includes(coverage_type)) {
      throw new AppError('Invalid coverage_type', 400);
    }
    if (!isValidDate(policy_start_date) || !isValidDate(policy_end_date)) {
      throw new AppError('Invalid policy dates', 400);
    }
    if (new Date(policy_end_date) <= new Date(policy_start_date)) {
      throw new AppError('policy_end_date must be after policy_start_date', 400);
    }

    const [customerRows] = await conn.query(`SELECT * FROM customers WHERE customer_id = ?`, [customer_id]);
    if (customerRows.length === 0) throw new AppError('Customer not found', 404);

    // AI underwriting risk assessment runs before premium is finalized, so the
    // risk-driven loading is baked into the bound premium (not just shown as a preview).
    const risk = await buildAndAssessRisk({
      customerId: customer_id,
      coverageType: coverage_type,
      sumInsured: Number(sum_insured),
      asOfDate: policy_start_date
    });
    const { premium } = calculatePremium(coverage_type, Number(sum_insured), risk.premiumLoadingPct);
    const policyNumber = await generatePolicyNumber();
    const status = policy_status && ['Draft', 'Active'].includes(policy_status) ? policy_status : 'Draft';

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO policies (policy_number, customer_id, coverage_type, sum_insured, premium, risk_tier, risk_score, premium_loading_pct, policy_start_date, policy_end_date, policy_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [policyNumber, customer_id, coverage_type, sum_insured, premium, risk.riskTier, risk.riskScore, risk.premiumLoadingPct, policy_start_date, policy_end_date, status]
    );
    const newPolicyId = result.insertId;

    const coverageList = Array.isArray(coverages) && coverages.length > 0
      ? coverages
      : [{ coverage_name: 'Accidental Death', coverage_amount: sum_insured }];

    for (const cov of coverageList) {
      if (!COVERAGE_OPTIONS.includes(cov.coverage_name)) {
        throw new AppError(`Invalid coverage option: ${cov.coverage_name}`, 400);
      }
      await conn.query(
        `INSERT INTO policy_coverages (policy_id, coverage_name, coverage_amount) VALUES (?, ?, ?)`,
        [newPolicyId, cov.coverage_name, cov.coverage_amount || sum_insured]
      );
    }

    await conn.commit();

    await logActivity('POLICY_ISSUED', `Policy ${policyNumber} issued for ${customerRows[0].full_name} \u2014 AI risk tier: ${risk.riskTier} (score ${risk.riskScore})`);

    const [rows] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [newPolicyId]);
    res.status(201).json({ success: true, data: { ...rows[0], riskAssessment: risk } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// POST /api/policies/assess-risk
// Live AI risk preview while filling out the New Policy form — does not persist anything.
// body: { customer_id, coverage_type, sum_insured, policy_start_date }
exports.assessRiskController = async (req, res, next) => {
  try {
    const { customer_id, coverage_type, sum_insured, policy_start_date } = req.body;
    requireFields(req.body, ['customer_id', 'coverage_type', 'sum_insured']);
    const risk = await buildAndAssessRisk({
      customerId: customer_id,
      coverageType: coverage_type,
      sumInsured: Number(sum_insured),
      asOfDate: policy_start_date || new Date().toISOString().slice(0, 10)
    });
    res.json({ success: true, data: risk });
  } catch (err) {
    next(err);
  }
};

// PUT /api/policies/:id  (edit draft policy details)
exports.updatePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { coverage_type, sum_insured, policy_start_date, policy_end_date, policy_status } = req.body;

    const [existing] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [id]);
    if (existing.length === 0) throw new AppError('Policy not found', 404);

    let premium = existing[0].premium;
    if (coverage_type && sum_insured) {
      const result = calculatePremium(coverage_type, Number(sum_insured));
      premium = result.premium;
    }

    await pool.query(
      `UPDATE policies SET
        coverage_type = COALESCE(?, coverage_type),
        sum_insured = COALESCE(?, sum_insured),
        premium = ?,
        policy_start_date = COALESCE(?, policy_start_date),
        policy_end_date = COALESCE(?, policy_end_date),
        policy_status = COALESCE(?, policy_status)
       WHERE policy_id = ?`,
      [coverage_type, sum_insured, premium, policy_start_date, policy_end_date, policy_status, id]
    );

    const [rows] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/policies/:id/renew
// body: { policy_start_date, policy_end_date, sum_insured (optional), coverage_type (optional) }
exports.renewPolicy = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { policy_start_date, policy_end_date, sum_insured, coverage_type } = req.body;
    requireFields(req.body, ['policy_start_date', 'policy_end_date']);

    const [existingRows] = await conn.query(
      `SELECT p.*, c.full_name FROM policies p JOIN customers c ON p.customer_id = c.customer_id WHERE p.policy_id = ?`,
      [id]
    );
    if (existingRows.length === 0) throw new AppError('Policy not found', 404);
    const oldPolicy = existingRows[0];

    if (!['Active', 'Expired'].includes(oldPolicy.policy_status)) {
      throw new AppError(`Cannot renew a policy with status '${oldPolicy.policy_status}'`, 400);
    }

    const finalCoverageType = coverage_type || oldPolicy.coverage_type;
    const finalSumInsured = sum_insured || oldPolicy.sum_insured;
    // re-run the AI risk model at renewal time — claims/tenure since issuance may have changed the tier
    const risk = await buildAndAssessRisk({
      customerId: oldPolicy.customer_id,
      coverageType: finalCoverageType,
      sumInsured: Number(finalSumInsured),
      asOfDate: policy_start_date
    });
    const { premium: newPremium } = calculatePremium(finalCoverageType, Number(finalSumInsured), risk.premiumLoadingPct);
    const newPolicyNumber = await generatePolicyNumber();

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO policies (policy_number, customer_id, coverage_type, sum_insured, premium, risk_tier, risk_score, premium_loading_pct, policy_start_date, policy_end_date, policy_status, parent_policy_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
      [newPolicyNumber, oldPolicy.customer_id, finalCoverageType, finalSumInsured, newPremium, risk.riskTier, risk.riskScore, risk.premiumLoadingPct, policy_start_date, policy_end_date, oldPolicy.policy_id]
    );
    const newPolicyId = result.insertId;

    // carry over coverages
    const [oldCoverages] = await conn.query(`SELECT * FROM policy_coverages WHERE policy_id = ?`, [id]);
    for (const cov of oldCoverages) {
      await conn.query(
        `INSERT INTO policy_coverages (policy_id, coverage_name, coverage_amount) VALUES (?, ?, ?)`,
        [newPolicyId, cov.coverage_name, cov.coverage_amount]
      );
    }

    await conn.query(`UPDATE policies SET policy_status = 'Renewed' WHERE policy_id = ?`, [id]);

    await conn.query(
      `INSERT INTO policy_renewals (old_policy_id, new_policy_id, renewal_date, old_premium, new_premium, remarks)
       VALUES (?, ?, CURDATE(), ?, ?, ?)`,
      [id, newPolicyId, oldPolicy.premium, newPremium, 'Renewed via web portal']
    );

    await conn.commit();

    await logActivity('POLICY_RENEWED', `Policy ${oldPolicy.policy_number} renewed as ${newPolicyNumber} for ${oldPolicy.full_name}`);

    const [rows] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [newPolicyId]);
    res.status(201).json({ success: true, data: rows[0], message: `Renewed as ${newPolicyNumber}` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// POST /api/policies/:id/cancel
// body: { cancellation_reason, cancellation_date }
exports.cancelPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellation_reason, cancellation_date } = req.body;
    requireFields(req.body, ['cancellation_reason', 'cancellation_date']);
    if (!isValidDate(cancellation_date)) throw new AppError('Invalid cancellation_date', 400);

    const [existing] = await pool.query(
      `SELECT p.*, c.full_name FROM policies p JOIN customers c ON p.customer_id = c.customer_id WHERE p.policy_id = ?`,
      [id]
    );
    if (existing.length === 0) throw new AppError('Policy not found', 404);
    const policy = existing[0];

    if (!['Active', 'Draft'].includes(policy.policy_status)) {
      throw new AppError(`Cannot cancel a policy with status '${policy.policy_status}'`, 400);
    }

    await pool.query(
      `INSERT INTO policy_cancellations (policy_id, cancellation_reason, cancellation_date) VALUES (?, ?, ?)`,
      [id, cancellation_reason, cancellation_date]
    );
    await pool.query(`UPDATE policies SET policy_status = 'Cancelled' WHERE policy_id = ?`, [id]);

    await logActivity('POLICY_CANCELLED', `Policy ${policy.policy_number} cancelled for ${policy.full_name}`);

    const [rows] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/policies/:id/bind
// Issue / Bind an existing Draft policy into Active state
exports.bindPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      `SELECT p.*, c.full_name FROM policies p JOIN customers c ON p.customer_id = c.customer_id WHERE p.policy_id = ?`,
      [id]
    );
    if (existing.length === 0) throw new AppError('Policy not found', 404);
    const policy = existing[0];
    if (policy.policy_status !== 'Draft') {
      throw new AppError(`Only Draft policies can be bound/issued (current status: '${policy.policy_status}')`, 400);
    }

    await pool.query(`UPDATE policies SET policy_status = 'Active' WHERE policy_id = ?`, [id]);
    await logActivity('POLICY_ISSUED', `Policy ${policy.policy_number} bound & issued for ${policy.full_name} via Underwriting Workbench`);

    const [rows] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [id]);
    res.json({ success: true, data: rows[0], message: `Policy ${policy.policy_number} is now Active & Bound` });
  } catch (err) {
    next(err);
  }
};

// POST /api/policies/:id/decline
// Underwriter declines an application or draft submission
exports.declinePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const declineReason = reason || 'Declined during Underwriting review';

    const [existing] = await pool.query(
      `SELECT p.*, c.full_name FROM policies p JOIN customers c ON p.customer_id = c.customer_id WHERE p.policy_id = ?`,
      [id]
    );
    if (existing.length === 0) throw new AppError('Policy not found', 404);
    const policy = existing[0];

    if (!['Draft', 'Active'].includes(policy.policy_status)) {
      throw new AppError(`Cannot decline a policy with status '${policy.policy_status}'`, 400);
    }

    const today = new Date().toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO policy_cancellations (policy_id, cancellation_reason, cancellation_date) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE cancellation_reason = VALUES(cancellation_reason), cancellation_date = VALUES(cancellation_date)`,
      [id, `Underwriting Decline: ${declineReason}`, today]
    );
    await pool.query(`UPDATE policies SET policy_status = 'Cancelled' WHERE policy_id = ?`, [id]);

    await logActivity('POLICY_CANCELLED', `Policy ${policy.policy_number} declined by Underwriter: ${declineReason}`);

    const [rows] = await pool.query(`SELECT * FROM policies WHERE policy_id = ?`, [id]);
    res.json({ success: true, data: rows[0], message: `Policy ${policy.policy_number} declined` });
  } catch (err) {
    next(err);
  }
};
