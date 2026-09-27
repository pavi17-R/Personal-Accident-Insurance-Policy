const { calculatePremium } = require('../services/premiumService');
const { AppError } = require('../middleware/errorHandler');

// POST /api/policies/calculate-premium
// body: { coverage_type, sum_insured }
exports.calculatePremiumController = async (req, res, next) => {
  try {
    const { coverage_type, sum_insured, premium_loading_pct } = req.body;
    if (!coverage_type || !sum_insured) {
      throw new AppError('coverage_type and sum_insured are required', 400);
    }
    const result = calculatePremium(coverage_type, Number(sum_insured), Number(premium_loading_pct) || 0);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
