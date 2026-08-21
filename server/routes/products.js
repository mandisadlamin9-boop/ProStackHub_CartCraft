const express = require("express");
const { sql, getPool } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

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

// POST /api/products - create a product (admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image_url, stock } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ error: "Name, price, and category are required" });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("description", sql.NVarChar, description || null)
      .input("price", sql.Decimal(10, 2), price)
      .input("category", sql.NVarChar, category)
      .input("image_url", sql.NVarChar, image_url || null)
      .input("stock", sql.Int, stock || 0)
      .query(`INSERT INTO products (name, description, price, category, image_url, stock)
              OUTPUT INSERTED.*
              VALUES (@name, @description, @price, @category, @image_url, @stock)`);

    res.status(201).json({ product: result.recordset[0] });
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT /api/products/:id - update a product (admin only)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image_url, stock } = req.body;
    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("name", sql.NVarChar, name)
      .input("description", sql.NVarChar, description || null)
      .input("price", sql.Decimal(10, 2), price)
      .input("category", sql.NVarChar, category)
      .input("image_url", sql.NVarChar, image_url || null)
      .input("stock", sql.Int, stock).query(`UPDATE products
              SET name = @name, description = @description, price = @price,
                  category = @category, image_url = @image_url, stock = @stock
              OUTPUT INSERTED.*
              WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: result.recordset[0] });
  } catch (err) {
    console.error("Update product error:", err.message);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id - delete a product (admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM products OUTPUT DELETED.id WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted", id: result.recordset[0].id });
  } catch (err) {
    console.error("Delete product error:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
