// -----------------------------------------------------------------------
// Simple field-presence / format validators (kept intentionally simple
// for a college project - no external validation library needed).
// -----------------------------------------------------------------------
const { AppError } = require('./errorHandler');

function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    throw new AppError(`Missing required field(s): ${missing.join(', ')}`, 400);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(dateStr) {
  return !isNaN(Date.parse(dateStr));
}

module.exports = { requireFields, isValidEmail, isValidDate };
