import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name must not exceed 100 characters']
  },
  idNumber: {
    type: String,
    required: [true, 'ID number is required'],
    unique: true,
    trim: true,
    length: [13, 'ID number must be exactly 13 digits']
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    unique: true,
    trim: true,
    minlength: [10, 'Account number must be at least 10 digits'],
    maxlength: [16, 'Account number must not exceed 16 digits']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username must not exceed 50 characters']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  passwordSalt: {
    type: String,
    required: [true, 'Password salt is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
customerSchema.index({ username: 1, isActive: 1 });
customerSchema.index({ accountNumber: 1, isActive: 1 });
customerSchema.index({ idNumber: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
