const app = require("./app");
const { connectToDatabase } = require("./db");

const port = Number(process.env.PORT) || 5001;

// Vercel detects and invokes the exported Express application. Only start a
// listener when this file is run directly for local development.
if (require.main === module) {
  connectToDatabase()
    .then(() => {
      app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch((error) => {
      console.error("Mongo connection error:", error);
      process.exit(1);
    });
}

module.exports = app;
