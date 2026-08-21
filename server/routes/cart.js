const express = require("express");
const { sql, getPool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// All cart routes require login
router.use(requireAuth);

// GET /api/cart - view current user's cart, with product details joined in
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().input("user_id", sql.Int, req.user.id)
      .query(`SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price,
                     p.image_url, p.stock, p.category
              FROM cart_items ci
              JOIN products p ON ci.product_id = p.id
              WHERE ci.user_id = @user_id
              ORDER BY ci.created_at DESC`);

    res.json({ items: result.recordset });
  } catch (err) {
    console.error("Get cart error:", err.message);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// POST /api/cart - add an item (or increase quantity if it already exists)
router.post("/", async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const qty = quantity && quantity > 0 ? quantity : 1;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const pool = await getPool();

    const productCheck = await pool
      .request()
      .input("product_id", sql.Int, product_id)
      .query("SELECT id, stock FROM products WHERE id = @product_id");

    if (productCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    await pool
      .request()
      .input("user_id", sql.Int, req.user.id)
      .input("product_id", sql.Int, product_id)
      .input("quantity", sql.Int, qty).query(`MERGE cart_items AS target
              USING (SELECT @user_id AS user_id, @product_id AS product_id) AS src
              ON target.user_id = src.user_id AND target.product_id = src.product_id
              WHEN MATCHED THEN
                UPDATE SET quantity = target.quantity + @quantity
              WHEN NOT MATCHED THEN
                INSERT (user_id, product_id, quantity)
                VALUES (@user_id, @product_id, @quantity);`);

    res.status(201).json({ message: "Added to cart" });
  } catch (err) {
    console.error("Add to cart error:", err.message);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// PUT /api/cart/:id - update quantity of a specific cart item
router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("user_id", sql.Int, req.user.id)
      .input("quantity", sql.Int, quantity)
      .query(`UPDATE cart_items SET quantity = @quantity
              OUTPUT INSERTED.*
              WHERE id = @id AND user_id = @user_id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ item: result.recordset[0] });
  } catch (err) {
    console.error("Update cart error:", err.message);
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

// DELETE /api/cart/:id - remove one item from cart
router.delete("/:id", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("user_id", sql.Int, req.user.id)
      .query(
        "DELETE FROM cart_items OUTPUT DELETED.id WHERE id = @id AND user_id = @user_id",
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ message: "Removed from cart" });
  } catch (err) {
    console.error("Remove from cart error:", err.message);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

module.exports = router;
