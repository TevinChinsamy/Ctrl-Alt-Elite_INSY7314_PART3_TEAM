import express from 'express';
import Payment from '../models/Payment.js';
import validator from '../utils/validators.js';
import { authenticateToken, requireEmployee } from '../middleware/auth.js';

const router = express.Router();

// All routes require employee authentication
router.use(authenticateToken);
router.use(requireEmployee);

/**
 * GET /api/employee/portal/pending-payments
 * Get all pending payments awaiting verification
 */
router.get('/pending-payments', async (req, res) => {
  try {
    const payments = await Payment.find({
      status: 'Pending'
    })
    .populate('customerId', 'fullName accountNumber')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending payments.'
    });
  }
});

/**
 * GET /api/employee/portal/verified-payments
 * Get all verified payments ready for SWIFT submission
 */
router.get('/verified-payments', async (req, res) => {
  try {
    const payments = await Payment.find({
      status: 'Verified'
    })
    .populate('customerId', 'fullName accountNumber')
    .sort({ verifiedAt: -1 });

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('Get verified payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verified payments.'
    });
  }
});

/**
 * GET /api/employee/portal/all-payments
 * Get all payments with optional status filter
 */
router.get('/all-payments', async (req, res) => {
  try {
    const { status } = req.query;

    const filter = status ? { status } : {};

    const payments = await Payment.find(filter)
      .populate('customerId', 'fullName accountNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments.'
    });
  }
});

/**
 * POST /api/employee/portal/verify-payment
 * Verify a payment (marks it as verified)
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!validator.isValidObjectId(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format.'
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    if (payment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Payment cannot be verified. Current status: ${payment.status}`
      });
    }

    // Update payment status
    payment.status = 'Verified';
    payment.verifiedBy = req.user.userId;
    payment.verifiedByUsername = req.user.username;
    payment.verifiedAt = new Date();

    await payment.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment.'
    });
  }
});

/**
 * POST /api/employee/portal/submit-to-swift
 * Submit all verified payments to SWIFT
 */
router.post('/submit-to-swift', async (req, res) => {
  try {
    // Find all verified payments
    const verifiedPayments = await Payment.find({
      status: 'Verified'
    });

    if (verifiedPayments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No verified payments to submit.'
      });
    }

    // Update all verified payments to submitted status
    const submittedAt = new Date();

    await Payment.updateMany(
      { status: 'Verified' },
      {
        $set: {
          status: 'Submitted',
          submittedToSwiftAt: submittedAt
        }
      }
    );

    res.json({
      success: true,
      message: `Successfully submitted ${verifiedPayments.length} payment(s) to SWIFT`,
      count: verifiedPayments.length
    });

  } catch (error) {
    console.error('Submit to SWIFT error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit payments to SWIFT.'
    });
  }
});

/**
 * POST /api/employee/portal/reject-payment
 * Reject a payment
 */
router.post('/reject-payment', async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!validator.isValidObjectId(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format.'
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    if (payment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Payment cannot be rejected. Current status: ${payment.status}`
      });
    }

    // Update payment status
    payment.status = 'Rejected';
    payment.verifiedBy = req.user.userId;
    payment.verifiedByUsername = req.user.username;
    payment.verifiedAt = new Date();

    await payment.save();

    res.json({
      success: true,
      message: 'Payment rejected successfully',
      payment
    });

  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment.'
    });
  }
});

export default router;
