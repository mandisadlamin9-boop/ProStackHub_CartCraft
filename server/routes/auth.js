const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, getPool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    const pool = await getPool();

    const existing = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM users WHERE email = @email");

    if (existing.recordset.length > 0) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .input("password_hash", sql.NVarChar, passwordHash)
      .input("name", sql.NVarChar, name)
      .input("role", sql.NVarChar, "customer")
      .query(`INSERT INTO users (email, password_hash, name, role)
              OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.role
              VALUES (@email, @password_hash, @name, @role)`);

    const user = result.recordset[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(
        "SELECT id, email, password_hash, name, role FROM users WHERE email = @email",
      );

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", sql.Int, req.user.id)
      .query(
        "SELECT id, email, name, role, created_at FROM users WHERE id = @id",
      );

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;
