import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true,
  },
  destination: {
    type: String,
    required: true,
    trim: true,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  cargoWeight: {
    type: Number,
    required: true, // in kg
  },
  plannedDistance: {
    type: Number,
    required: true, // in km
  },
  actualDistance: {
    type: Number, // in km, recorded upon completion
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft',
  }
}, {
  timestamps: true,
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
