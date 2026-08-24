require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getPool } = require("./config/db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const checkoutRoutes = require("./routes/checkout");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews");

const app = express();

app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === "/api/checkout/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

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
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
