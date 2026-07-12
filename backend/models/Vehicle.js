import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Heavy Duty Truck', 'Van', 'EV Dispatch'],
  },
  maxLoadCapacity: {
    type: Number,
    required: true, // in kg
  },
  odometer: {
    type: Number,
    required: true,
    default: 0,
  },
  acquisitionCost: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available',
  }
}, {
  timestamps: true,
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
