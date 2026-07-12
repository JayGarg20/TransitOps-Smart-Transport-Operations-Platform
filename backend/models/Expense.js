import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['toll', 'other'],
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  }
}, {
  timestamps: true,
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
