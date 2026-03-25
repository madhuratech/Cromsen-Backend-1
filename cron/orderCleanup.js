const mongoose = require('mongoose');
const Order = require('../models/Order');

const CLEANUP_INTERVAL = 1000 * 60 * 60; // Run every hour

const cleanupOrders = async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
  cleanupOrders();
  setInterval(cleanupOrders, CLEANUP_INTERVAL);
};
