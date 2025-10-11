const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get available connect packages
router.get('/packages', async (req, res) => {
  try {
    const packages = [
      {
        id: 1,
        name: "Starter",
        connects: 10,
        price: 100,
        description: "Perfect for getting started",
        features: [
          "10 Connects",
          "Valid for 6 months",
          "Basic support",
          "Standard processing time"
        ]
      },
      {
        id: 2,
        name: "Professional",
        connects: 40,
        price: 350,
        description: "Best for regular job seekers",
        features: [
          "40 Connects",
          "Valid for 6 months",
          "Priority support",
          "Faster processing time",
          "20% savings"
        ]
      },
      {
        id: 3,
        name: "Enterprise",
        connects: 80,
        price: 600,
        description: "For power users",
        features: [
          "80 Connects",
          "Valid for 6 months",
          "24/7 Premium support",
          "Instant processing",
          "30% savings"
        ]
      }
    ];

    res.json(packages);
  } catch (error) {
    console.error('Error fetching connect packages:', error);
    res.status(500).json({ error: 'Failed to fetch connect packages' });
  }
});

// Purchase connects
router.post('/purchase', auth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;

    // Get the package details
    const packages = [
      { id: 1, connects: 10, price: 100 },
      { id: 2, connects: 40, price: 350 },
      { id: 3, connects: 80, price: 600 }
    ];

    const selectedPackage = packages.find(p => p.id === packageId);
    if (!selectedPackage) {
      return res.status(400).json({ error: 'Invalid package selected' });
    }

    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: selectedPackage.price,
        currency: 'EGP',
        status: 'PENDING',
        type: 'CONNECT_PURCHASE',
        metadata: {
          packageId,
          connects: selectedPackage.connects
        }
      }
    });

    // TODO: Integrate with payment gateway (e.g., Stripe, PayPal)
    // For now, we'll simulate a successful payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' }
    });

    // Add connects to user's account
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        connects: {
          increment: selectedPackage.connects
        }
      }
    });

    res.json({
      success: true,
      payment: updatedPayment,
      connects: user.connects
    });
  } catch (error) {
    console.error('Error purchasing connects:', error);
    res.status(500).json({ error: 'Failed to purchase connects' });
  }
});

module.exports = router; 