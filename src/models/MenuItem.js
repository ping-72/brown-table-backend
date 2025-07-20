const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["veg", "non-veg"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
    },
    allergens: [
      {
        type: String,
      },
    ],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ type: 1 });
menuItemSchema.index({ section: 1 });
menuItemSchema.index({ isAvailable: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
