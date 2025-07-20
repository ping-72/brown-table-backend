const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: false,
  },
  groupAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: false,
  },
  totalBill: {
    type: Number,
    required: false,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: false,
  },
  startTime: {
    type: Date,
    required: false,
  },
  endTime: {
    type: Date,
    required: false,
  },
  guestCount: {
    type: Number,
    required: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const tableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 2,
      max: 12,
    },
    status: {
      type: String,
      enum: ["free", "reserved", "occupied", "maintenance"],
      default: "free",
    },
    currentGuests: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      enum: ["indoor", "outdoor", "private"],
      default: "indoor",
    },
    section: {
      type: String,
      default: "main",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentReservation: {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: false,
      },
      startTime: {
        type: Date,
        required: false,
      },
      endTime: {
        type: Date,
        required: false,
      },
      guestCount: {
        type: Number,
        required: false,
      },
    },
    history: [historySchema],
    notes: {
      type: String,
      trim: true,
      required: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
tableSchema.index({ status: 1, isActive: 1 });
tableSchema.index({ number: 1 });

module.exports = mongoose.model("Table", tableSchema);
