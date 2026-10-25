const express = require("express");
const jwt = require("jsonwebtoken");
const Trip = require("../models/Trip");

const ALL_DESTINATION_VALUES = new Set(["ALL", "All Destinations"]);
const ALL_TRANSPORT_MODE_VALUES = new Set(["ALL", "All Transport Modes", "All transport modes"]);

// creates mini Express app (group of routes related to authentication)
const router = express.Router();

// simple authentication/verification middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// GETS the trips with destination dest and/or transport mode mode (that do not belong to current user)
router.get("/filter", requireAuth, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized"});
        }

        const query = {
            userId: { $ne: req.userId }
        }

        if (req.query.dest && !ALL_DESTINATION_VALUES.has(req.query.dest)) {
            query.depAirport = req.query.dest;
        };

        if (req.query.mode && !ALL_TRANSPORT_MODE_VALUES.has(req.query.mode)) {
            query.transportMode = req.query.mode;
        };
        const trips = await Trip.find(query).populate("userId", "name email bio residence college");
        return res.json(trips);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error"});
    }
});

// GETS the trips with transport mode mode (that do not belong to current user)
router.get("/filterByMode", requireAuth, async (req, res) => {
  try {    
      const { mode } = req.query;
      if (!mode) {
          return res.status(400).json({ message: "Transport mode is required" });
      }
      if (!req.userId) {
          return res.status(401).json({ message: "Unauthorized"});
      }
      const trips = await Trip.find({ 
          userId: { $ne: req.userId },
          transportMode: mode,
      })
      .populate("userId", "name email bio residence college");
      return res.json(trips);
  } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error"});
  }
});

// GETS the trips associated that have not occurred yet (for all destinations & all transport modes)
router.get("/allMatches", requireAuth, async (req, res) => {
    try {
        if (!req.userId) {
          return res.status(401).json({ message: "Unauthorized"});
        }
        const today = new Date();
        const trips = await Trip.find({ 
          userId: { $ne: req.userId },
          depAt: { $gt: today }
        }).sort( { depAt: 1 }).populate("userId", "name email bio residence college");
        return res.json(trips);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

module.exports = router;
