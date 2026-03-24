"use strict";

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

// Ensure upload directories exist
const uploadDir = path.join(__dirname, "uploads/avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();


app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL,
    /\.vercel\.app$/, // Allow all vercel deployments for easy testing
  ].filter(Boolean),
  credentials: true,
}));
app.set('trust proxy', 1);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const addressRoutes = require("./routes/addressRoutes");
const homepageRoutes = require("./routes/homepageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const policyRoutes = require("./routes/policyRoutes");

app.use("/api/products", productRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/policies", policyRoutes);

// Serve static files in production (optional)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../Cromsen-Frontend/dist")));
  app.get(/.*/, (req, res) =>
    res.sendFile(path.resolve(__dirname, "../Cromsen-Frontend/dist/index.html"))
  );
}

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/cromsen";

const Admin = require("./models/Admin");
const seedMainAdmin = async () => {
  try {
    const mainAdminExists = await Admin.findOne({ role: "main" });
    if (!mainAdminExists) {
      await Admin.create({
        username: "Cromsen",
        password: "cromsen@123",
        role: "main"
      });
      console.log("Main Admin 'Cromsen' seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding Main Admin:", err);
  }
};

// Auto-cleanup job
const { startOrderCleanup } = require('./cron/orderCleanup');

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedMainAdmin();
    startOrderCleanup();
  })
  .catch((err) => {
    console.error('MongoDB connection error (continuing in mock mode):', err.message);
    startOrderCleanup();
  });

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
