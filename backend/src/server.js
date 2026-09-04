import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { db, queryGet } from './db/connection.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/auth.js';
import hotelsRoutes from './routes/hotels.js';
import ngosRoutes from './routes/ngos.js';
import donationsRoutes from './routes/donations.js';
import matchingRoutes from './routes/matching.js';
import deliveriesRoutes from './routes/deliveries.js';
import adminRoutes from './routes/admin.js';
import reportsRoutes from './routes/reports.js';
import notificationsRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for production (Vercel) and development
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : '*';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow to prevent unexpected preflight blockage
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Request logger for API transparency
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/ngos', ngosRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'FoodBridge AI Logistics Platform',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Auto-seed if database is empty on start
try {
  const userCount = queryGet('SELECT COUNT(*) as c FROM users')?.c || 0;
  if (userCount === 0) {
    console.log('Database empty, auto-seeding sample scenarios...');
    await seedDatabase();
  }
} catch (e) {
  console.log('Initializing schema & seed...');
  await seedDatabase();
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FoodBridge AI Backend running on port ${PORT}`);
  console.log(`📡 API endpoints ready at http://localhost:${PORT}/api`);
});
