require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const studentRoutes = require('./src/routes/studentRoutes');
const submissionRoutes = require('./src/routes/submissionRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();

// ── Middleware ──
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ──
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/students', studentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Error handling ──
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Edu App Mentor API running on port ${PORT}`));
});
