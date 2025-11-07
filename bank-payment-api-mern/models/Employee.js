import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name must not exceed 100 characters']
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
  role: {
    type: String,
    enum: ['Employee', 'Manager', 'Admin'],
    default: 'Employee'
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
employeeSchema.index({ username: 1, isActive: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
