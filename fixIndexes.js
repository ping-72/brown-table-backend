const mongoose = require("mongoose");
require("dotenv").config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/browntable"
    );
    console.log("📦 MongoDB Connected: localhost");

    const db = mongoose.connection.db;

    // Collections that might have id indexes
    const collections = [
      "users",
      "menuitems",
      "groups",
      "orders",
      "tables",
      "admins",
    ];

    for (const collectionName of collections) {
      console.log(`🔧 Checking ${collectionName} collection...`);

      // Drop id_1 index
      try {
        await db.collection(collectionName).dropIndex("id_1");
        console.log(`✅ Dropped id_1 index from ${collectionName} collection`);
      } catch (error) {
        console.log(
          `ℹ️ id_1 index doesn't exist in ${collectionName} collection`
        );
      }

      // Drop id index
      try {
        await db.collection(collectionName).dropIndex("id");
        console.log(`✅ Dropped id index from ${collectionName} collection`);
      } catch (error) {
        console.log(
          `ℹ️ id index doesn't exist in ${collectionName} collection`
        );
      }
    }

    console.log("🎯 All indexes fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing indexes:", error);
    process.exit(1);
  }
};

fixIndexes();
