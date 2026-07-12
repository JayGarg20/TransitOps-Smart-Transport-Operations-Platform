import express from 'express';
import MaintenanceLog from '../models/MaintenanceLog.js';
import Vehicle from '../models/Vehicle.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

// @route   GET /api/maintenance
// @desc    Get all maintenance logs
// @access  Authenticated
router.get('/', async (req, res) => {
  try {
    const logs = await MaintenanceLog.find()
      .populate('vehicleId')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving maintenance logs' });
  }
});

// @route   POST /api/maintenance
// @desc    Create a new active maintenance log
// @access  Fleet Manager
router.post('/', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    const { vehicleId, description, cost, startDate } = req.body;

    if (!vehicleId || !description || cost === undefined) {
      return res.status(400).json({ message: 'Vehicle, description and cost are required' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot place a vehicle in maintenance while it is on a trip' });
    }

    // Create the log
    const log = new MaintenanceLog({
      vehicleId,
      description,
      cost,
      startDate: startDate || Date.now(),
      status: 'active'
    });
    await log.save();

    // Auto-update vehicle status to In Shop
    vehicle.status = 'In Shop';
    await vehicle.save();

    const populated = await MaintenanceLog.findById(log._id).populate('vehicleId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating maintenance record' });
  }
});

// @route   PUT /api/maintenance/:id/close
// @desc    Close an active maintenance log
// @access  Fleet Manager
router.put('/:id/close', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    const { cost, endDate } = req.body;

    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (log.status === 'closed') {
      return res.status(400).json({ message: 'Maintenance record is already closed' });
    }

    log.status = 'closed';
    log.endDate = endDate || Date.now();
    if (cost !== undefined) {
      log.cost = cost;
    }
    await log.save();

    // Auto-restore vehicle status to Available (unless it has been Retired)
    const vehicle = await Vehicle.findById(log.vehicleId);
    if (vehicle && vehicle.status === 'In Shop') {
      vehicle.status = 'Available';
      await vehicle.save();
    }

    const populated = await MaintenanceLog.findById(log._id).populate('vehicleId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error closing maintenance record' });
  }
});

export default router;
