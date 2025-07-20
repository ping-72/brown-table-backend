const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Make optional for guest users
      minlength: 6,
    },
    avatar: {
      type: String,
      default: function () {
        return this.name.charAt(0).toUpperCase();
      },
    },
    color: {
      type: String,
      default: "bg-blue-500",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["admin", "user", "superAdmin"],
      default: "user",
    },
    // For storing group invitations
    invites: [
      {
        groupId: String,
        groupName: String,
        invitedBy: String,
        invitedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // For storing pending group invitations
    pendingInvites: [
      {
        groupId: String,
        groupName: String,
        invitedBy: String,
        invitedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure avatar is set based on name if not provided
userSchema.pre("save", function (next) {
  if (!this.avatar && this.name) {
    this.avatar = this.name.charAt(0).toUpperCase();
  }
  next();
});

// Index for efficient phone lookup
userSchema.index({ phone: 1 });

module.exports = mongoose.model("User", userSchema);
