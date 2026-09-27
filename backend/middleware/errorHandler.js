// -----------------------------------------------------------------------
// Centralized error handler - keeps controllers free of repetitive
// try/catch boilerplate error formatting.
// -----------------------------------------------------------------------
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Duplicate entry: ' + err.sqlMessage });
  }

  // Custom AppError thrown from controllers/services
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  return res.status(500).json({ success: false, message: 'Internal server error', detail: err.message });
}

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
