const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ["veg", "non-veg"],
      required: true,
    },
    addedBy: {
      type: String,
      required: true,
    },
    specialInstructions: {
      type: String,
      default: "",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    modifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
); // Ensure each item has a unique _id

const orderSchema = new mongoose.Schema(
  {
    groupId: {
      type: String, //foreign key
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "cancelled",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderBy: {
      type: String,
      required: true, // The admin who places the final order
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 30,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving
orderSchema.pre("save", function (next) {
  // Calculate subtotal
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // Calculate service charge (10%)
  this.serviceCharge = Math.round(this.totalAmount * 0.1);

  // Calculate tax (18%)
  this.tax = Math.round(this.totalAmount * 0.18);

  // Calculate final amount
  this.finalAmount =
    this.totalAmount + this.serviceCharge + this.tax - this.discount;

  next();
});

// Index for faster queries
orderSchema.index({ groupId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
