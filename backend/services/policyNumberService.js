// -----------------------------------------------------------------------
// Generates policy numbers in the format PA-<YEAR>-<SEQUENCE>
// e.g. PA-2026-0005
// -----------------------------------------------------------------------
const pool = require('../config/db');

async function generatePolicyNumber() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM policies WHERE policy_number LIKE ?`,
    [`PA-${year}-%`]
  );
  const nextSeq = (rows[0].count || 0) + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `PA-${year}-${seqStr}`;
}

async function generateCustomerCode() {
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM customers`);
  const nextSeq = (rows[0].count || 0) + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `CUST-${seqStr}`;
}

// Generates claim numbers in the format CLM-<YEAR>-<SEQUENCE>, e.g. CLM-2026-0003
async function generateClaimNumber() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM claims WHERE claim_number LIKE ?`,
    [`CLM-${year}-%`]
  );
  const nextSeq = (rows[0].count || 0) + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `CLM-${year}-${seqStr}`;
}

module.exports = { generatePolicyNumber, generateCustomerCode, generateClaimNumber };
