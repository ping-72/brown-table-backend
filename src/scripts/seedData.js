const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const Admin = require("../models/Admin");
const User = require("../models/User");
const Group = require("../models/Group");
const Order = require("../models/Order");
const Table = require("../models/table");
const MenuItem = require("../models/MenuItem");
const Weather = require("../models/wheather");

// Connect to MongoDB
const connectDB = require("../config/database");

const seedData = async () => {
  try {
    await connectDB();
    console.log("🔄 Connected to MongoDB");

    // Clear existing data
    await Admin.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
    await Order.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Weather.deleteMany({});

    console.log("🧹 Cleared existing data");

    // Seed Admin Data - Create admins individually to trigger password hashing
    const admin1 = new Admin({
      username: "admin",
      password: "admin123",
      email: "admin@browntable.com",
      name: "Restaurant Manager",
      role: "admin",
      permissions: [
        "manage_reservations",
        "manage_orders",
        "manage_tables",
        "view_reports",
      ],
      avatar: "👨‍💼",
      phone: "+91-9876543210",
      department: "Management",
    });
    await admin1.save();

    const admin2 = new Admin({
      username: "superadmin",
      password: "super123",
      email: "superadmin@browntable.com",
      name: "Super Administrator",
      role: "super_admin",
      permissions: [
        "manage_reservations",
        "manage_orders",
        "manage_tables",
        "view_reports",
        "manage_users",
        "manage_admins",
      ],
      avatar: "👑",
      phone: "+91-9876543211",
      department: "Administration",
    });
    await admin2.save();

    const admins = [admin1, admin2];
    console.log("✅ Admin data seeded:", admins.length, "admins");

    // Seed Users
    const userData = [
      {
        // id: "user_001",
        name: "John Doe",
        phone: "9876543210",
        password: "password123",
        avatar: "J",
        color: "bg-blue-500",
      },
      {
        // id: "user_002",
        name: "Jane Smith",
        phone: "9876543211",
        password: "password123",
        avatar: "J",
        color: "bg-green-500",
      },
      {
        // id: "user_003",
        name: "Mike Johnson",
        phone: "9876543212",
        password: "password123",
        avatar: "M",
        color: "bg-red-500",
      },
      {
        // id: "user_004",
        name: "Sarah Wilson",
        phone: "9876543213",
        password: "password123",
        avatar: "S",
        color: "bg-yellow-500",
      },
      {
        // id: "user_005",
        name: "David Brown",
        phone: "9876543214",
        password: "password123",
        avatar: "D",
        color: "bg-purple-500",
      },
    ];

    // Create users individually to trigger password hashing
    const users = [];
    for (const userDataItem of userData) {
      const user = new User(userDataItem);
      await user.save();
      users.push(user);
    }
    console.log("✅ User data seeded:", users.length, "users");

    // Seed Tables
    const tableData = [];
    for (let i = 1; i <= 12; i++) {
      const capacity = i <= 4 ? 4 : i <= 8 ? 6 : 8;
      const status = ["free", "reserved", "occupied"][
        Math.floor(Math.random() * 3)
      ];
      const currentGuests =
        status === "occupied" ? Math.floor(Math.random() * capacity) + 1 : 0;

      tableData.push({
        number: i,
        capacity,
        status,
        currentGuests,
        location: i <= 8 ? "indoor" : "outdoor",
        section: i <= 4 ? "main" : i <= 8 ? "window" : "garden",
        isActive: true,
      });
    }

    const tables = await Table.insertMany(tableData);
    console.log("✅ Table data seeded:", tables.length, "tables");

    // Seed Menu Items
    const menuData = [
      {
        // id: "menu_001",
        name: "Cappuccino",
        price: 12.99,
        type: "veg",
        category: "Beverages",
        section: "Hot Drinks",
        description: "Rich espresso with steamed milk and foam",
        image:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
      },
      {
        // id: "menu_002",
        name: "Latte",
        price: 14.99,
        type: "veg",
        category: "Beverages",
        section: "Hot Drinks",
        description: "Smooth espresso with steamed milk",
        image:
          "https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg",
      },
      {
        // id: "menu_003",
        name: "Croissant",
        price: 8.99,
        type: "veg",
        category: "Pastries",
        section: "Breakfast",
        description: "Buttery, flaky French pastry",
        image:
          "https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg",
      },
      {
        // id: "menu_004",
        name: "Chicken Sandwich",
        price: 16.99,
        type: "non-veg",
        category: "Sandwiches",
        section: "Main Course",
        description: "Grilled chicken with fresh vegetables",
        image:
          "https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg",
      },
      {
        // id: "menu_005",
        name: "Caesar Salad",
        price: 13.99,
        type: "veg",
        category: "Salads",
        section: "Appetizers",
        description: "Fresh romaine lettuce with Caesar dressing",
        image:
          "https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg",
      },
    ];

    const menuItems = await MenuItem.insertMany(menuData);
    console.log("✅ Menu data seeded:", menuItems.length, "items");

    // Seed Groups
    const groupData = [
      {
        // id: "group_001",
        name: "John's Birthday Party",
        groupAdminId: users[0].id,
        inviteCode: "BDAY001",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "7:00 PM",
        departureTime: "9:00 PM",
        // table: "3",
        status: "active",
        discount: 10,
        groupMembers: [
          {
            userId: users[0].id,
            name: users[0].name,
            avatar: users[0].avatar,
            color: users[0].color,
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: users[1].id,
            name: users[1].name,
            avatar: users[1].avatar,
            color: users[1].color,
            hasAccepted: true,
          },
          {
            userId: users[2].id,
            name: users[2].name,
            avatar: users[2].avatar,
            color: users[2].color,
            hasAccepted: false,
          },
        ],
      },
      {
        // id: "group_002",
        name: "Business Meeting",
        groupAdminId: users[1].id,
        inviteCode: "BIZ002",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "6:30 PM",
        departureTime: "8:30 PM",
        status: "active",
        discount: 5,
        groupMembers: [
          {
            userId: users[1].id,
            name: users[1].name,
            avatar: users[1].avatar,
            color: users[1].color,
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: users[3].id,
            name: users[3].name,
            avatar: users[3].avatar,
            color: users[3].color,
            hasAccepted: true,
          },
        ],
      },
      {
        // id: "group_003",
        name: "Family Dinner",
        groupAdminId: users[2].id,
        inviteCode: "FAM003",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "8:00 PM",
        departureTime: "10:00 PM",
        // table: "8",
        status: "active",
        discount: 15,
        groupMembers: [
          {
            userId: users[2].id,
            name: users[2].name,
            avatar: users[2].avatar,
            color: users[2].color,
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: users[4].id,
            name: users[4].name,
            avatar: users[4].avatar,
            color: users[4].color,
            hasAccepted: true,
          },
        ],
      },
      {
        // id: "group_004",
        name: "Coffee Club Meetup",
        groupAdminId: users[3].id,
        inviteCode: "COFFEE004",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "3:00 PM",
        departureTime: "5:00 PM",
        status: "active",
        discount: 0,
        groupMembers: [
          {
            userId: users[3].id,
            name: users[3].name,
            avatar: users[3].avatar,
            color: users[3].color,
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: users[0].id,
            name: users[0].name,
            avatar: users[0].avatar,
            color: users[0].color,
            hasAccepted: true,
          },
        ],
      },
      {
        // id: "group_005",
        name: "Study Group",
        groupAdminId: users[4].id,
        inviteCode: "STUDY005",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "2:00 PM",
        departureTime: "4:00 PM",
        status: "active",
        discount: 5,
        groupMembers: [
          {
            userId: users[4].id,
            name: users[4].name,
            avatar: users[4].avatar,
            color: users[4].color,
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: users[1].id,
            name: users[1].name,
            avatar: users[1].avatar,
            color: users[1].color,
            hasAccepted: true,
          },
        ],
      },
    ];

    const groups = await Group.insertMany(groupData);
    console.log("✅ Group data seeded:", groups.length, "groups");

    // Seed Pending Reservation Requests
    const pendingReservationData = [
      {
        // id: "pending_001",
        name: "Anniversary Celebration",
        groupAdminId: "guest_001",
        inviteCode: "ANN001",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "7:30 PM",
        departureTime: "9:30 PM",
        // table: "2",
        status: "pending",
        discount: 0,
        guestName: "Robert & Lisa Chen",
        guestCount: 4,
        phone: "+91-9876543220",
        specialRequests: "Window seat preferred, anniversary cake",
        groupMembers: [
          {
            userId: "guest_001",
            name: "Robert Chen",
            avatar: "R",
            color: "bg-pink-500",
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: "guest_002",
            name: "Lisa Chen",
            avatar: "L",
            color: "bg-pink-500",
            hasAccepted: true,
          },
          {
            userId: "guest_003",
            name: "Emma Chen",
            avatar: "E",
            color: "bg-pink-500",
            hasAccepted: false,
          },
          {
            userId: "guest_004",
            name: "Alex Chen",
            avatar: "A",
            color: "bg-pink-500",
            hasAccepted: false,
          },
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        // id: "pending_002",
        name: "Corporate Team Lunch",
        groupAdminId: "guest_005",
        inviteCode: "CORP002",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "12:30 PM",
        departureTime: "2:00 PM",
        // table: "6",
        status: "pending",
        discount: 10,
        guestName: "Tech Solutions Inc.",
        guestCount: 8,
        phone: "+91-9876543221",
        specialRequests: "Quiet area for business discussion, separate bills",
        groupMembers: [
          {
            userId: "guest_005",
            name: "Sarah Johnson",
            avatar: "S",
            color: "bg-blue-500",
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: "guest_006",
            name: "Michael Brown",
            avatar: "M",
            color: "bg-blue-500",
            hasAccepted: true,
          },
          {
            userId: "guest_007",
            name: "Emily Davis",
            avatar: "E",
            color: "bg-blue-500",
            hasAccepted: true,
          },
          {
            userId: "guest_008",
            name: "David Wilson",
            avatar: "D",
            color: "bg-blue-500",
            hasAccepted: false,
          },
          {
            userId: "guest_009",
            name: "Jennifer Lee",
            avatar: "J",
            color: "bg-blue-500",
            hasAccepted: false,
          },
          {
            userId: "guest_010",
            name: "Chris Taylor",
            avatar: "C",
            color: "bg-blue-500",
            hasAccepted: false,
          },
          {
            userId: "guest_011",
            name: "Amanda Garcia",
            avatar: "A",
            color: "bg-blue-500",
            hasAccepted: false,
          },
          {
            userId: "guest_012",
            name: "Ryan Martinez",
            avatar: "R",
            color: "bg-blue-500",
            hasAccepted: false,
          },
        ],
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        // id: "pending_003",
        name: "Birthday Party",
        groupAdminId: "guest_013",
        inviteCode: "BDAY003",
        date: new Date().toISOString().split("T")[0],
        arrivalTime: "7:00 AM",
        departureTime: "8:00 AM",
        // table: "10",
        status: "confirmed",
        discount: 15,
        guestName: "Sophia's Sweet 16",
        guestCount: 12,
        phone: "+91-9876543222",
        specialRequests: "Birthday decorations, cake service, music setup",
        groupMembers: [
          {
            userId: "guest_013",
            name: "Sophia Rodriguez",
            avatar: "S",
            color: "bg-purple-500",
            isAdmin: true,
            hasAccepted: true,
          },
          {
            userId: "guest_014",
            name: "Maria Rodriguez",
            avatar: "M",
            color: "bg-purple-500",
            hasAccepted: true,
          },
          {
            userId: "guest_015",
            name: "Isabella Smith",
            avatar: "I",
            color: "bg-purple-500",
            hasAccepted: true,
          },
          {
            userId: "guest_016",
            name: "Olivia Johnson",
            avatar: "O",
            color: "bg-purple-500",
            hasAccepted: true,
          },
          {
            userId: "guest_017",
            name: "Ava Williams",
            avatar: "A",
            color: "bg-purple-500",
            hasAccepted: false,
          },
          {
            userId: "guest_018",
            name: "Mia Brown",
            avatar: "M",
            color: "bg-purple-500",
            hasAccepted: false,
          },
          {
            userId: "guest_019",
            name: "Layla Davis",
            avatar: "L",
            color: "bg-purple-500",
            hasAccepted: false,
          },
          {
            userId: "guest_020",
            name: "Zoe Miller",
            avatar: "Z",
            color: "bg-purple-500",
            hasAccepted: false,
          },
          {
            userId: "guest_021",
            name: "Chloe Wilson",
            avatar: "C",
            color: "bg-purple-500",
            hasAccepted: false,
          },
          {
            userId: "guest_022",
            name: "Ella Moore",
            avatar: "E",
            color: "bg-purple-500",
            hasAccepted: false,
          },
          {
            userId: "guest_023",
            name: "Aria Taylor",
            avatar: "A",
            color: "bg-purple-500",
            hasAccepted: false,
          },
          {
            userId: "guest_024",
            name: "Scarlett Anderson",
            avatar: "S",
            color: "bg-purple-500",
            hasAccepted: false,
          },
        ],
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    ];

    const pendingReservations = await Group.insertMany(pendingReservationData);
    console.log(
      "✅ Pending reservation requests seeded:",
      pendingReservations.length,
      "requests"
    );

    // Seed Orders with proper timestamps for upcoming orders testing
    const now = new Date();
    const orderData = [
      {
        // id: "order_001",
        groupId: groups[0].id,
        orderBy: users[0].id,
        items: [
          {
            id: menuItems[0].id,
            name: menuItems[0].name,
            price: menuItems[0].price,
            quantity: 2,
            type: menuItems[0].type,
            addedBy: users[0].id,
            specialInstructions: "Extra hot",
          },
          {
            id: menuItems[2].id,
            name: menuItems[2].name,
            price: menuItems[2].price,
            quantity: 1,
            type: menuItems[2].type,
            addedBy: users[1].id,
            specialInstructions: "",
          },
        ],
        status: "pending",
        estimatedTime: 25, // Will be ready in 25 minutes
        createdAt: new Date(now.getTime() - 5 * 60 * 1000), // Ordered 5 minutes ago
      },
      {
        // id: "order_002",
        groupId: groups[1].id,
        orderBy: users[1].id,
        items: [
          {
            id: menuItems[1].id,
            name: menuItems[1].name,
            price: menuItems[1].price,
            quantity: 1,
            type: menuItems[1].type,
            addedBy: users[1].id,
            specialInstructions: "No foam",
          },
          {
            id: menuItems[4].id,
            name: menuItems[4].name,
            price: menuItems[4].price,
            quantity: 1,
            type: menuItems[4].type,
            addedBy: users[3].id,
            specialInstructions: "Dressing on the side",
          },
        ],
        status: "preparing",
        estimatedTime: 15, // Will be ready in 15 minutes
        createdAt: new Date(now.getTime() - 15 * 60 * 1000), // Ordered 15 minutes ago
      },
      {
        // id: "order_003",
        groupId: groups[2].id,
        orderBy: users[2].id,
        items: [
          {
            id: menuItems[3].id,
            name: menuItems[3].name,
            price: menuItems[3].price,
            quantity: 2,
            type: menuItems[3].type,
            addedBy: users[2].id,
            specialInstructions: "Well done",
          },
          {
            id: menuItems[0].id,
            name: menuItems[0].name,
            price: menuItems[0].price,
            quantity: 1,
            type: menuItems[0].type,
            addedBy: users[4].id,
            specialInstructions: "",
          },
        ],
        status: "ready",
        estimatedTime: 5, // Will be ready in 5 minutes
        createdAt: new Date(now.getTime() - 25 * 60 * 1000), // Ordered 25 minutes ago
      },
      {
        // id: "order_004",
        groupId: groups[3].id,
        orderBy: users[3].id,
        items: [
          {
            id: menuItems[0].id,
            name: menuItems[0].name,
            price: menuItems[0].price,
            quantity: 3,
            type: menuItems[0].type,
            addedBy: users[3].id,
            specialInstructions: "Extra strong",
          },
          {
            id: menuItems[3].id,
            name: menuItems[3].name,
            price: menuItems[3].price,
            quantity: 1,
            type: menuItems[3].type,
            addedBy: users[0].id,
            specialInstructions: "Medium rare",
          },
        ],
        status: "pending",
        estimatedTime: 20, // Will be ready in 20 minutes
        createdAt: new Date(now.getTime() - 10 * 60 * 1000), // Ordered 10 minutes ago
      },
      {
        // id: "order_005",
        groupId: groups[4].id,
        orderBy: users[4].id,
        items: [
          {
            id: menuItems[2].id,
            name: menuItems[2].name,
            price: menuItems[2].price,
            quantity: 2,
            type: menuItems[2].type,
            addedBy: users[4].id,
            specialInstructions: "Warm",
          },
          {
            id: menuItems[1].id,
            name: menuItems[1].name,
            price: menuItems[1].price,
            quantity: 1,
            type: menuItems[1].type,
            addedBy: users[1].id,
            specialInstructions: "Extra foam",
          },
        ],
        status: "served", // This won't show in upcoming orders
        estimatedTime: 30,
        createdAt: new Date(now.getTime() - 60 * 60 * 1000), // Ordered 1 hour ago
      },
    ];

    const orders = await Order.insertMany(orderData);
    console.log("✅ Order data seeded:", orders.length, "orders");

    // Update tables with current reservations
    await Table.findByIdAndUpdate(tables[2]._id, {
      status: "occupied",
      currentGuests: 3,
      currentReservation: {
        groupId: groups[0]._id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        guestCount: 3,
      },
    });

    await Table.findByIdAndUpdate(tables[4]._id, {
      status: "reserved",
      currentReservation: {
        groupId: groups[1]._id,
        startTime: new Date(Date.now() + 30 * 60 * 1000),
        endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
        guestCount: 2,
      },
    });

    await Table.findByIdAndUpdate(tables[7]._id, {
      status: "occupied",
      currentGuests: 2,
      currentReservation: {
        groupId: groups[2]._id,
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
        guestCount: 2,
      },
    });

    console.log("✅ Table reservations updated");

    // Seed Weather Data
    const weatherData = {
      current: "sunny",
      history: [
        {
          date: new Date(),
          weather: "sunny",
        },
      ],
    };

    const weather = await Weather.create(weatherData);
    console.log("✅ Weather data seeded");

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   👥 Admins: ${admins.length}`);
    console.log(`   👤 Users: ${users.length}`);
    console.log(`   🍽️ Tables: ${tables.length}`);
    console.log(`   📋 Menu Items: ${menuItems.length}`);
    console.log(`   👥 Groups: ${groups.length}`);
    console.log(`   🛒 Orders: ${orders.length}`);
    console.log(`   🌤️ Weather: 1 record`);

    console.log("\n🔑 Admin Login Credentials:");
    console.log("   Username: admin, Password: admin123");
    console.log("   Username: superadmin, Password: super123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run seeding
seedData();
