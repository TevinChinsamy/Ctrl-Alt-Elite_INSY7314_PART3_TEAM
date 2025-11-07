import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  customerUsername: {
    type: String,
    required: [true, 'Customer username is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [999999999.99, 'Amount exceeds maximum limit']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    length: [3, 'Currency must be exactly 3 characters']
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    trim: true
  },
  payeeFullName: {
    type: String,
    required: [true, 'Payee full name is required'],
    trim: true
  },
  payeeAccountNumber: {
    type: String,
    required: [true, 'Payee account number is required'],
    trim: true
  },
  payeeBankName: {
    type: String,
    required: [true, 'Payee bank name is required'],
    trim: true
  },
  swiftCode: {
    type: String,
    required: [true, 'SWIFT code is required'],
    uppercase: true,
    trim: true,
    minlength: [8, 'SWIFT code must be 8 or 11 characters'],
    maxlength: [11, 'SWIFT code must be 8 or 11 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Submitted', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  verifiedByUsername: {
    type: String
  },
  verifiedAt: {
    type: Date
  },
  submittedToSwiftAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ customerUsername: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
