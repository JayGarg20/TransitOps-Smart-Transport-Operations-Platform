import express from 'express';
import Driver from '../models/Driver.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';
import { uploadLicense } from '../middleware/upload.js';
import path from 'path';

const router = express.Router();

// Apply auth to all endpoints
router.use(verifyToken);

// @route   GET /api/drivers
// @desc    Get all drivers
// @access  Authenticated
router.get('/', async (req, res) => {
  try {
    const { status, verificationStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving drivers' });
  }
});

// @route   GET /api/drivers/:id
// @desc    Get driver details
// @access  Authenticated
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving driver details' });
  }
});

// @route   POST /api/drivers
// @desc    Create a new driver profile (Onboard)
// @access  Fleet Manager
router.post('/', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contact, safetyScore } = req.body;

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contact) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const uppercaseLicense = licenseNumber.trim().toUpperCase();
    const existing = await Driver.findOne({ licenseNumber: uppercaseLicense });
    if (existing) {
      return res.status(400).json({ message: 'Driver with this license number already exists' });
    }

    const newDriver = new Driver({
      name,
      licenseNumber: uppercaseLicense,
      licenseCategory,
      licenseExpiryDate,
      contact,
      safetyScore: safetyScore || 100,
      status: 'Off Duty', // Defaults to Off Duty until verified and manually enabled
      verificationStatus: 'Pending'
    });

    await newDriver.save();
    res.status(201).json(newDriver);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating driver profile' });
  }
});

// @route   PUT /api/drivers/:id
// @desc    Update driver profile details
// @access  Fleet Manager
router.put('/:id', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contact, safetyScore, status } = req.body;

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (licenseNumber) {
      const uppercaseLicense = licenseNumber.trim().toUpperCase();
      if (uppercaseLicense !== driver.licenseNumber) {
        const existing = await Driver.findOne({ licenseNumber: uppercaseLicense });
        if (existing) {
          return res.status(400).json({ message: 'Driver with this license number already exists' });
        }
        driver.licenseNumber = uppercaseLicense;
      }
    }

    // Business Rule Check: Driver cannot be set to Available unless Verified
    if (status === 'Available' && driver.verificationStatus !== 'Verified') {
      return res.status(400).json({ 
        message: 'Driver cannot be set to Available until their license verification status is Verified' 
      });
    }

    if (name !== undefined) driver.name = name;
    if (licenseCategory !== undefined) driver.licenseCategory = licenseCategory;
    if (licenseExpiryDate !== undefined) driver.licenseExpiryDate = licenseExpiryDate;
    if (contact !== undefined) driver.contact = contact;
    if (safetyScore !== undefined) driver.safetyScore = safetyScore;
    if (status !== undefined) driver.status = status;

    await driver.save();
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating driver profile' });
  }
});

// @route   PATCH /api/drivers/:id/verify
// @desc    Verify driver license photo (Safety Officer)
// @access  Safety Officer
router.patch('/:id/verify', authorizeRoles('Safety Officer'), async (req, res) => {
  try {
    const { verificationStatus } = req.body; // 'Verified' or 'Rejected' or 'Pending'

    if (!['Pending', 'Verified', 'Rejected'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.verificationStatus = verificationStatus;
    
    // If rejected or pending, auto-revert status to Off Duty/Suspended
    if (verificationStatus === 'Rejected') {
      driver.status = 'Suspended';
    } else if (verificationStatus === 'Pending') {
      driver.status = 'Off Duty';
    }

    await driver.save();
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error changing verification status' });
  }
});

// @route   POST /api/drivers/:id/upload
// @desc    Upload driver's license photo
// @access  Authenticated
router.post('/:id/upload', (req, res) => {
  uploadLicense(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a license image file' });
    }

    try {
      const driver = await Driver.findById(req.params.id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Authorize: Fleet Manager or the Driver themselves
      const isManager = req.user.role === 'Fleet Manager';
      const isSelf = req.user.role === 'Driver' && req.user.name.toLowerCase() === driver.name.toLowerCase();
      if (!isManager && !isSelf) {
        return res.status(403).json({ message: 'Unauthorized to modify this driver profile' });
      }

      // Save file relative path
      const filePath = `/uploads/${req.file.filename}`;
      driver.licensePhotoUrl = filePath;
      driver.verificationStatus = 'Pending'; // Uploading reset status to Pending
      driver.status = 'Off Duty'; // Force off duty until approved again

      await driver.save();
      res.json({
        message: 'License photo uploaded successfully',
        licensePhotoUrl: filePath,
        driver
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error saving license photo reference' });
    }
  });
});

export default router;
