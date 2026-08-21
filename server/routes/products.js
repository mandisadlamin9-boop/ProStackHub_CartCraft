const express = require("express");
const { sql, getPool } = require("../config/db");

const router = express.Router();

// GET /api/products - list all products, with optional search & category filter
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const pool = await getPool();

    let query = "SELECT * FROM products WHERE 1=1";
    const request = pool.request();

    if (search) {
      query += " AND name LIKE @search";
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    if (category) {
      query += " AND category = @category";
      request.input("category", sql.NVarChar, category);
    }

    query += " ORDER BY created_at DESC";

    const result = await request.query(query);
    res.json({ products: result.recordset });
  } catch (err) {
    console.error("List products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id - single product detail
router.get("/:id", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM products WHERE id = @id");

    const product = result.recordset[0];

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  } catch (err) {
    console.error("Get product error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

module.exports = router;
