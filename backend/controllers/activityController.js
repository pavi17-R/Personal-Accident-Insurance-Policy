const pool = require('../config/db');

// GET /api/activities?search=&type=&limit=&offset=
exports.getActivities = async (req, res, next) => {
  try {
    const { search, type, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT * FROM activity_log WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (description LIKE ? OR activity_type LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== 'ALL') {
      sql += ` AND activity_type = ?`;
      params.push(type);
    }

    // Get total count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS total');
    const [[{ total }]] = await pool.query(countSql, params);

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);

    // Get distinct activity types for filtering
    const [types] = await pool.query(
      `SELECT DISTINCT activity_type, COUNT(*) as count FROM activity_log GROUP BY activity_type ORDER BY count DESC`
    );

    res.json({
      success: true,
      data: {
        total,
        activities: rows,
        activityTypes: types
      }
    });
  } catch (err) {
    next(err);
  }
};
