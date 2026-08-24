const express = require("express");
const { sql, getPool } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/orders - logged-in user's own order history
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    const ordersResult = await pool
      .request()
      .input("user_id", sql.Int, req.user.id)
      .query(`SELECT id, total_amount, status, created_at
              FROM orders
              WHERE user_id = @user_id AND status != 'Pending'
              ORDER BY created_at DESC`);

    const orders = ordersResult.recordset;

    // Attach line items to each order
    for (const order of orders) {
      const itemsResult = await pool
        .request()
        .input("order_id", sql.Int, order.id)
        .query(`SELECT oi.quantity, oi.price_at_purchase, p.id AS product_id, p.name, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = @order_id`);
      order.items = itemsResult.recordset;
    }

    res.json({ orders });
  } catch (err) {
    console.error("Get orders error:", err.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/orders/admin/all - admin: view every order (for the admin panel)
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request()
      .query(`SELECT o.id, o.total_amount, o.status, o.created_at, u.name AS customer_name, u.email
              FROM orders o
              JOIN users u ON o.user_id = u.id
              WHERE o.status != 'Pending'
              ORDER BY o.created_at DESC`);

    res.json({ orders: result.recordset });
  } catch (err) {
    console.error("Get all orders error:", err.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PUT /api/orders/:id/status - admin: update order status
router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Placed", "Packed", "Shipped", "Delivered"];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const pool = await getPool();

    // Fetch current status to enforce the correct order (no skipping/reversing)
    const currentResult = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT status FROM orders WHERE id = @id");

    if (currentResult.recordset.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentStatus = currentResult.recordset[0].status;
    const currentIndex = validStatuses.indexOf(currentStatus);
    const newIndex = validStatuses.indexOf(status);

    if (newIndex !== currentIndex + 1) {
      return res.status(400).json({
        error: `Cannot move from "${currentStatus}" to "${status}". Must follow: ${validStatuses.join(" → ")}`,
      });
    }

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("status", sql.NVarChar, status)
      .query(`UPDATE orders SET status = @status
              OUTPUT INSERTED.*
              WHERE id = @id`);

    res.json({ order: result.recordset[0] });
  } catch (err) {
    console.error("Update order status error:", err.message);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;
