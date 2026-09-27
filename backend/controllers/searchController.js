const pool = require('../config/db');

// GET /api/search?q=
exports.globalSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { customers: [], policies: [], claims: [] }
      });
    }

    const pattern = `%${q}%`;

    const [customers] = await pool.query(
      `SELECT customer_id, customer_code, full_name, email, phone, occupation, occupation_risk_category
       FROM customers
       WHERE full_name LIKE ? OR customer_code LIKE ? OR email LIKE ? OR phone LIKE ?
       LIMIT 6`,
      [pattern, pattern, pattern, pattern]
    );

    const [policies] = await pool.query(
      `SELECT p.policy_id, p.policy_number, p.coverage_type, p.sum_insured, p.premium, p.policy_status, p.risk_tier, c.full_name
       FROM policies p
       JOIN customers c ON p.customer_id = c.customer_id
       WHERE p.policy_number LIKE ? OR c.full_name LIKE ? OR c.customer_code LIKE ?
       LIMIT 6`,
      [pattern, pattern, pattern]
    );

    const [claims] = await pool.query(
      `SELECT cl.claim_id, cl.claim_number, cl.claim_type, cl.claim_status, cl.claim_amount, cl.fraud_score, cl.fraud_level, p.policy_number, c.full_name
       FROM claims cl
       JOIN policies p ON cl.policy_id = p.policy_id
       JOIN customers c ON p.customer_id = c.customer_id
       WHERE cl.claim_number LIKE ? OR cl.claim_type LIKE ? OR p.policy_number LIKE ? OR c.full_name LIKE ?
       LIMIT 6`,
      [pattern, pattern, pattern, pattern]
    );

    res.json({
      success: true,
      data: { customers, policies, claims }
    });
  } catch (err) {
    next(err);
  }
};
