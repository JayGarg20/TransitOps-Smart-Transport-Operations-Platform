import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';

import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Driver from './models/Driver.js';
import Trip from './models/Trip.js';
import MaintenanceLog from './models/MaintenanceLog.js';
import FuelLog from './models/FuelLog.js';
import Expense from './models/Expense.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('Connected. Cleaning existing data...');

    // Clear existing collections
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await MaintenanceLog.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});

    console.log('Data cleared. Seeding Users...');
    
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const managerPassword = await bcrypt.hash('manager123', salt);
    const safetyPassword = await bcrypt.hash('safety123', salt);
    const financePassword = await bcrypt.hash('finance123', salt);
    const driverPassword = await bcrypt.hash('driver123', salt);

    const users = [
      {
        name: 'Marcus Vance',
        email: 'manager@waybound.com',
        passwordHash: managerPassword,
        role: 'Fleet Manager',
        isEmailVerified: true
      },
      {
        name: 'Sarah Connor',
        email: 'safety@waybound.com',
        passwordHash: safetyPassword,
        role: 'Safety Officer',
        isEmailVerified: true
      },
      {
        name: 'Gordon Gekko',
        email: 'finance@waybound.com',
        passwordHash: financePassword,
        role: 'Financial Analyst',
        isEmailVerified: true
      },
      {
        name: 'Alex Mercer',
        email: 'driver@waybound.com',
        passwordHash: driverPassword,
        role: 'Driver',
        isEmailVerified: true
      }
    ];

    const seededUsers = await User.insertMany(users);
    console.log(`Seeded ${seededUsers.length} users successfully.`);

    console.log('Seeding Vehicles...');
    const vehicles = [
      {
        regNumber: 'TRK-01',
        name: 'Volvo VNL 860 (Semi)',
        type: 'Heavy Duty Truck',
        maxLoadCapacity: 18000, // 18 tons
        odometer: 120000,
        acquisitionCost: 145000,
        status: 'Available'
      },
      {
        regNumber: 'VAN-05',
        name: 'Ford Transit Cargo Van',
        type: 'Van',
        maxLoadCapacity: 1500, // 1.5 tons
        odometer: 45000,
        acquisitionCost: 42000,
        status: 'Available'
      },
      {
        regNumber: 'EV-09',
        name: 'Rivian EDV Delivery',
        type: 'EV Dispatch',
        maxLoadCapacity: 800, // 800 kg
        odometer: 12000,
        acquisitionCost: 72000,
        status: 'Available'
      },
      {
        regNumber: 'TRK-12',
        name: 'Freightliner Cascadia',
        type: 'Heavy Duty Truck',
        maxLoadCapacity: 20000,
        odometer: 250000,
        acquisitionCost: 160000,
        status: 'In Shop' // starts in maintenance
      }
    ];

    const seededVehicles = await Vehicle.insertMany(vehicles);
    console.log(`Seeded ${seededVehicles.length} vehicles successfully.`);

    console.log('Seeding Drivers...');
    
    // Future date helper for licenses
    const getFutureDate = (yearsAhead) => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + yearsAhead);
      return d;
    };

    const drivers = [
      {
        name: 'Marcus Thorne',
        licenseNumber: 'TX-9902-XJ',
        licenseCategory: 'Class A CDL',
        licenseExpiryDate: getFutureDate(2),
        contact: '(512) 555-0143',
        safetyScore: 98,
        status: 'Available',
        verificationStatus: 'Verified',
        licensePhotoUrl: '/uploads/license-placeholder.png' // Starts verified
      },
      {
        name: 'Helena Carter',
        licenseNumber: 'CA-5881-AS',
        licenseCategory: 'Class B CDL',
        licenseExpiryDate: getFutureDate(1),
        contact: '(213) 555-0182',
        safetyScore: 92,
        status: 'Available',
        verificationStatus: 'Verified',
        licensePhotoUrl: '/uploads/license-placeholder.png' // Starts verified
      },
      {
        name: 'Devon Miller',
        licenseNumber: 'NY-7721-OP',
        licenseCategory: 'Hazardous Mat',
        licenseExpiryDate: getFutureDate(3),
        contact: '(917) 555-0109',
        safetyScore: 78,
        status: 'Off Duty',
        verificationStatus: 'Pending',
        licensePhotoUrl: null // Starts unverified without photo to demo Safety Officer upload/approve flow
      }
    ];

    const seededDrivers = await Driver.insertMany(drivers);
    console.log(`Seeded ${seededDrivers.length} drivers successfully.`);

    // Create a default placeholder image for testing
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads', { recursive: true });
    }
    // Create a simple dummy text file pretending to be a PNG
    fs.writeFileSync('./uploads/license-placeholder.png', 'DUMMY_LICENSE_PHOTO_DATA');

    // Seed some historical maintenance logs for the vehicle TRK-12
    const cascadia = seededVehicles.find(v => v.regNumber === 'TRK-12');
    const semi = seededVehicles.find(v => v.regNumber === 'TRK-01');

    console.log('Seeding Maintenance Logs...');
    const maintenanceLogs = [
      {
        vehicleId: cascadia._id,
        description: 'Engine oil flush & transmission diagnostics',
        cost: 850,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'active'
      },
      {
        vehicleId: semi._id,
        description: 'Brake pad replacement (rear axles)',
        cost: 450,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: 'closed'
      }
    ];
    await MaintenanceLog.insertMany(maintenanceLogs);

    // Seed some historical fuel/other expenses
    console.log('Seeding Expenses & Fuel Logs...');
    await FuelLog.insertMany([
      {
        vehicleId: semi._id,
        liters: 120,
        cost: 240,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        vehicleId: semi._id,
        liters: 95,
        cost: 190,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]);

    await Expense.insertMany([
      {
        vehicleId: semi._id,
        type: 'toll',
        amount: 35,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ]);

    // Seed a completed trip to calculate fuel efficiency / ROI
    const marcusDriver = seededDrivers.find(d => d.name === 'Marcus Thorne');
    const historicalTrip = new Trip({
      source: 'Houston Port Terminal A',
      destination: 'Dallas Logistics Hub C',
      vehicleId: semi._id,
      driverId: marcusDriver._id,
      cargoWeight: 14500,
      plannedDistance: 380,
      actualDistance: 380,
      status: 'Completed'
    });
    await historicalTrip.save();

    console.log('Database seeding successfully finished.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
