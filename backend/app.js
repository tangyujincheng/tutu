const express = require('express');
const cors = require('cors');
const path = require('path');
const lettersRoute = require('./routes/letters');
const adminRoute = require('./routes/admin');
const { startScheduler } = require('./services/scheduler');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/letters', lettersRoute);
app.use('/api/admin', adminRoute);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Admin config page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Catch-all route to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start scheduler
startScheduler();

logger.info('Backend app initialized');

module.exports = app;
