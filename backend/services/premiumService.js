// =====================================================================
// SIMPLE, CLEARLY-EXPLAINABLE PREMIUM CALCULATION RULE
// (Not a real actuarial formula - deliberately simplified for a
//  college project so it can be explained line-by-line in a viva)
//
// FORMULA:
//   base rate (per 1000 of sum insured) depends on coverage type
//   premium = (sum_insured / 1000) * base_rate
//
//   Basic         -> base rate = 2.5  per 1000 sum insured
//   Standard      -> base rate = 3.5  per 1000 sum insured
//   Comprehensive -> base rate = 5.0  per 1000 sum insured
//
// Example: Standard cover, Sum Insured = 5,00,000
//   premium = (500000 / 1000) * 3.5 = 500 * 3.5 = 1750... 
//   (scaled with a minimum premium floor, see below)
// =====================================================================

const BASE_RATES = {
  Basic: 2.5,
  Standard: 3.5,
  Comprehensive: 5.0
};

const MINIMUM_PREMIUM = 500; // no policy can have a premium below this

// premiumLoadingPct: extra % applied on top of the base premium, driven by
// the AI underwriting risk tier (0 for Low, 15 for Medium, 35 for High —
// see backend/services/mlService.js RISK_TIER_LOADING_PCT). Optional and
// defaults to 0 so this function still works standalone (e.g. quick preview
// before a risk assessment has run).
function calculatePremium(coverageType, sumInsured, premiumLoadingPct = 0) {
  const rate = BASE_RATES[coverageType];
  if (!rate) {
    throw new Error(`Invalid coverage type: ${coverageType}`);
  }
  if (!sumInsured || sumInsured <= 0) {
    throw new Error('Sum insured must be a positive number');
  }

  let basePremium = (sumInsured / 1000) * rate;
  basePremium = Math.max(basePremium, MINIMUM_PREMIUM);
  const loadedPremium = basePremium * (1 + (premiumLoadingPct || 0) / 100);

  return {
    coverageType,
    sumInsured,
    baseRate: rate,
    basePremium: Math.round(basePremium * 100) / 100,
    premiumLoadingPct: premiumLoadingPct || 0,
    premium: Math.round(loadedPremium * 100) / 100
  };
}

module.exports = { calculatePremium, BASE_RATES, MINIMUM_PREMIUM };
