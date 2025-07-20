const mongoose = require("mongoose");
const Admin = require("./src/models/Admin");
require("dotenv").config();

async function testAdmin() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/browntable"
    );
    console.log("Connected to MongoDB");

    const admins = await Admin.find();
    console.log("Admins in database:", admins.length);

    for (const admin of admins) {
      console.log("Admin:", {
        username: admin.username,
        email: admin.email,
        name: admin.name,
        isActive: admin.isActive,
      });

      // Test password comparison
      const isValid = await admin.comparePassword("admin123");
      console.log(
        "Password test for admin:",
        admin.username,
        "is valid:",
        isValid
      );
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
  }
}

testAdmin();
