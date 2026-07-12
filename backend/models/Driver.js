import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  licenseCategory: {
    type: String,
    required: true,
    enum: ['Class A CDL', 'Class B CDL', 'Hazardous Mat'],
  },
  licenseExpiryDate: {
    type: Date,
    required: true,
  },
  contact: {
    type: String,
    required: true,
    trim: true,
  },
  safetyScore: {
    type: Number,
    required: true,
    default: 100, // safety score starts at 100
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
    default: 'Off Duty', // defaults to Off Duty until verified and active
  },
  licensePhotoUrl: {
    type: String,
    default: null,
  },
  verificationStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending',
  }
}, {
  timestamps: true,
});

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
