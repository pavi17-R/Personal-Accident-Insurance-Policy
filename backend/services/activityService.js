// -----------------------------------------------------------------------
// Writes a row to activity_log - used to power the Dashboard's
// "Recent activities" widget.
// -----------------------------------------------------------------------
const pool = require('../config/db');

async function logActivity(activityType, description) {
  try {
    await pool.query(
      `INSERT INTO activity_log (activity_type, description) VALUES (?, ?)`,
      [activityType, description]
    );
  } catch (err) {
    // Activity logging should never break the main request flow
    console.error('[ActivityLog] Failed to log activity:', err.message);
  }
}

module.exports = { logActivity };
