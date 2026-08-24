const express = require("express");
const { sql, getPool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/reviews/:productId - public: view all reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("product_id", sql.Int, req.params.productId)
      .query(`SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
              FROM reviews r
              JOIN users u ON r.user_id = u.id
              WHERE r.product_id = @product_id
              ORDER BY r.created_at DESC`);

    res.json({ reviews: result.recordset });
  } catch (err) {
    console.error("Get reviews error:", err.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/reviews - create a review (must have purchased the product)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res
        .status(400)
        .json({ error: "product_id and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const pool = await getPool();

    // Verify the user actually purchased this product (in any completed order)
    const purchaseCheck = await pool
      .request()
      .input("user_id", sql.Int, req.user.id)
      .input("product_id", sql.Int, product_id).query(`SELECT TOP 1 o.id
              FROM orders o
              JOIN order_items oi ON oi.order_id = o.id
              WHERE o.user_id = @user_id
                AND oi.product_id = @product_id
                AND o.status != 'Pending'`);

    if (purchaseCheck.recordset.length === 0) {
      return res
        .status(403)
        .json({ error: "You can only review products you have purchased" });
    }

    // Check for an existing review (unique constraint would also catch this, but a clean error is nicer)
    const existing = await pool
      .request()
      .input("user_id", sql.Int, req.user.id)
      .input("product_id", sql.Int, product_id)
      .query(
        "SELECT id FROM reviews WHERE user_id = @user_id AND product_id = @product_id",
      );

    if (existing.recordset.length > 0) {
      return res
        .status(409)
        .json({ error: "You have already reviewed this product" });
    }

    const result = await pool
      .request()
      .input("user_id", sql.Int, req.user.id)
      .input("product_id", sql.Int, product_id)
      .input("rating", sql.Int, rating)
      .input("comment", sql.NVarChar, comment || null)
      .query(`INSERT INTO reviews (user_id, product_id, rating, comment)
              OUTPUT INSERTED.*
              VALUES (@user_id, @product_id, @rating, @comment)`);

    res.status(201).json({ review: result.recordset[0] });
  } catch (err) {
    console.error("Create review error:", err.message);
    res.status(500).json({ error: "Failed to create review" });
  }
});

module.exports = router;
