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

// Hand-picked, per-product photo IDs from Unsplash — matched individually,
// not by category keyword, so each product shows the actual item it is.
const PRODUCT_IMAGES = {
  "Pulse X12 Smartphone": "1561474119-1b76f3a79816",
  "Nova Lite 5G": "1750056393356-d1de9d222a29",
  "Vertex Pro Max": "1738052686450-8dd6d8150f67",
  "AeroBook 14 Slim": "1536926680870-faf05f7f823e",
  "TitanForge Gaming Laptop": "1771014817844-327a14245bd1",
  "CoreBook Essential 15": "1540397106260-e24a507a08ea",
  "EchoWave ANC Headphones": "1599669454699-248893623440",
  "SonicBuds Pro Earbuds": "1525825691042-e14d9042fc70",
  "BassLine Studio Headphones": "1567928513899-997d98489fbd",
  "PulseFit Watch Series 4": "1777496410128-926b2d0083f9",
  "TrailMaster GPS Watch": "1669149539822-91cf22b1e205",
  "MinimalTime Lite": "1557045157-0c9880d11677",
  "ChargeHub 65W GaN Charger": "1564517945244-d371c925640b",
  "ShieldCase Pro (Universal)": "1623393884989-cb3663e431c5",
  "GripStand Adjustable Mount": "1698314440355-eaf5ff14899c",
};

async function run() {
  const pool = await sql.connect(config);
  const { recordset: products } = await pool
    .request()
    .query("SELECT id, name FROM products");

  for (const p of products) {
    const photoId = PRODUCT_IMAGES[p.name];

    if (!photoId) {
      console.warn(`No image mapped for "${p.name}" — skipping`);
      continue;
    }

    const url = `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&auto=format&q=80`;

    await pool
      .request()
      .input("id", sql.Int, p.id)
      .input("url", sql.NVarChar, url)
      .query("UPDATE products SET image_url = @url WHERE id = @id");
    console.log(`Updated "${p.name}" -> ${url}`);
  }

  await pool.close();
  console.log("Done.");
}

run().catch(console.error);
