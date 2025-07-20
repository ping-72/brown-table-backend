const express = require("express");
const { adminAuthMiddleware } = require("../middleware/auth");
const Group = require("../models/Group");
const Order = require("../models/Order");
const User = require("../models/User");
const Table = require("../models/table");

const router = express.Router();

// GET /api/admin/test - Test endpoint to verify data
router.get("/test", adminAuthMiddleware, async (req, res) => {
  try {
    const groups = await Group.find().limit(1);
    const orders = await Order.find().limit(1);
    const tables = await Table.find().limit(1);

    res.json({
      success: true,
      data: {
        groupsCount: groups.length,
        ordersCount: orders.length,
        tablesCount: tables.length,
        sampleGroup: groups[0] || null,
        sampleOrder: orders[0] || null,
        sampleTable: tables[0] || null,
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
    });
  }
});

// GET /api/admin/dashboard - Get admin dashboard data
router.get("/dashboard", adminAuthMiddleware, async (req, res) => {
  try {
    // Get all groups with their orders and members
    const groups = await Group.find().sort({ createdAt: -1 });

    // Get all orders
    const orders = await Order.find().sort({ createdAt: -1 });

    // Get all tables
    const tables = await Table.find({ isActive: true }).sort({ number: 1 });

    // Create a map of groups for easy lookup
    const groupsMap = {};
    groups.forEach((group) => {
      groupsMap[group.id] = group;
    });

    // Process data for dashboard
    const dashboardData = {
      tables: generateTableStatus(tables),
      reservations: processReservations(groups),
      upcomingOrders: processUpcomingOrders(orders, groupsMap),
      stats: {
        freeTables: tables.filter((t) => t.status === "free").length,
        reservedTables: tables.filter((t) => t.status === "reserved").length,
        occupiedTables: tables.filter((t) => t.status === "occupied").length,
        maintenanceTables: tables.filter((t) => t.status === "maintenance")
          .length,
        pendingRequests: groups.filter((g) => g.status === "pending").length,
        totalGroups: groups.length,
        totalOrders: orders.length,
        activeReservations: groups.filter((g) => g.status === "active").length,
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

// POST /api/admin/reservation/:groupId/confirm - Confirm reservation
router.post(
  "/reservation/:groupId/confirm",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { groupId } = req.params;

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Reservation not found",
        });
      }

      // Update group status to confirmed
      group.status = "confirmed";
      group.confirmedAt = new Date();

      // Update table status to reserved
      if (group.table) {
        const table = await Table.findOne({ number: group.table });
        if (table) {
          table.status = "reserved";
          table.currentReservation = {
            groupId: group._id,
            startTime: new Date(group.date + " " + group.arrivalTime),
            endTime: new Date(group.date + " " + group.departureTime),
            guestCount: group.guestCount || group.groupMembers.length,
          };
          table.lastUpdated = new Date();
          await table.save();
        }
      }

      await group.save();

      res.json({
        success: true,
        message: "Reservation confirmed successfully",
        data: { group },
      });
    } catch (error) {
      console.error("Confirm reservation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to confirm reservation",
        error: error.message,
      });
    }
  }
);

// POST /api/admin/reservation/:groupId/cancel - Cancel reservation
router.post(
  "/reservation/:groupId/cancel",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { groupId } = req.params;

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Reservation not found",
        });
      }

      // Update group status to cancelled
      group.status = "cancelled";
      group.cancelledAt = new Date();

      // Free up the table if it was reserved
      if (group.table) {
        const table = await Table.findOne({ number: group.table });
        if (table && table.status === "reserved") {
          table.status = "free";
          table.currentReservation = null;
          table.lastUpdated = new Date();
          await table.save();
        }
      }

      await group.save();

      res.json({
        success: true,
        message: "Reservation cancelled successfully",
        data: { group },
      });
    } catch (error) {
      console.error("Cancel reservation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel reservation",
        error: error.message,
      });
    }
  }
);

// POST /api/admin/order/:orderId/clear - Mark order as handled
router.post("/order/:orderId/clear", adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = "served";
    order.servedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Order marked as served",
      data: { order },
    });
  } catch (error) {
    console.error("Clear order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as served",
      error: error.message,
    });
  }
});

// PUT /api/admin/table/:tableId/status - Update table status
router.put("/table/:tableId/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status, currentGuests } = req.body;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // Validate status
    const validStatuses = ["free", "reserved", "occupied", "maintenance"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table status",
      });
    }

    // Update table status
    table.status = status;
    if (currentGuests !== undefined) {
      table.currentGuests = currentGuests;
    }
    table.lastUpdated = new Date();

    // Add to history if status changed
    if (table.status !== status) {
      table.history.push({
        groupId: null,
        groupAdminId: null,
        totalBill: 0,
        orderId: null,
        startTime: new Date(),
        endTime: null,
        guestCount: currentGuests || 0,
        updatedAt: new Date(),
      });
    }

    await table.save();

    res.json({
      success: true,
      message: "Table status updated successfully",
      data: { table },
    });
  } catch (error) {
    console.error("Update table status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update table status",
      error: error.message,
    });
  }
});

// GET /api/admin/tables - Get all tables
router.get("/tables", adminAuthMiddleware, async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ number: 1 });

    res.json({
      success: true,
      data: { tables },
    });
  } catch (error) {
    console.error("Get tables error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tables",
      error: error.message,
    });
  }
});

// GET /api/admin/upcoming-orders - Get upcoming orders for next 30 minutes
router.get("/upcoming-orders", adminAuthMiddleware, async (req, res) => {
  try {
    // Get all orders and groups
    const orders = await Order.find().sort({ createdAt: -1 });
    const groups = await Group.find();

    // Create a map of groups for easy lookup
    const groupsMap = {};
    groups.forEach((group) => {
      groupsMap[group.id] = group;
    });

    // Process upcoming orders
    const upcomingOrders = processUpcomingOrders(orders, groupsMap);

    res.json({
      success: true,
      data: { upcomingOrders },
    });
  } catch (error) {
    console.error("Get upcoming orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming orders",
      error: error.message,
    });
  }
});

// PUT /api/admin/order/:orderId/status - Update order status
router.put("/order/:orderId/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // Update order status
    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
});

// Helper functions
function generateTableStatus(tables) {
  // Use real table data from database
  const timeSlots = [
    {
      time: "5:00-6:15 PM",
      tables: tables.map((table) => ({
        id: table._id,
        number: table.number,
        status: table.status,
        capacity: table.capacity,
        currentGuests: table.currentGuests,
        location: table.location,
        section: table.section,
      })),
    },
    {
      time: "6:15-7:30 PM",
      tables: tables.map((table) => ({
        id: table._id,
        number: table.number,
        status: table.status,
        capacity: table.capacity,
        currentGuests: table.currentGuests,
        location: table.location,
        section: table.section,
      })),
    },
    {
      time: "7:30-8:45 PM",
      tables: tables.map((table) => ({
        id: table._id,
        number: table.number,
        status: table.status,
        capacity: table.capacity,
        currentGuests: table.currentGuests,
        location: table.location,
        section: table.section,
      })),
    },
    {
      time: "8:45-10:00 PM",
      tables: tables.map((table) => ({
        id: table._id,
        number: table.number,
        status: table.status,
        capacity: table.capacity,
        currentGuests: table.currentGuests,
        location: table.location,
        section: table.section,
      })),
    },
  ];

  return timeSlots;
}

function processReservations(groups) {
  return groups
    .filter((group) => group.status === "pending")
    .map((group) => ({
      id: group._id,
      guestName: group.guestName || group.adminId || "Unknown",
      guestCount: group.guestCount || group.groupMembers.length,
      reservationTime: group.arrivalTime,
      table: group.table,
      status: group.status,
      createdAt: group.createdAt,
      preOrderDetails: group.specialRequests || "No special requests",
      phone: group.phone || "N/A",
      members: group.groupMembers.map((member) => ({
        name: member.name || "Unknown",
        phone: group.phone || "N/A",
      })),
    }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function processUpcomingOrders(orders, groupsMap) {
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

  return orders
    .filter((order) => {
      // Calculate when the order will be ready based on estimated time
      const orderCreatedAt = new Date(order.createdAt);
      const estimatedReadyTime = new Date(
        orderCreatedAt.getTime() + (order.estimatedTime || 30) * 60 * 1000
      );

      // Include orders that will be ready within the next 30 minutes
      return (
        estimatedReadyTime >= now &&
        estimatedReadyTime <= thirtyMinutesFromNow &&
        order.status !== "served" &&
        order.status !== "cancelled"
      );
    })
    .map((order) => {
      const group = groupsMap[order.groupId];
      const orderCreatedAt = new Date(order.createdAt);
      const estimatedReadyTime = new Date(
        orderCreatedAt.getTime() + (order.estimatedTime || 30) * 60 * 1000
      );

      return {
        id: order._id,
        groupId: order.groupId,
        guestName: group?.guestName || group?.groupAdminId || "Unknown",
        table: group?.table || "N/A",
        orderSummary:
          order.items
            ?.map((item) => `${item.name} x${item.quantity}`)
            .join(", ") || "No items",
        totalAmount: order.finalAmount || 0,
        createdAt: order.createdAt,
        estimatedReadyTime: estimatedReadyTime,
        status: order.status || "pending",
        estimatedTime: order.estimatedTime || 30,
        items: order.items || [],
      };
    })
    .sort(
      (a, b) => new Date(a.estimatedReadyTime) - new Date(b.estimatedReadyTime)
    );
}

module.exports = router;
