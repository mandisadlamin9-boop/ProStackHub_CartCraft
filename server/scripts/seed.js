require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../config/db");

const products = [
  // Phones
  {
    name: "Pulse X12 Smartphone",
    description: '6.7" AMOLED display, 256GB storage, triple camera system.',
    price: 799.99,
    category: "Phones",
    stock: 25,
    image_url: "https://placehold.co/400x400?text=Pulse+X12",
  },
  {
    name: "Nova Lite 5G",
    description: "Budget-friendly 5G phone with all-day battery life.",
    price: 349.99,
    category: "Phones",
    stock: 40,
    image_url: "https://placehold.co/400x400?text=Nova+Lite",
  },
  {
    name: "Vertex Pro Max",
    description: "Flagship phone with titanium frame and 200MP camera.",
    price: 1199.99,
    category: "Phones",
    stock: 12,
    image_url: "https://placehold.co/400x400?text=Vertex+Pro+Max",
  },

  // Laptops
  {
    name: "AeroBook 14 Slim",
    description: 'Ultra-thin 14" laptop, 16GB RAM, 512GB SSD.',
    price: 1099.0,
    category: "Laptops",
    stock: 15,
    image_url: "https://placehold.co/400x400?text=AeroBook+14",
  },
  {
    name: "TitanForge Gaming Laptop",
    description: '17" 144Hz display, RTX-class GPU, RGB keyboard.',
    price: 1899.0,
    category: "Laptops",
    stock: 8,
    image_url: "https://placehold.co/400x400?text=TitanForge",
  },
  {
    name: "CoreBook Essential 15",
    description: "Reliable everyday laptop for work and study.",
    price: 649.0,
    category: "Laptops",
    stock: 30,
    image_url: "https://placehold.co/400x400?text=CoreBook+15",
  },

  // Headphones
  {
    name: "EchoWave ANC Headphones",
    description: "Over-ear noise-cancelling headphones, 40hr battery.",
    price: 229.99,
    category: "Headphones",
    stock: 50,
    image_url: "https://placehold.co/400x400?text=EchoWave+ANC",
  },
  {
    name: "SonicBuds Pro Earbuds",
    description: "True wireless earbuds with adaptive EQ.",
    price: 149.99,
    category: "Headphones",
    stock: 60,
    image_url: "https://placehold.co/400x400?text=SonicBuds+Pro",
  },
  {
    name: "BassLine Studio Headphones",
    description: "Wired studio-grade headphones for mixing and mastering.",
    price: 179.99,
    category: "Headphones",
    stock: 20,
    image_url: "https://placehold.co/400x400?text=BassLine+Studio",
  },

  // Smartwatches
  {
    name: "PulseFit Watch Series 4",
    description: "Heart-rate, SpO2, and sleep tracking with AMOLED display.",
    price: 249.99,
    category: "Smartwatches",
    stock: 35,
    image_url: "https://placehold.co/400x400?text=PulseFit+S4",
  },
  {
    name: "TrailMaster GPS Watch",
    description:
      "Rugged outdoor smartwatch with built-in GPS and 14-day battery.",
    price: 329.99,
    category: "Smartwatches",
    stock: 18,
    image_url: "https://placehold.co/400x400?text=TrailMaster",
  },
  {
    name: "MinimalTime Lite",
    description:
      "Simple, elegant smartwatch focused on notifications and fitness.",
    price: 129.99,
    category: "Smartwatches",
    stock: 45,
    image_url: "https://placehold.co/400x400?text=MinimalTime+Lite",
  },

  // Accessories
  {
    name: "ChargeHub 65W GaN Charger",
    description: "Compact fast charger with 3 ports, 65W total output.",
    price: 39.99,
    category: "Accessories",
    stock: 100,
    image_url: "https://placehold.co/400x400?text=ChargeHub+65W",
  },
  {
    name: "ShieldCase Pro (Universal)",
    description: "Drop-tested protective case, fits most phone models.",
    price: 24.99,
    category: "Accessories",
    stock: 80,
    image_url: "https://placehold.co/400x400?text=ShieldCase+Pro",
  },
  {
    name: "GripStand Adjustable Mount",
    description: "Foldable phone/tablet stand, adjustable viewing angles.",
    price: 19.99,
    category: "Accessories",
    stock: 70,
    image_url: "https://placehold.co/400x400?text=GripStand",
  },
];

async function seed() {
  try {
    const pool = await getPool();

    console.log("Seeding products...");
    for (const p of products) {
      await pool
        .request()
        .input("name", sql.NVarChar, p.name)
        .input("description", sql.NVarChar, p.description)
        .input("price", sql.Decimal(10, 2), p.price)
        .input("category", sql.NVarChar, p.category)
        .input("image_url", sql.NVarChar, p.image_url)
        .input("stock", sql.Int, p.stock)
        .query(`INSERT INTO products (name, description, price, category, image_url, stock)
                VALUES (@name, @description, @price, @category, @image_url, @stock)`);
    }
    console.log(`Inserted ${products.length} products.`);

    console.log("Seeding admin account...");
    const adminEmail = "admin@cartcraft.com";
    const adminPassword = "Admin@12345";
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await pool
      .request()
      .input("email", sql.NVarChar, adminEmail)
      .input("password_hash", sql.NVarChar, passwordHash)
      .input("name", sql.NVarChar, "CartCraft Admin")
      .input("role", sql.NVarChar, "admin")
      .query(`INSERT INTO users (email, password_hash, name, role)
              VALUES (@email, @password_hash, @name, @role)`);

    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
    console.log("Seed complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
