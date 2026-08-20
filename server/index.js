require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getPool } = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "CartCraft API is running" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT GETDATE() AS currentTime");
    res.json({ connected: true, dbTime: result.recordset[0].currentTime });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
