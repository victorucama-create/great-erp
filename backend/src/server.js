require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const userRoutes = require('./routes/user.routes');
const salesRoutes = require('./routes/sales.routes');

const app = express();

// Connect database
connectDB();

// Security middlewares
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limit
app.use(rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 120,
    standardHeaders: true,
}));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: "OK",
        service: "Great Nexus Backend",
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/erp/sales", salesRoutes);

app.get("/", (req, res) => res.send("Great Nexus API is running"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
🚀 GREAT NEXUS BACKEND STARTED
📌 Port: ${PORT}
🌍 Multi-tenant API ready
    `);
});
