const express = require("express");
const Weather = require("../models/wheather");

const router = express.Router();

// GET /api/weather/current - Get current weather
router.get("/current", async (req, res) => {
  try {
    let weather = await Weather.findOne();

    // If no weather record exists, create one with default sunny
    if (!weather) {
      weather = new Weather({
        current: "sunny",
        history: [
          {
            date: new Date(),
            weather: "sunny",
          },
        ],
      });
      await weather.save();
    }

    res.json({
      success: true,
      data: {
        current: weather.current,
        lastUpdated:
          weather.history[weather.history.length - 1]?.date || new Date(),
      },
    });
  } catch (error) {
    console.error("Get weather error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get weather",
      error: error.message,
    });
  }
});

// POST /api/weather/update - Update current weather
router.post("/update", async (req, res) => {
  try {
    const { weather } = req.body;

    // Validate weather type
    if (!["sunny", "cloudy", "rainy"].includes(weather)) {
      return res.status(400).json({
        success: false,
        message: "Invalid weather type. Must be sunny, cloudy, or rainy",
      });
    }

    let weatherDoc = await Weather.findOne();

    if (!weatherDoc) {
      weatherDoc = new Weather();
    }

    // Update current weather
    weatherDoc.current = weather;

    // Add to history
    weatherDoc.history.push({
      date: new Date(),
      weather: weather,
    });

    // Keep only last 100 history entries
    if (weatherDoc.history.length > 100) {
      weatherDoc.history = weatherDoc.history.slice(-100);
    }

    await weatherDoc.save();

    res.json({
      success: true,
      message: "Weather updated successfully",
      data: {
        current: weatherDoc.current,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("Update weather error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update weather",
      error: error.message,
    });
  }
});

// GET /api/weather/history - Get weather history
router.get("/history", async (req, res) => {
  try {
    const weather = await Weather.findOne();

    if (!weather) {
      return res.json({
        success: true,
        data: {
          history: [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        history: weather.history.slice(-10), // Last 10 entries
      },
    });
  } catch (error) {
    console.error("Get weather history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get weather history",
      error: error.message,
    });
  }
});

module.exports = router;
