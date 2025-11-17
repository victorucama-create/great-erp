// src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static uploads (for dev)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// mount module routes
const productsRouter = require('./routes/products.routes');
app.use('/api/v1/erp', productsRouter);

// health
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Great Nexus backend listening on port ${PORT}`);
});
