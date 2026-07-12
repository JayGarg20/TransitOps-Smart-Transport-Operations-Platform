import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import tripRoutes from './routes/trips.js';
import maintenanceRoutes from './routes/maintenance.js';
import expenseRoutes from './routes/expenses.js';
import analyticsRoutes from './routes/analytics.js';

// Setup environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ESM __dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security and utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows displaying uploaded images on local client
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded driver license files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bind routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'TransitOps Backend Service is healthy.' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  // Never log raw error details that contain sensitive parameters to console
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'An internal server error occurred',
  });
});

// Database connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB database.');
    app.listen(PORT, () => {
      console.log(`TransitOps server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });
