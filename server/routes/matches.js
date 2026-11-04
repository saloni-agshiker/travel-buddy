const express = require("express");
const jwt = require("jsonwebtoken");
const Trip = require("../models/Trip");
const User = require("../models/User");
const { rankUniqueTravellers } = require("../services/matchRanking");

const ALL_DESTINATION_VALUES = new Set(["ALL", "All Destinations"]);
const ALL_TRANSPORT_MODE_VALUES = new Set(["ALL", "All Transport Modes", "All transport modes"]);

// creates mini Express app (group of routes related to authentication)
const router = express.Router();

async function getRankedMatches(userId, filters = {}) {
  const now = new Date();
  const query = { userId: { $ne: userId }, ...filters };
  const [currentUser, currentUserTrips, candidateTrips] = await Promise.all([
    User.findById(userId).select("residence").lean(),
    Trip.find({ userId }).lean(),
    Trip.find(query).populate("userId", "name email bio residence college").lean(),
  ]);

  if (!currentUser) return null;

  const upcomingTrips = currentUserTrips.filter((trip) => new Date(trip.depAt) >= now);
  const previousTrips = currentUserTrips.filter((trip) => new Date(trip.depAt) < now);

  return rankUniqueTravellers(candidateTrips, {
    upcomingTrips,
    previousTrips,
    currentResidence: currentUser.residence,
  });
}

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

        const query = {};

        if (req.query.dest && !ALL_DESTINATION_VALUES.has(req.query.dest)) {
            query.depAirport = req.query.dest;
        };

        if (req.query.mode && !ALL_TRANSPORT_MODE_VALUES.has(req.query.mode)) {
            query.transportMode = req.query.mode;
        };
        const trips = await getRankedMatches(req.userId, query);
        if (!trips) return res.status(404).json({ message: "User not found" });
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
      const trips = await getRankedMatches(req.userId, { transportMode: mode });
      if (!trips) return res.status(404).json({ message: "User not found" });
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
        const trips = await getRankedMatches(req.userId, { depAt: { $gt: new Date() } });
        if (!trips) return res.status(404).json({ message: "User not found" });
        return res.json(trips);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

module.exports = router;
