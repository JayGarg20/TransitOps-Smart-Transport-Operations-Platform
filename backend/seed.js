import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Driver from './models/Driver.js';
import Trip from './models/Trip.js';
import MaintenanceLog from './models/MaintenanceLog.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('Connected. Cleaning existing data...');
    
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await MaintenanceLog.deleteMany({});
    
    console.log('Data cleared. Seeding Users...');
    const salt = await bcrypt.genSalt(10);
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

    console.log('Seeding Vehicles...');
    const vehiclesData = [
      {
        vin: 'VIN1002930492019',
        plateNumber: 'TX-882-B',
        model: 'Peterbilt 579 Semi-Truck',
        type: 'Heavy Truck',
        maxPayloadCapacity: 24000,
        fuelCapacity: 450,
        status: 'On Trip',
        insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      {
        vin: 'VIN9920381029304',
        plateNumber: 'CA-947-X',
        model: 'Freightliner Cascadia',
        type: 'Heavy Truck',
        maxPayloadCapacity: 26000,
        fuelCapacity: 500,
        status: 'In Shop',
        insuranceExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        vin: 'VIN3392019203940',
        plateNumber: 'FL-229-M',
        model: 'Ford F-550 Box Truck',
        type: 'Medium Duty',
        maxPayloadCapacity: 12000,
        fuelCapacity: 150,
        status: 'Available',
        insuranceExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];
    const insertedVehicles = await Vehicle.insertMany(vehiclesData);

    console.log('Seeding Drivers...');
    const driversData = [
      {
        name: 'Marcus Vance',
        licenseNumber: 'DL-TEX-99201',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        contact: '+1-555-0192',
        status: 'On Duty',
        verificationStatus: 'Verified'
      },
      {
        name: 'Janice Kowalski',
        licenseNumber: 'DL-CAL-38291',
        licenseExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        contact: '+1-555-0283',
        status: 'Off Duty',
        verificationStatus: 'Pending',
        licensePhotoUrl: '/uploads/demo_license.png'
      },
      {
        name: 'Dave Miller',
        licenseNumber: 'DL-FLA-44920',
        licenseExpiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        contact: '+1-555-0394',
        status: 'Suspended',
        verificationStatus: 'Rejected'
      }
    ];
    const insertedDrivers = await Driver.insertMany(driversData);

    console.log('Seeding Trips...');
    const trips = [
      {
        tripId: 'TRIP-9901',
        vehicleId: insertedVehicles[0]._id,
        driverId: insertedDrivers[0]._id,
        startLocation: 'Dallas Port Logistics',
        endLocation: 'Austin Industrial Park',
        plannedDistance: 195,
        actualDistance: 0,
        cargoWeight: 18500,
        status: 'Dispatched',
        startDate: new Date(),
        logs: [
          { message: 'Trip planned and registered.', timestamp: new Date(Date.now() - 600000) },
          { message: 'Vehicle and Driver assigned. Cargo locked.', timestamp: new Date(Date.now() - 300000) },
          { message: 'Trip dispatched from Dallas Port.', timestamp: new Date() }
        ]
      }
    ];
    await Trip.insertMany(trips);

    console.log('Seeding Maintenance Logs...');
    const maintenance = [
      {
        vehicleId: insertedVehicles[1]._id,
        issueDescription: 'Scheduled engine diagnostics and front axle wear replacement',
        severity: 'Medium',
        status: 'Active',
        scheduledDate: new Date(),
        cost: 0,
        logs: [
          { message: 'Vehicle set to In Shop automatically.', timestamp: new Date() }
        ]
      }
    ];
    await MaintenanceLog.insertMany(maintenance);

    console.log('Database seeding successfully finished.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
