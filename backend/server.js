// =====================================================================
// Personal Accident Insurance Policy Administration System - Backend
// Express.js REST API server
// =====================================================================
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const customerRoutes = require('./routes/customerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const claimRoutes = require('./routes/claimRoutes');
const searchRoutes = require('./routes/searchRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PA Insurance API is running' });
});

app.use('/api/customers', customerRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/activities', activityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] PA Insurance backend running on http://localhost:${PORT}`);
});
