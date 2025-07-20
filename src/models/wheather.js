const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema({
  current: {
    type: String,
    enum: ["sunny", "cloudy", "rainy"],
    default: "sunny",
  },
  history: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      weather: {
        type: String,
        enum: ["sunny", "cloudy", "rainy"],
        default: "sunny",
      },
    },
  ],
});

module.exports = mongoose.model("Weather", weatherSchema);
