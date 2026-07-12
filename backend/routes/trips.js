import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

// @route   GET /api/trips
// @desc    Get all trips
// @access  Authenticated
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const trips = await Trip.find(filter)
      .populate('vehicleId')
      .populate('driverId')
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving trips' });
  }
});

// @route   GET /api/trips/:id
// @desc    Get trip details
// @access  Authenticated
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicleId')
      .populate('driverId');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving trip details' });
  }
});

// @route   POST /api/trips
// @desc    Create a new trip (Draft or Dispatched)
// @access  Authenticated (Dispatcher/Fleet Manager)
router.post('/', async (req, res) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status } = req.body;

    if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Fetch vehicle and driver
    const vehicle = await Vehicle.findById(vehicleId);
    const driver = await Driver.findById(driverId);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Business Rule 5: Cargo Weight must not exceed vehicle max load capacity
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({ 
        message: `Cargo weight (${cargoWeight} kg) exceeds vehicle's max load capacity (${vehicle.maxLoadCapacity} kg)` 
      });
    }

    const tripStatus = status || 'Draft';

    if (tripStatus === 'Dispatched') {
      // Business Rule 2 & 9: Vehicle must be Available
      if (vehicle.status !== 'Available') {
        return res.status(400).json({ message: `Vehicle is currently ${vehicle.status} and cannot be dispatched` });
      }

      // Business Rule 3 & 11: Driver verification, license expiry, and status checks
      if (driver.verificationStatus !== 'Verified') {
        return res.status(400).json({ message: 'Driver license must be verified before trip dispatch' });
      }
      if (driver.status !== 'Available') {
        return res.status(400).json({ message: `Driver status is currently ${driver.status} and cannot be dispatched` });
      }
      if (new Date(driver.licenseExpiryDate) < new Date()) {
        return res.status(400).json({ message: 'Cannot dispatch driver with an expired license' });
      }

      // Business Rule 6: Dispatching a trip -> vehicle and driver status become On Trip
      vehicle.status = 'On Trip';
      driver.status = 'On Trip';

      await vehicle.save();
      await driver.save();
    }

    const newTrip = new Trip({
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight,
      plannedDistance,
      status: tripStatus
    });

    await newTrip.save();
    
    const populated = await Trip.findById(newTrip._id).populate('vehicleId').populate('driverId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating trip' });
  }
});

// @route   PUT /api/trips/:id/status
// @desc    Update trip status (Lifecycle transitions)
// @access  Authenticated
router.put('/:id/status', async (req, res) => {
  try {
    const { status, actualDistance } = req.body; // 'Dispatched', 'Completed', 'Cancelled'
    
    if (!['Dispatched', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const driver = await Driver.findById(trip.driverId);

    if (!vehicle || !driver) {
      return res.status(404).json({ message: 'Associated vehicle or driver not found' });
    }

    // Validation based on status transitions
    if (status === 'Dispatched') {
      if (trip.status !== 'Draft') {
        return res.status(400).json({ message: 'Can only dispatch a trip that is in Draft status' });
      }

      if (vehicle.status !== 'Available') {
        return res.status(400).json({ message: `Vehicle is ${vehicle.status} and cannot be dispatched` });
      }
      if (driver.verificationStatus !== 'Verified') {
        return res.status(400).json({ message: 'Driver license must be Verified before dispatch' });
      }
      if (driver.status !== 'Available') {
        return res.status(400).json({ message: `Driver is ${driver.status} and cannot be dispatched` });
      }
      if (new Date(driver.licenseExpiryDate) < new Date()) {
        return res.status(400).json({ message: 'Cannot dispatch driver with an expired license' });
      }

      trip.status = 'Dispatched';
      vehicle.status = 'On Trip';
      driver.status = 'On Trip';
    } 
    
    else if (status === 'Completed') {
      if (trip.status !== 'Dispatched') {
        return res.status(400).json({ message: 'Can only complete a trip that is currently Dispatched' });
      }

      trip.status = 'Completed';
      trip.actualDistance = actualDistance || trip.plannedDistance;
      
      // Revert status to Available
      vehicle.status = 'Available';
      driver.status = 'Available';

      // Increment vehicle odometer
      vehicle.odometer += trip.actualDistance;
    } 
    
    else if (status === 'Cancelled') {
      if (!['Draft', 'Dispatched'].includes(trip.status)) {
        return res.status(400).json({ message: 'Cannot cancel a trip that is already completed or cancelled' });
      }

      // If it was dispatched, restore vehicle and driver to Available
      if (trip.status === 'Dispatched') {
        vehicle.status = 'Available';
        driver.status = 'Available';
      }

      trip.status = 'Cancelled';
    }

    await vehicle.save();
    await driver.save();
    await trip.save();

    const populated = await Trip.findById(trip._id).populate('vehicleId').populate('driverId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating trip status' });
  }
});

export default router;
