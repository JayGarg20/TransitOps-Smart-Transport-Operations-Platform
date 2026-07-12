import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import Routes (Auth only for this branch)
import authRoutes from './routes/auth.js';

// Setup environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ESM __dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security and utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bind routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'TransitOps Backend Service (Auth Node) is healthy.' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'An internal server error occurred',
  });
});

// Database connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB database (Auth Node).');
    app.listen(PORT, () => {
      console.log(`TransitOps server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });
