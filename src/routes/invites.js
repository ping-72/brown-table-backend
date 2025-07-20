const express = require("express");
const Group = require("../models/Group");
const User = require("../models/User");
const generateId = require("../utils/generateId");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// POST /api/invites/invite-member - Generate invite link
router.post("/invite-member", authMiddleware, async (req, res) => {
  try {
    const { groupId, adminId } = req.body;

    if (!groupId || !adminId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and Admin ID are required",
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is admin
    if (group.groupAdminId !== adminId) {
      return res.status(403).json({
        success: false,
        message: "Only group admin can generate invite links",
      });
    }

    const inviteLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/join?code=${group.inviteCode}`;

    res.json({
      success: true,
      message: "Invite link generated successfully",
      data: {
        inviteLink,
        inviteCode: group.inviteCode,
        groupName: group.name,
        expiresIn: process.env.INVITE_LINK_EXPIRES_IN || "168h",
      },
    });
  } catch (error) {
    console.error("Generate invite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate invite link",
      error: error.message,
    });
  }
});

// POST /api/invites/invite-user - Invite user by phone number
router.post("/invite-user", authMiddleware, async (req, res) => {
  try {
    const { groupId, phone } = req.body;
    const adminUser = req.user;

    if (!groupId || !phone) {
      return res.status(400).json({
        success: false,
        message: "Group ID and phone number are required",
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is admin
    if (group.groupAdminId !== adminUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only group admin can invite users",
      });
    }

    // Find user by phone
    const invitedUser = await User.findOne({ phone });
    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with this phone number",
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.groupMembers.some(
      (member) => member.userId === invitedUser._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      });
    }

    // Check if user already has a pending invite for this group
    const hasPendingInvite = invitedUser.pendingInvites.some(
      (invite) => invite.groupId === group._id.toString()
    );
    if (hasPendingInvite) {
      return res.status(400).json({
        success: false,
        message: "User already has a pending invite for this group",
      });
    }

    // Add pending invite to user
    invitedUser.pendingInvites.push({
      groupId: group._id.toString(),
      groupName: group.name,
      invitedBy: adminUser.name,
      invitedAt: new Date(),
    });
    await invitedUser.save();

    res.json({
      success: true,
      message: "User invited successfully",
      data: {
        invitedUser: {
          id: invitedUser._id,
          name: invitedUser.name,
          phone: invitedUser.phone,
          avatar: invitedUser.avatar,
          color: invitedUser.color,
        },
      },
    });
  } catch (error) {
    console.error("Invite user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to invite user",
      error: error.message,
    });
  }
});

// POST /api/invites/join - Join group using invite code
router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const user = req.user;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: "Invite code is required",
      });
    }

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code",
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.groupMembers.some(
      (member) => member.userId === user._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Add user to group
    group.groupMembers.push({
      userId: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      color: user.color,
      isAdmin: false,
      hasAccepted: true,
    });

    await group.save();

    // Remove pending invite if exists
    const inviteIndex = user.pendingInvites.findIndex(
      (invite) => invite.groupId === group._id.toString()
    );
    if (inviteIndex !== -1) {
      user.pendingInvites.splice(inviteIndex, 1);
      await user.save();
    }

    res.json({
      success: true,
      message: "Successfully joined the group",
      data: {
        group: {
          id: group._id,
          name: group.name,
          groupAdminId: group.groupAdminId,
          inviteCode: group.inviteCode,
          arrivalTime: group.arrivalTime,
          departureTime: group.departureTime,
          date: group.date,
          table: group.table,
          discount: group.discount,
          groupMembers: group.groupMembers,
        },
      },
    });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join group",
      error: error.message,
    });
  }
});

// GET /api/invites/group/:inviteCode - Get group info by invite code
router.get("/group/:inviteCode", async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code",
      });
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          arrivalTime: group.arrivalTime,
          departureTime: group.departureTime,
          date: group.date,
          memberCount: group.groupMembers.length,
        },
      },
    });
  } catch (error) {
    console.error("Get group by invite code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get group information",
      error: error.message,
    });
  }
});

// POST /api/invites/accept/:groupId - Accept group invitation
router.post("/accept/:groupId", authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const user = req.user;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user has pending invite
    const inviteIndex = user.pendingInvites.findIndex(
      (invite) => invite.groupId === group._id.toString()
    );
    if (inviteIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "No pending invite found for this group",
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.groupMembers.some(
      (member) => member.userId === user._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Add user to group
    group.groupMembers.push({
      userId: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      color: user.color,
      isAdmin: false,
      hasAccepted: true,
    });

    await group.save();

    // Remove pending invite
    user.pendingInvites.splice(inviteIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Successfully joined the group",
      data: {
        group: {
          id: group._id,
          name: group.name,
          groupAdminId: group.groupAdminId,
          inviteCode: group.inviteCode,
          arrivalTime: group.arrivalTime,
          departureTime: group.departureTime,
          date: group.date,
          table: group.table,
          discount: group.discount,
          groupMembers: group.groupMembers,
        },
      },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept invitation",
      error: error.message,
    });
  }
});

// GET /api/invites/notifications - Get user's pending invites
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        pendingInvites: user.pendingInvites,
        count: user.pendingInvites.length,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
      error: error.message,
    });
  }
});

module.exports = router;
