const pool = require('../config/db');
const { requireFields, isValidEmail, isValidDate } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const { generateCustomerCode } = require('../services/policyNumberService');
const { logActivity } = require('../services/activityService');

// GET /api/customers?search=
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM customers`;
    const params = [];
    if (search) {
      sql += ` WHERE full_name LIKE ? OR customer_code LIKE ? OR email LIKE ? OR phone LIKE ?`;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    sql += ` ORDER BY created_at DESC`;
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/customers/:id
exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
    if (rows.length === 0) throw new AppError('Customer not found', 404);

    const [policies] = await pool.query(
      `SELECT * FROM policies WHERE customer_id = ? ORDER BY created_at DESC`,
      [id]
    );

    const [claims] = await pool.query(
      `SELECT cl.*, p.policy_number, p.coverage_type
       FROM claims cl
       JOIN policies p ON cl.policy_id = p.policy_id
       WHERE p.customer_id = ? ORDER BY cl.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        policies,
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

// POST /api/customers
exports.createCustomer = async (req, res, next) => {
  try {
    const { full_name, date_of_birth, gender, phone, email, address, occupation, occupation_risk_category } = req.body;
    requireFields(req.body, ['full_name', 'date_of_birth', 'gender', 'phone', 'email', 'address']);
    if (!isValidEmail(email)) throw new AppError('Invalid email format', 400);
    if (!isValidDate(date_of_birth)) throw new AppError('Invalid date_of_birth', 400);
    if (occupation_risk_category && !['Low', 'Medium', 'High'].includes(occupation_risk_category)) {
      throw new AppError('Invalid occupation_risk_category', 400);
    }

    const customer_code = await generateCustomerCode();

    const [result] = await pool.query(
      `INSERT INTO customers (customer_code, full_name, date_of_birth, gender, phone, email, address, occupation, occupation_risk_category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_code, full_name, date_of_birth, gender, phone, email, address, occupation || 'Not Specified', occupation_risk_category || 'Low']
    );

    await logActivity('CUSTOMER_CREATED', `New customer ${full_name} (${customer_code}) registered`);

    const [rows] = await pool.query(`SELECT * FROM customers WHERE customer_id = ?`, [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, date_of_birth, gender, phone, email, address, occupation, occupation_risk_category } = req.body;
    requireFields(req.body, ['full_name', 'date_of_birth', 'gender', 'phone', 'email', 'address']);
    if (!isValidEmail(email)) throw new AppError('Invalid email format', 400);
    if (occupation_risk_category && !['Low', 'Medium', 'High'].includes(occupation_risk_category)) {
      throw new AppError('Invalid occupation_risk_category', 400);
    }

    const [existing] = await pool.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
    if (existing.length === 0) throw new AppError('Customer not found', 404);

    await pool.query(
      `UPDATE customers SET full_name=?, date_of_birth=?, gender=?, phone=?, email=?, address=?, occupation=?, occupation_risk_category=? WHERE customer_id=?`,
      [full_name, date_of_birth, gender, phone, email, address, occupation || 'Not Specified', occupation_risk_category || 'Low', id]
    );

    const [rows] = await pool.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
    if (existing.length === 0) throw new AppError('Customer not found', 404);

    const [policies] = await pool.query(`SELECT * FROM policies WHERE customer_id = ? AND policy_status='Active'`, [id]);
    if (policies.length > 0) {
      throw new AppError('Cannot delete customer with active policies. Cancel policies first.', 409);
    }

    await pool.query(`DELETE FROM customers WHERE customer_id = ?`, [id]);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
};
