const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const path = require('path');
const connectDB = require('./config/db');
const { isDbHealthy } = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: function (origin, callback) {
    // Mobile apps send no Origin header -> always allow.
    if (!origin) return callback(null, true);
    const allowed = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : null;
    if (!allowed || allowed.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error(`CORS not allowed for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(morgan('dev'));

// Static folder for Frontend and Admin Panel
app.use(express.static(path.join(__dirname, '../public')));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chats', chatRoutes);

// Swagger API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check (for deployment platforms)
app.get('/api/health', (req, res) => {
  const db = isDbHealthy();
  res.status(db.connected ? 200 : 503).json({
    success: true,
    status: db.connected ? 'ok' : 'degraded',
    db: db.state,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root Endpoint - Serve Test Frontend Single Page App
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
