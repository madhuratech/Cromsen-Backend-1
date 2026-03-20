const mongoose = require('mongoose');
const Order = require('../models/Order');
const mockDB = require('../mockDB');
const path = require('path');

const CLEANUP_INTERVAL = 1000 * 60 * 60; // Run every hour

const cleanupOrders = async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (mongoose.connection.readyState !== 1) {
      // Mock DB logic
      const initialLength = mockDB.orders.length;
      mockDB.orders = mockDB.orders.filter(o => {
        const createdAt = new Date(o.createdAt);
        // Abandoned older than 24h
        if (o.status === 'Abandoned' && createdAt < oneDayAgo) return false;
        return true;
      });
      if (mockDB.orders.length !== initialLength) {
        mockDB.save(path.join(__dirname, '../data/orders.json'), mockDB.orders);
        console.log(`[Order Cleanup] Removed ${initialLength - mockDB.orders.length} orders from MockDB.`);
      }
      return;
    }

    // Mongoose DB logic
    const abandonedRes = await Order.deleteMany({
      status: 'Abandoned',
      createdAt: { $lt: oneDayAgo }
    });
    
    if (abandonedRes.deletedCount > 0) {
      console.log(`[Order Cleanup] Removed ${abandonedRes.deletedCount} abandoned orders.`);
    }

  } catch (err) {
    console.error('[Order Cleanup] Error:', err.message);
  }
};

exports.startOrderCleanup = () => {
  console.log('[Order Cleanup] Service started.');
  // Run immediately on start
  cleanupOrders();
  // Schedule
  setInterval(cleanupOrders, CLEANUP_INTERVAL);
};
