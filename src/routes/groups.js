const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Group = require("../models/Group");
const User = require("../models/User");
const Order = require("../models/Order");
const generateId = require("../utils/generateId");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// GET /api/groups/my-groups - Get all groups for authenticated user
router.get("/my-groups", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Find all groups where user is either admin or member
    const groups = await Group.find({
      $or: [{ groupAdminId: user.id }, { "groupMembers.userId": user.id }],
    }).sort({ createdAt: -1 });

    // Get order data for each group
    const groupsWithOrders = await Promise.all(
      groups.map(async (group) => {
        const order = await Order.findOne({
          groupId: group._id.toString(),
        }).sort({
          createdAt: -1,
        });

        // Calculate member count and user's role
        const memberCount = group.groupMembers.length;
        const isAdmin = group.groupAdminId === user.id;
        const userMember = group.groupMembers.find(
          (member) => member.userId === user.id
        );

        return {
          id: group._id,
          name: group.name,
          groupAdminId: group.groupAdminId,
          inviteCode: group.inviteCode,
          arrivalTime: group.arrivalTime,
          departureTime: group.departureTime,
          date: group.date,
          table: group.table,
          discount: group.discount,
          status: group.status,
          restaurant: group.restaurant,
          memberCount,
          maxMembers: group.maxMembers,
          isAdmin,
          userRole: isAdmin ? "admin" : "member",
          groupMembers: group.groupMembers,
          order: order
            ? {
                id: order.id,
                totalAmount: order.totalAmount,
                finalAmount: order.finalAmount,
                status: order.status,
                itemCount: order.items.length,
              }
            : null,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        groups: groupsWithOrders,
        count: groupsWithOrders.length,
      },
    });
  } catch (error) {
    console.error("Get user groups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user groups",
      error: error.message,
    });
  }
});

// POST /api/groups/create-group - Create a new group
router.post("/create-group", async (req, res) => {
  try {
    const {
      adminName,
      adminId,
      arrivalTime,
      departureTime,
      date,
      guestCount = 1,
    } = req.body;

    // Validation
    if (!adminName || !adminId || !arrivalTime || !departureTime || !date) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: adminName, adminId, arrivalTime, departureTime, date",
      });
    }

    // Generate unique invite code
    const inviteCode = generateId(8);

    // Create or find admin user
    let adminUser = await User.findById(adminId);
    if (!adminUser) {
      // Create a guest user for group creation
      adminUser = new User({
        name: adminName,
        avatar: adminName.charAt(0).toUpperCase(),
        color: "bg-blue-500",
        // phone and password are optional now
      });
      await adminUser.save();
    }

    // Create group
    const group = new Group({
      name: `${adminName}'s Group Order`,
      groupAdminId: adminUser._id.toString(), // Convert to string to match schema
      inviteCode,
      arrivalTime,
      departureTime,
      date,
      groupMembers: [
        {
          userId: adminUser._id.toString(), // Convert to string
          name: adminName,
          avatar: adminUser.avatar,
          color: adminUser.color,
          isAdmin: true,
          hasAccepted: true,
        },
      ],
      maxMembers: Math.max(guestCount, 10),
    });

    await group.save();

    // Create initial empty order for the group
    const order = new Order({
      groupId: group._id.toString(), // Convert to string to match schema
      items: [],
      totalAmount: 0,
      orderBy: adminUser._id.toString(), // Convert to string
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: {
        group: {
          id: group._id,
          name: group.name,
          groupAdminId: group.groupAdminId,
          inviteCode: group.inviteCode,
          arrivalTime: group.arrivalTime,
          departureTime: group.departureTime,
          date: group.date,
          groupMembers: group.groupMembers,
          inviteLink: `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/join?code=${group.inviteCode}`,
        },
        orderId: order._id,
      },
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create group",
      error: error.message,
    });
  }
});

// GET /api/groups/:groupId - Get group details
router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          groupAdminId: group.groupAdminId,
          arrivalTime: group.arrivalTime,
          departureTime: group.departureTime,
          date: group.date,
          table: group.table,
          discount: group.discount,
          groupMembers: group.groupMembers,
          status: group.status,
          inviteLink: `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/join?code=${group.inviteCode}`,
        },
      },
    });
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get group details",
      error: error.message,
    });
  }
});

// PUT /api/groups/:groupId/update - Update group details
router.put("/:groupId/update", async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "arrivalTime",
      "departureTime",
      "date",
      "table",
      "discount",
    ];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        group[field] = updates[field];
      }
    });

    await group.save();

    res.json({
      success: true,
      message: "Group updated successfully",
      data: { group },
    });
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update group",
      error: error.message,
    });
  }
});

// GET /api/groups/:groupId/group-order - Get group order details
router.get("/:groupId/group-order", async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const order = await Order.findOne({ groupId: group._id.toString() }).sort({
      createdAt: -1,
    });

    // Group items by member
    const itemsByMember = {};
    group.groupMembers.forEach((member) => {
      itemsByMember[member.userId] = {
        member,
        items: order
          ? order.items.filter(
              (item) =>
                item.addedBy === member.userId ||
                item.addedBy === member.userId.toString()
            )
          : [],
      };
    });

    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          groupAdminId: group.groupAdminId,
          groupMembers: group.groupMembers,
          arrivalTime: group.arrivalTime,
          departureTime: group.departureTime,
          table: group.table,
          discount: group.discount,
        },
        order: order
          ? {
              id: order._id,
              items: order.items,
              totalAmount: order.totalAmount,
              serviceCharge: order.serviceCharge,
              tax: order.tax,
              finalAmount: order.finalAmount,
              status: order.status,
            }
          : null,
        itemsByMember,
      },
    });
  } catch (error) {
    console.error("Get group order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get group order",
      error: error.message,
    });
  }
});

// DELETE /api/groups/:groupId - Delete a group
router.delete("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if the user is a member of the group (either admin or regular member)
    const isMember = group.groupMembers.some(
      (member) => member.userId === userId
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only group members can delete the group",
      });
    }

    // Delete associated orders
    await Order.deleteMany({ groupId: group._id.toString() });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete group",
      error: error.message,
    });
  }
});

module.exports = router;
