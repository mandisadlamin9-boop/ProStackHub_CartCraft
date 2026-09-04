const express = require("express");
const Stripe = require("stripe");
const { sql, getPool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
console.log("CLIENT_URL is:", process.env.CLIENT_URL);
const router = express.Router();

// POST /api/checkout - create a Stripe Checkout Session from the user's cart
router.post("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    // Fetch the user's cart with live product data (never trust prices from the frontend)
    const cartResult = await pool
      .request()
      .input("user_id", sql.Int, req.user.id)
      .query(`SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id,
                     p.name, p.price, p.stock, p.image_url
              FROM cart_items ci
              JOIN products p ON ci.product_id = p.id
              WHERE ci.user_id = @user_id`);

    const cartItems = cartResult.recordset;

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Make sure nothing in the cart exceeds available stock before even going to Stripe
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          error: `Not enough stock for ${item.name}. Only ${item.stock} left.`,
        });
      }
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create a "pending" order in our database first
    const orderResult = await pool
      .request()
      .input("user_id", sql.Int, req.user.id)
      .input("total_amount", sql.Decimal(10, 2), totalAmount)
      .input("status", sql.NVarChar, "Pending")
      .query(`INSERT INTO orders (user_id, total_amount, status)
              OUTPUT INSERTED.id
              VALUES (@user_id, @total_amount, @status)`);

    const orderId = orderResult.recordset[0].id;

    // Save each cart item as an order_item, tied to this order
    for (const item of cartItems) {
      await pool
        .request()
        .input("order_id", sql.Int, orderId)
        .input("product_id", sql.Int, item.product_id)
        .input("quantity", sql.Int, item.quantity)
        .input("price_at_purchase", sql.Decimal(10, 2), item.price)
        .query(`INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                VALUES (@order_id, @product_id, @quantity, @price_at_purchase)`);
    }
    const isValidImageUrl = (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    };
    // Build Stripe's line items from server-verified prices, never client-sent ones
    const line_items = cartItems.map((item) => ({
      price_data: {
        currency: "zar",
        product_data: {
          name: item.name,
          images: isValidImageUrl(item.image_url) ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.CLIENT_URL}/order-success?order_id=${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        order_id: orderId.toString(),
        user_id: req.user.id.toString(),
      },
    });

    // Save Stripe's session ID on our order, so the webhook can match it later
    await pool
      .request()
      .input("order_id", sql.Int, orderId)
      .input("stripe_session_id", sql.NVarChar, session.id)
      .query(
        "UPDATE orders SET stripe_session_id = @stripe_session_id WHERE id = @order_id",
      );

    res.json({ checkout_url: session.url, order_id: orderId });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/checkout/webhook - Stripe calls this directly, server-to-server
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = parseInt(session.metadata.order_id);
      const userId = parseInt(session.metadata.user_id);

      try {
        const pool = await getPool();

        // Get the order's items so we can decrement stock
        const itemsResult = await pool
          .request()
          .input("order_id", sql.Int, orderId)
          .query(
            "SELECT product_id, quantity FROM order_items WHERE order_id = @order_id",
          );

        // Atomically decrement stock for each item - only succeeds if enough stock remains
        for (const item of itemsResult.recordset) {
          const stockResult = await pool
            .request()
            .input("product_id", sql.Int, item.product_id)
            .input("quantity", sql.Int, item.quantity).query(`UPDATE products
                  SET stock = stock - @quantity
                  OUTPUT INSERTED.id
                  WHERE id = @product_id AND stock >= @quantity`);

          if (stockResult.recordset.length === 0) {
            console.error(
              `Insufficient stock for product ${item.product_id} on order ${orderId}`,
            );
            // In a production system we'd trigger a refund here; for this project we log and flag it
          }
        }

        // Mark the order as paid/placed
        await pool
          .request()
          .input("order_id", sql.Int, orderId)
          .input("payment_intent", sql.NVarChar, session.payment_intent)
          .query(`UPDATE orders
                SET status = 'Placed', stripe_payment_intent = @payment_intent
                WHERE id = @order_id`);

        // Clear the user's cart now that checkout is complete
        await pool
          .request()
          .input("user_id", sql.Int, userId)
          .query("DELETE FROM cart_items WHERE user_id = @user_id");

        console.log(
          `Order ${orderId} marked as Placed, stock decremented, cart cleared.`,
        );
      } catch (err) {
        console.error("Webhook processing error:", err.message);
      }
    }

    res.json({ received: true });
  },
);

module.exports = router;
