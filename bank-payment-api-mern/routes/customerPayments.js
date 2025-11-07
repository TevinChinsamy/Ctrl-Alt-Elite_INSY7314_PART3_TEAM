import express from 'express';
import Payment from '../models/Payment.js';
import validator from '../utils/validators.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/customer/payments/create
 * Create a new international payment
 */
router.post('/create', async (req, res) => {
  try {
    const { amount, currency, provider, payeeFullName, payeeAccountNumber, payeeBankName, swiftCode } = req.body;

    // Validate amount
    if (!validator.isValidAmount(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Must be between 0.01 and 999,999,999.99.'
      });
    }

    // Validate currency
    if (!validator.isValidCurrency(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency code. Must be 3 uppercase letters (e.g., USD, EUR).'
      });
    }

    // Validate provider
    if (!validator.isValidProvider(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider name.'
      });
    }

    // Validate payee full name
    if (!validator.isValidFullName(payeeFullName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payee full name.'
      });
    }

    // Validate payee account number
    if (!validator.isValidAccountNumber(payeeAccountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payee account number.'
      });
    }

    // Validate payee bank name
    if (!validator.isValidBankName(payeeBankName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payee bank name.'
      });
    }

    // Validate SWIFT code
    if (!validator.isValidSwiftCode(swiftCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SWIFT code. Must be 8 or 11 uppercase characters.'
      });
    }

    // Create payment
    const payment = new Payment({
      customerId: req.user.userId,
      customerUsername: req.user.username,
      amount,
      currency: currency.toUpperCase(),
      provider,
      payeeFullName,
      payeeAccountNumber,
      payeeBankName,
      swiftCode: swiftCode.toUpperCase(),
      status: 'Pending'
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      paymentId: payment._id
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment. Please try again.'
    });
  }
});

/**
 * GET /api/customer/payments/my-payments
 * Get all payments for the authenticated customer
 */
router.get('/my-payments', async (req, res) => {
  try {
    const payments = await Payment.find({
      customerId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments.'
    });
  }
});

/**
 * GET /api/customer/payments/:id
 * Get a specific payment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format.'
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      customerId: req.user.userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment.'
    });
  }
});

export default router;
