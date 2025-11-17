// src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connect } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connect(process.env.MONGODB_URI);
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }

  // middlewares
  app.use(helmet());
  app.use(cors());
  app.use(morgan('tiny'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  const limiter = rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000), max: Number(process.env.RATE_LIMIT_MAX || 120) });
  app.use(limiter);

  // static uploads for dev
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // routes
  const apiRouter = require('./routes/index');
  app.use('/api/v1', apiRouter);

  // health
  app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.listen(PORT, () => {
    console.log(`Great Nexus backend (MongoDB) listening on port ${PORT}`);
  });

})();
