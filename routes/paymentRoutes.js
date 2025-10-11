const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get user's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        proposal: {
          include: {
            job: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Create a new payment (escrow)
router.post('/escrow', auth, async (req, res) => {
  try {
    const { proposalId, amount } = req.body;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        type: 'ESCROW',
        proposalId,
        userId: req.user.id
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Release payment to freelancer
router.post('/release/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        proposal: {
          include: { job: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        type: 'RELEASE'
      }
    });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to release payment' });
  }
});

// Request refund
router.post('/refund/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        proposal: {
          include: { job: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        type: 'REFUND'
      }
    });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router; 