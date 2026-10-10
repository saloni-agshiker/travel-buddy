require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectToDatabase } = require("./db");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/users");
const tripRoutes = require("./routes/trips");
const browseRoutes = require("./routes/matches");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header include local tools and health checks.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      // Same-origin Vercel requests do not require CORS headers. Returning false
      // also lets browsers block unlisted cross-origin clients without turning a
      // valid API request into a server error.
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Vercel loads this module in a serverless function, so there is no persistent
// server startup hook at which to reliably open MongoDB. Connect lazily and
// reuse Mongoose's cached connection for later invocations.
app.use("/api", async (_req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Mongo connection error:", error);
    res.status(503).json({ message: "Database service is unavailable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", profileRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/matches", browseRoutes);

module.exports = app;
