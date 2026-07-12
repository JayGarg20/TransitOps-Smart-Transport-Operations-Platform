import express from 'express';
import Vehicle from '../models/Vehicle.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Apply auth token validation to all endpoints
router.use(verifyToken);

// @route   GET /api/vehicles
// @desc    Get all vehicles
// @access  Authenticated
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving vehicles' });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
// @access  Authenticated
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving vehicle details' });
  }
});

// @route   POST /api/vehicles
// @desc    Create a new vehicle
// @access  Fleet Manager
router.post('/', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    const { regNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;

    if (!regNumber || !name || !type || !maxLoadCapacity || !acquisitionCost) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const uppercaseReg = regNumber.trim().toUpperCase();
    const existing = await Vehicle.findOne({ regNumber: uppercaseReg });
    if (existing) {
      return res.status(400).json({ message: 'Vehicle registration number already exists' });
    }

    const newVehicle = new Vehicle({
      regNumber: uppercaseReg,
      name,
      type,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      status: status || 'Available'
    });

    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating vehicle' });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update a vehicle
// @access  Fleet Manager
router.put('/:id', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    const { regNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (regNumber) {
      const uppercaseReg = regNumber.trim().toUpperCase();
      if (uppercaseReg !== vehicle.regNumber) {
        const existing = await Vehicle.findOne({ regNumber: uppercaseReg });
        if (existing) {
          return res.status(400).json({ message: 'Vehicle registration number already exists' });
        }
        vehicle.regNumber = uppercaseReg;
      }
    }

    if (name !== undefined) vehicle.name = name;
    if (type !== undefined) vehicle.type = type;
    if (maxLoadCapacity !== undefined) vehicle.maxLoadCapacity = maxLoadCapacity;
    if (odometer !== undefined) vehicle.odometer = odometer;
    if (acquisitionCost !== undefined) vehicle.acquisitionCost = acquisitionCost;
    if (status !== undefined) vehicle.status = status;

    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating vehicle' });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete a vehicle
// @access  Fleet Manager
router.delete('/:id', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Check if vehicle is on a trip
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot delete vehicle currently on a trip' });
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting vehicle' });
  }
});

export default router;
