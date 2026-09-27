const pool = require('../config/db');

// GET /api/dashboard
exports.getDashboardData = async (req, res, next) => {
  try {
    const [[{ totalCustomers }]] = await pool.query(`SELECT COUNT(*) AS totalCustomers FROM customers`);
    const [[{ totalPolicies }]] = await pool.query(`SELECT COUNT(*) AS totalPolicies FROM policies`);
    const [[{ activePolicies }]] = await pool.query(`SELECT COUNT(*) AS activePolicies FROM policies WHERE policy_status='Active'`);
    const [[{ expiredPolicies }]] = await pool.query(`SELECT COUNT(*) AS expiredPolicies FROM policies WHERE policy_status='Expired'`);
    const [[{ draftPolicies }]] = await pool.query(`SELECT COUNT(*) AS draftPolicies FROM policies WHERE policy_status='Draft'`);

    // In-force gross written premium from Active policies
    const [[{ inForcePremium }]] = await pool.query(
      `SELECT COALESCE(SUM(premium), 0) AS inForcePremium FROM policies WHERE policy_status='Active'`
    );

    // Total written premium across all policies
    const [[{ totalPremium }]] = await pool.query(
      `SELECT COALESCE(SUM(premium), 0) AS totalPremium FROM policies`
    );

    // policies expiring within next 30 days, still Active -> "pending renewal"
    const [[{ pendingRenewal }]] = await pool.query(
      `SELECT COUNT(*) AS pendingRenewal FROM policies
       WHERE policy_status='Active' AND policy_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
    );

    // ---- AI-driven insight widgets ----
    const [[{ totalClaims }]] = await pool.query(`SELECT COUNT(*) AS totalClaims FROM claims`);
    const [[{ openClaims }]] = await pool.query(
      `SELECT COUNT(*) AS openClaims FROM claims WHERE claim_status IN ('Submitted','UnderReview')`
    );
    const [[{ highFraudClaims }]] = await pool.query(
      `SELECT COUNT(*) AS highFraudClaims FROM claims WHERE fraud_level='High' AND claim_status IN ('Submitted','UnderReview')`
    );
    const [[{ totalHighFraudClaims }]] = await pool.query(
      `SELECT COUNT(*) AS totalHighFraudClaims FROM claims WHERE fraud_level='High'`
    );
    const [[{ highRiskPolicies }]] = await pool.query(
      `SELECT COUNT(*) AS highRiskPolicies FROM policies WHERE risk_tier='High' AND policy_status IN ('Active','Draft')`
    );
    const [[{ totalClaimPayout }]] = await pool.query(
      `SELECT COALESCE(SUM(claim_amount), 0) AS totalClaimPayout FROM claims WHERE claim_status IN ('Approved','Paid')`
    );

    // Distributions
    const [policiesByStatusRows] = await pool.query(
      `SELECT policy_status, COUNT(*) AS count, COALESCE(SUM(premium), 0) AS sum_premium FROM policies GROUP BY policy_status`
    );
    const [riskDistributionRows] = await pool.query(
      `SELECT risk_tier, COUNT(*) AS count FROM policies WHERE risk_tier IS NOT NULL GROUP BY risk_tier`
    );
    const [claimsByStatusRows] = await pool.query(
      `SELECT claim_status, COUNT(*) AS count, COALESCE(SUM(claim_amount), 0) AS sum_amount FROM claims GROUP BY claim_status`
    );
    const [fraudDistributionRows] = await pool.query(
      `SELECT fraud_level, COUNT(*) AS count FROM claims GROUP BY fraud_level`
    );
    const [coverageTypeRows] = await pool.query(
      `SELECT coverage_type, COUNT(*) AS count, COALESCE(SUM(premium), 0) AS sum_premium FROM policies GROUP BY coverage_type`
    );

    // Recent policies
    const [recentPolicies] = await pool.query(
      `SELECT p.policy_id, p.policy_number, p.coverage_type, p.sum_insured, p.premium, p.policy_status, p.risk_tier, p.risk_score, p.created_at, c.full_name, c.customer_code
       FROM policies p JOIN customers c ON p.customer_id = c.customer_id
       ORDER BY p.created_at DESC LIMIT 6`
    );

    // Flagged claims for Fraud Watch
    const [flaggedClaims] = await pool.query(
      `SELECT cl.claim_id, cl.claim_number, cl.claim_amount, cl.fraud_score, cl.fraud_level, cl.claim_status, cl.fraud_flags, cl.filed_date, p.policy_number, c.full_name
       FROM claims cl
       JOIN policies p ON cl.policy_id = p.policy_id
       JOIN customers c ON p.customer_id = c.customer_id
       WHERE cl.fraud_level IN ('Medium','High') OR cl.claim_status IN ('Submitted','UnderReview')
       ORDER BY cl.fraud_score DESC, cl.created_at DESC LIMIT 6`
    );

    // Underwriting alerts (submissions requiring underwriting attention or high risk)
    const [underwritingAlerts] = await pool.query(
      `SELECT p.policy_id, p.policy_number, p.customer_id, p.coverage_type, p.sum_insured, p.premium, p.risk_tier, p.risk_score, p.premium_loading_pct, p.policy_status, p.created_at, c.full_name, c.occupation, c.occupation_risk_category
       FROM policies p JOIN customers c ON p.customer_id = c.customer_id
       WHERE p.risk_tier = 'High' OR p.policy_status = 'Draft'
       ORDER BY (p.policy_status = 'Draft') DESC, p.risk_score DESC LIMIT 6`
    );

    // Renewal radar: approaching renewal, recently expired, or recently renewed
    const [renewalRadar] = await pool.query(
      `SELECT p.policy_id, p.policy_number, p.coverage_type, p.premium, p.policy_start_date, p.policy_end_date, p.policy_status, c.full_name
       FROM policies p JOIN customers c ON p.customer_id = c.customer_id
       WHERE p.policy_status IN ('Active', 'Expired', 'Renewed')
       ORDER BY p.policy_end_date ASC LIMIT 6`
    );

    const [recentActivities] = await pool.query(
      `SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalPolicies,
        activePolicies,
        expiredPolicies,
        draftPolicies,
        pendingRenewal,
        inForcePremium: Number(inForcePremium),
        totalPremium: Number(totalPremium),
        totalClaims,
        openClaims,
        highFraudClaims,
        totalHighFraudClaims,
        highRiskPolicies,
        totalClaimPayout: Number(totalClaimPayout),
        policiesByStatus: policiesByStatusRows,
        riskDistribution: riskDistributionRows,
        claimsByStatus: claimsByStatusRows,
        fraudDistribution: fraudDistributionRows,
        coverageTypeDistribution: coverageTypeRows,
        recentPolicies,
        flaggedClaims: flaggedClaims.map(c => ({
          ...c,
          fraud_flags: typeof c.fraud_flags === 'string' ? JSON.parse(c.fraud_flags) : (c.fraud_flags || [])
        })),
        underwritingAlerts,
        renewalRadar,
        recentActivities
      }
    });
  } catch (err) {
    next(err);
  }
};
