const mongoose = require("mongoose");
const SubCategorySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  image:    { type: String, default: "" },
}, { timestamps: true });
module.exports = mongoose.model("SubCategory", SubCategorySchema);
