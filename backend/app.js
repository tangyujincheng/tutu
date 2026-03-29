const express = require('express');
const cors = require('cors');
const path = require('path');
const lettersRoute = require('./routes/letters');
const adminRoute = require('./routes/admin');
const { startScheduler } = require('./services/scheduler');
const logger = require('./utils/logger');

const app = express();
const BASE_PATH = process.env.BASE_PATH || '';

// Middleware
app.use(cors());
app.use(express.json());

// API routes (support base path for subdirectory deployment)
// lettersRoute already defines the '/' endpoint for POST/GET
// So mounting to exactly ${BASE_PATH}/api/letters works for /bunny-letter-game/api/letters
app.use(`${BASE_PATH}/api/letters`, lettersRoute);
app.use(`${BASE_PATH}/api/admin`, adminRoute);

// Also allow trailing slash variant to avoid 404 issues
app.use(`${BASE_PATH}/api/letters/`, lettersRoute);
app.use(`${BASE_PATH}/api/admin/`, adminRoute);

// Health check endpoint
app.get(`${BASE_PATH}/api/health`, (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', basePath: BASE_PATH });
});
app.get(`${BASE_PATH}/api/health/`, (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', basePath: BASE_PATH });
});

// Simple AI test endpoint - standalone, no storage
// Support both GET and POST for easy browser testing
// Returns raw AI reply directly
const aiService = require('./services/ai');
const handleTestAI = async (message, res) => {
  try {
    if (!message) {
      return res.status(400).send('Please provide "message" parameter (via query for GET, body for POST)');
    }
    const reply = await aiService.generateReply(message);
    res.send(reply);
  } catch (error) {
    logger.error('AI test endpoint error', error);
    res.status(500).send(error.message);
  }
};

app.get(`${BASE_PATH}/api/test-ai`, async (req, res) => {
  const message = req.query.message;
  await handleTestAI(message, res);
});

app.post(`${BASE_PATH}/api/test-ai`, async (req, res) => {
  const message = req.body.message;
  await handleTestAI(message, res);
});

// Also support trailing slash
app.get(`${BASE_PATH}/api/test-ai/`, async (req, res) => {
  const message = req.query.message;
  await handleTestAI(message, res);
});
app.post(`${BASE_PATH}/api/test-ai/`, async (req, res) => {
  const message = req.body.message;
  await handleTestAI(message, res);
});

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
