const mongoose = require("mongoose");

let connectionPromise;

function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (connectionPromise) return connectionPromise;

  if (!process.env.MONGODB_URI) {
    return Promise.reject(new Error("MONGODB_URI is not configured"));
  }

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 })
    .catch((error) => {
      connectionPromise = undefined;
      throw error;
    });

  return connectionPromise;
}

module.exports = { connectToDatabase };
