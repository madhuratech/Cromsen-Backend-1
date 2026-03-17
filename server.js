"use strict";

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
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

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/subcategories", subCategoryRoutes);

// Serve static files in production (optional)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../client/dist/index.html"))
  );
}

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cromsen";

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

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedMainAdmin();
  })
  .catch((err) => {
    console.error('MongoDB connection error (continuing in mock mode):', err.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
