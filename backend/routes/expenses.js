import express from 'express';
import FuelLog from '../models/FuelLog.js';
import Expense from '../models/Expense.js';
import MaintenanceLog from '../models/MaintenanceLog.js';
import Vehicle from '../models/Vehicle.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

// @route   GET /api/expenses/fuel
// @desc    Get all fuel logs
// @access  Authenticated
router.get('/fuel', async (req, res) => {
  try {
    const logs = await FuelLog.find().populate('vehicleId').sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving fuel logs' });
  }
});

// @route   POST /api/expenses/fuel
// @desc    Log fuel purchase
// @access  Authenticated (Financial Analyst / Driver / Fleet Manager)
router.post('/fuel', async (req, res) => {
  try {
    const { vehicleId, liters, cost, date } = req.body;

    if (!vehicleId || !liters || !cost) {
      return res.status(400).json({ message: 'Vehicle, liters, and cost are required' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const log = new FuelLog({
      vehicleId,
      liters,
      cost,
      date: date || Date.now()
    });

    await log.save();
    const populated = await FuelLog.findById(log._id).populate('vehicleId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error logging fuel' });
  }
});

// @route   GET /api/expenses/other
// @desc    Get all non-fuel expenses
// @access  Authenticated
router.get('/other', async (req, res) => {
  try {
    const expenses = await Expense.find().populate('vehicleId').sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving expenses' });
  }
});

// @route   POST /api/expenses/other
// @desc    Log other expense (tolls, parking, etc.)
// @access  Authenticated
router.post('/other', async (req, res) => {
  try {
    const { vehicleId, type, amount, date } = req.body;

    if (!vehicleId || !type || amount === undefined) {
      return res.status(400).json({ message: 'Vehicle, type, and amount are required' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const expense = new Expense({
      vehicleId,
      type,
      amount,
      date: date || Date.now()
    });

    await expense.save();
    const populated = await Expense.findById(expense._id).populate('vehicleId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error logging expense' });
  }
});

// @route   GET /api/expenses/vehicle/:vehicleId/total
// @desc    Get total operational cost per vehicle (Fuel + Maintenance + Other)
// @access  Authenticated
router.get('/vehicle/:vehicleId/total', async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // 1. Calculate Fuel Cost
    const fuelLogs = await FuelLog.find({ vehicleId });
    const totalFuelCost = fuelLogs.reduce((acc, log) => acc + log.cost, 0);
    const totalLiters = fuelLogs.reduce((acc, log) => acc + log.liters, 0);

    // 2. Calculate Maintenance Cost
    const maintenanceLogs = await MaintenanceLog.find({ vehicleId });
    const totalMaintenanceCost = maintenanceLogs.reduce((acc, log) => acc + log.cost, 0);

    // 3. Calculate Other Expenses (tolls, other)
    const otherExpenses = await Expense.find({ vehicleId });
    const totalOtherCost = otherExpenses.reduce((acc, exp) => acc + exp.amount, 0);

    const grandTotal = totalFuelCost + totalMaintenanceCost + totalOtherCost;

    res.json({
      vehicle: {
        id: vehicle._id,
        name: vehicle.name,
        regNumber: vehicle.regNumber,
      },
      fuel: {
        totalCost: totalFuelCost,
        totalLiters: totalLiters,
      },
      maintenance: {
        totalCost: totalMaintenanceCost,
      },
      other: {
        totalCost: totalOtherCost,
      },
      totalOperationalCost: grandTotal
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error compiling vehicle operational cost' });
  }
});

export default router;
