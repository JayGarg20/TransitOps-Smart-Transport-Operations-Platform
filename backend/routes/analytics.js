import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import FuelLog from '../models/FuelLog.js';
import MaintenanceLog from '../models/MaintenanceLog.js';
import Expense from '../models/Expense.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

// Rate of revenue generated per kilometer for ROI calculation
const REVENUE_PER_KM = 3.00; // e.g. $3.00 per km

// @route   GET /api/analytics/dashboard
// @desc    Retrieve KPI dashboard statistics
// @access  Authenticated
router.get('/dashboard', async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: 'On Trip' });
    const availableVehicles = await Vehicle.countDocuments({ status: 'Available' });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: 'In Shop' });
    
    const activeTrips = await Trip.countDocuments({ status: 'Dispatched' });
    const pendingTrips = await Trip.countDocuments({ status: 'Draft' });
    
    // Drivers on duty = Available + On Trip
    const driversOnDuty = await Driver.countDocuments({ status: { $in: ['Available', 'On Trip'] } });

    // Fleet utilization = (Active Vehicles / Total Vehicles) * 100
    const fleetUtilization = totalVehicles > 0 
      ? Math.round((activeVehicles / totalVehicles) * 1000) / 10 
      : 0;

    res.json({
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      totalVehicles
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error compiling dashboard metrics' });
  }
});

// @route   GET /api/analytics/reports
// @desc    Retrieve detailed vehicle efficiency and ROI report
// @access  Authenticated
router.get('/reports', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    const reportData = [];

    for (const vehicle of vehicles) {
      // 1. Get total distance from Completed trips
      const completedTrips = await Trip.find({ vehicleId: vehicle._id, status: 'Completed' });
      const totalDistance = completedTrips.reduce((acc, trip) => acc + (trip.actualDistance || trip.plannedDistance || 0), 0);

      // 2. Get total fuel logs
      const fuelLogs = await FuelLog.find({ vehicleId: vehicle._id });
      const totalLiters = fuelLogs.reduce((acc, log) => acc + log.liters, 0);
      const totalFuelCost = fuelLogs.reduce((acc, log) => acc + log.cost, 0);

      // 3. Get total maintenance costs
      const maintenanceLogs = await MaintenanceLog.find({ vehicleId: vehicle._id });
      const totalMaintenanceCost = maintenanceLogs.reduce((acc, log) => acc + log.cost, 0);

      // 4. Get other expenses (tolls/others)
      const expenses = await Expense.find({ vehicleId: vehicle._id });
      const totalOtherCost = expenses.reduce((acc, exp) => acc + exp.amount, 0);

      // Calculations
      const fuelEfficiency = totalLiters > 0 
        ? Math.round((totalDistance / totalLiters) * 100) / 100 
        : 0;

      const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherCost;
      
      // Revenue estimate = Distance * Rate
      const estimatedRevenue = totalDistance * REVENUE_PER_KM;

      // ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      // We also include other operational costs in calculation for higher accuracy
      const netProfit = estimatedRevenue - totalOperationalCost;
      const roiPercentage = vehicle.acquisitionCost > 0 
        ? Math.round((netProfit / vehicle.acquisitionCost) * 10000) / 100 
        : 0;

      reportData.push({
        vehicleId: vehicle._id,
        regNumber: vehicle.regNumber,
        name: vehicle.name,
        type: vehicle.type,
        status: vehicle.status,
        acquisitionCost: vehicle.acquisitionCost,
        totalDistance,
        totalLiters,
        totalFuelCost,
        totalMaintenanceCost,
        totalOtherCost,
        totalOperationalCost,
        estimatedRevenue,
        fuelEfficiency,
        roiPercentage
      });
    }

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Server error compiling reports data' });
  }
});

// @route   GET /api/analytics/reports/csv
// @desc    Export reports data as CSV
// @access  Authenticated
router.get('/reports/csv', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    let csvContent = 'Registration Number,Vehicle Name,Type,Status,Acquisition Cost,Total Distance (km),Fuel Consumed (Liters),Fuel Cost,Maintenance Cost,Other Expenses,Total Operational Cost,Estimated Revenue,Fuel Efficiency (km/L),ROI (%)\n';

    for (const vehicle of vehicles) {
      const completedTrips = await Trip.find({ vehicleId: vehicle._id, status: 'Completed' });
      const totalDistance = completedTrips.reduce((acc, trip) => acc + (trip.actualDistance || trip.plannedDistance || 0), 0);

      const fuelLogs = await FuelLog.find({ vehicleId: vehicle._id });
      const totalLiters = fuelLogs.reduce((acc, log) => acc + log.liters, 0);
      const totalFuelCost = fuelLogs.reduce((acc, log) => acc + log.cost, 0);

      const maintenanceLogs = await MaintenanceLog.find({ vehicleId: vehicle._id });
      const totalMaintenanceCost = maintenanceLogs.reduce((acc, log) => acc + log.cost, 0);

      const expenses = await Expense.find({ vehicleId: vehicle._id });
      const totalOtherCost = expenses.reduce((acc, exp) => acc + exp.amount, 0);

      const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : '0.00';
      const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherCost;
      const estimatedRevenue = totalDistance * REVENUE_PER_KM;
      
      const netProfit = estimatedRevenue - totalOperationalCost;
      const roiPercentage = vehicle.acquisitionCost > 0 
        ? ((netProfit / vehicle.acquisitionCost) * 100).toFixed(2) 
        : '0.00';

      csvContent += `${vehicle.regNumber},"${vehicle.name}",${vehicle.type},${vehicle.status},${vehicle.acquisitionCost},${totalDistance},${totalLiters},${totalFuelCost},${totalMaintenanceCost},${totalOtherCost},${totalOperationalCost},${estimatedRevenue},${fuelEfficiency},${roiPercentage}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transitops_fleet_report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error generating CSV report' });
  }
});

export default router;
