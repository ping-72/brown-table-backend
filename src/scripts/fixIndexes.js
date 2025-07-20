const mongoose = require("mongoose");
require("dotenv").config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/browntable"
    );
    console.log("📦 MongoDB Connected: localhost");

    const db = mongoose.connection.db;

    // Drop the problematic id index from users collection
    try {
      await db.collection("users").dropIndex("id_1");
      console.log("✅ Dropped id_1 index from users collection");
    } catch (error) {
      console.log("ℹ️ id_1 index doesn't exist or already dropped");
    }

    // Also try to drop any other id-related indexes
    try {
      await db.collection("users").dropIndex("id");
      console.log("✅ Dropped id index from users collection");
    } catch (error) {
      console.log("ℹ️ id index doesn't exist or already dropped");
    }

    console.log("🎯 Indexes fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing indexes:", error);
    process.exit(1);
  }
};

fixIndexes();
