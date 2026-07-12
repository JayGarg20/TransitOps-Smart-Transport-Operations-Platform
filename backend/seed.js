import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding user accounts...');
    await mongoose.connect(mongoUri);
    console.log('Connected. Cleaning existing user data...');
    
    // Clear Users
    await User.deleteMany({});
    console.log('Users cleared. Seeding default operators...');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = 'password123'; // Temporary plain password, will be hashed below

    const users = [
      {
        name: 'Alex Mercer',
        email: 'manager@waybound.com',
        passwordHash: await bcrypt.hash('manager123', salt),
        role: 'Fleet Manager',
        isEmailVerified: true
      },
      {
        name: 'Sarah Connor',
        email: 'safety@waybound.com',
        passwordHash: await bcrypt.hash('safety123', salt),
        role: 'Safety Officer',
        isEmailVerified: true
      },
      {
        name: 'John Doe',
        email: 'finance@waybound.com',
        passwordHash: await bcrypt.hash('finance123', salt),
        role: 'Financial Analyst',
        isEmailVerified: true
      },
      {
        name: 'Marcus Vance',
        email: 'driver@waybound.com',
        passwordHash: await bcrypt.hash('driver123', salt),
        role: 'Driver',
        isEmailVerified: true
      }
    ];

    await User.insertMany(users);
    console.log('Seeded 4 operator users successfully.');

    console.log('Database seeding successfully finished.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
