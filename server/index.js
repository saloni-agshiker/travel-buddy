const app = require("./app");
const { connectToDatabase } = require("./db");

const port = Number(process.env.PORT) || 5001;

connectToDatabase()
  .then(() => {
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((error) => {
    console.error("Mongo connection error:", error);
    process.exit(1);
  });
