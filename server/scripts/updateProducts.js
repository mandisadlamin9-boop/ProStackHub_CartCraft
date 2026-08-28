require("dotenv").config();
const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};
// ── EDIT THESE TWO THINGS EACH TIME, THEN RERUN ──────────────────────
const CATEGORY = "Accessories";

const PRODUCTS = [
  {
    name: "Anker PowerCore 20000 Power Bank",
    description: "High-capacity portable battery with fast-charge output.",
    price: 899,
    stock: 40,
    photoId: "1706275399494-fb26bbc5da63",
  },
  {
    name: "Premium Leather Phone Case",
    description: "Genuine leather protective case with card slot.",
    price: 449,
    stock: 60,
    photoId: "1594843665794-446ce915d840",
  },
  {
    name: "USB-C Fast Charge Cable (2m)",
    description: "Braided reinforced cable, supports fast charging.",
    price: 199,
    stock: 100,
    photoId: "1585995603413-eb35b5f4a50b",
  },
  {
    name: "MagSafe Wireless Charging Pad",
    description: "Magnetic snap-on charger, compatible with recent iPhones.",
    price: 699,
    stock: 35,
    photoId: "1591290619618-904f6dd935e3",
  },
  {
    name: "15W Wireless Charging Stand",
    description: "Angled stand charger, ideal for desk or bedside use.",
    price: 549,
    stock: 30,
    photoId: "1615526675159-e248c3021d3f",
  },
  {
    name: "Universal Fast Wall Charger",
    description: "Compact wall adapter with dual USB-C output.",
    price: 349,
    stock: 50,
    photoId: "1627886107121-b7daaede3974",
  },
  {
    name: "Wireless Charging Dock",
    description: "Round charging puck, works through most phone cases.",
    price: 429,
    stock: 28,
    photoId: "1603674554159-b62f6febbce5",
  },
  {
    name: "USB-C Hub Adapter",
    description: "Multiport hub with HDMI, USB-A, and card reader.",
    price: 799,
    stock: 22,
    photoId: "1617975316514-69cd7e16c2a4",
  },
  {
    name: "Compact Travel Charger",
    description: "Slim wall charger, ideal for travel and daily carry.",
    price: 299,
    stock: 45,
    photoId: "1617975426095-f073792aef15",
  },
  {
    name: "Rugged Charging Cable (Braided)",
    description: "Reinforced cable built to resist fraying and bending damage.",
    price: 249,
    stock: 55,
    photoId: "1614399113305-a127bb2ca893",
  },
];
// ──────────────────────────────────────────────────────────────────

async function run() {
  const pool = await sql.connect(config);

  await pool
    .request()
    .input("category", sql.NVarChar, CATEGORY)
    .query(
      `DELETE FROM reviews WHERE product_id IN (SELECT id FROM products WHERE category = @category)`,
    );
  console.log(`Cleared old reviews for "${CATEGORY}".`);

  await pool
    .request()
    .input("category", sql.NVarChar, CATEGORY)
    .query(
      `DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products WHERE category = @category)`,
    );
  console.log(`Cleared old cart items for "${CATEGORY}".`);

  await pool
    .request()
    .input("category", sql.NVarChar, CATEGORY)
    .query(
      `DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE category = @category)`,
    );
  console.log(`Cleared old order items for "${CATEGORY}".`);

  const deleted = await pool
    .request()
    .input("category", sql.NVarChar, CATEGORY)
    .query("DELETE FROM products OUTPUT DELETED.id WHERE category = @category");
  console.log(
    `Deleted ${deleted.recordset.length} old "${CATEGORY}" products.`,
  );

  for (const p of PRODUCTS) {
    const image_url = `https://images.unsplash.com/photo-${p.photoId}?w=800&h=800&fit=crop&auto=format&q=80`;

    await pool
      .request()
      .input("name", sql.NVarChar, p.name)
      .input("description", sql.NVarChar, p.description)
      .input("price", sql.Decimal(10, 2), p.price)
      .input("category", sql.NVarChar, CATEGORY)
      .input("image_url", sql.NVarChar, image_url)
      .input("stock", sql.Int, p.stock)
      .query(`INSERT INTO products (name, description, price, category, image_url, stock)
              VALUES (@name, @description, @price, @category, @image_url, @stock)`);

    console.log(`Inserted "${p.name}"`);
  }

  await pool.close();
  console.log(`Done. ${PRODUCTS.length} "${CATEGORY}" products now live.`);
}

run().catch(console.error);
