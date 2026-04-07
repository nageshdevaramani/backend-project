const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Simple API
app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from Backend",
    time: new Date()
  });
});

app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, name: "Nagesh" },
    { id: 2, name: "DevOps Engineer" }
  ]);
});
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});