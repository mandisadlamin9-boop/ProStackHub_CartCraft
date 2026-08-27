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

const CATEGORY_KEYWORD = {
  Phones: "smartphone",
  Laptops: "laptop",
  Headphones: "headphones",
  Smartwatches: "smartwatch",
  Accessories: "gadget",
};

const NEW_PRODUCTS = [
  // Phones
  {
    name: "Orbit S9 Compact",
    description: 'Small-form flagship with a 6.1" display, no compromises.',
    price: 899.99,
    category: "Phones",
    stock: 22,
  },
  {
    name: "Flux Fold 3",
    description: "Foldable display phone with dual-screen multitasking.",
    price: 1599.99,
    category: "Phones",
    stock: 6,
  },
  {
    name: "RangeMax 5G Rugged",
    description: "Military-spec drop and dust resistant 5G phone.",
    price: 549.99,
    category: "Phones",
    stock: 28,
  },
  {
    name: "Solstice Mini",
    description: 'Compact budget phone, 5.4" screen, 3-day battery.',
    price: 219.99,
    category: "Phones",
    stock: 40,
  },
  {
    name: "Vantage Z Ultra",
    description: "200MP zoom camera phone with periscope lens.",
    price: 1349.99,
    category: "Phones",
    stock: 10,
  },
  {
    name: "Nomad Lite Prepaid",
    description: "No-frills reliable phone, ideal as a spare or first device.",
    price: 149.99,
    category: "Phones",
    stock: 55,
  },
  {
    name: "Halo X Creator Edition",
    description: "Tuned for video creators, cinematic stabilization.",
    price: 999.99,
    category: "Phones",
    stock: 15,
  },

  // Laptops
  {
    name: "Voyager 13 Ultrabook",
    description: '13.3" featherweight laptop, all-day battery.',
    price: 949,
    category: "Laptops",
    stock: 20,
  },
  {
    name: "WorkForge Business 15",
    description:
      "Business laptop with fingerprint reader and spill-resistant keyboard.",
    price: 1099,
    category: "Laptops",
    stock: 18,
  },
  {
    name: "PixelDraft Creator 16",
    description: "Color-accurate display built for design and video editing.",
    price: 1799,
    category: "Laptops",
    stock: 9,
  },
  {
    name: "BudgetLine 14",
    description: "Affordable everyday laptop for browsing and study.",
    price: 499,
    category: "Laptops",
    stock: 35,
  },
  {
    name: "SteelFrame Rugged Book",
    description: "Reinforced chassis laptop for fieldwork and travel.",
    price: 1299,
    category: "Laptops",
    stock: 12,
  },
  {
    name: "Zenith 2-in-1 Convertible",
    description: "Touchscreen laptop that folds into tablet mode.",
    price: 1199,
    category: "Laptops",
    stock: 14,
  },
  {
    name: "ProCompute Workstation 17",
    description: "High-core-count laptop for heavy multitasking and rendering.",
    price: 2299,
    category: "Laptops",
    stock: 5,
  },

  // Headphones
  {
    name: "AirGlide Sport Buds",
    description: "Sweat-resistant earbuds with secure-fit ear hooks.",
    price: 89.99,
    category: "Headphones",
    stock: 45,
  },
  {
    name: "Reverb Bass Boost Over-Ear",
    description: "Extra-deep bass tuning for hip-hop and EDM.",
    price: 129.99,
    category: "Headphones",
    stock: 38,
  },
  {
    name: "WhisperFit ANC Buds Mini",
    description: "Ultra-small active-noise-cancelling earbuds.",
    price: 159.99,
    category: "Headphones",
    stock: 30,
  },
  {
    name: "StageMonitor Wired Pro",
    description: "In-ear monitors for musicians and live performers.",
    price: 199.99,
    category: "Headphones",
    stock: 16,
  },
  {
    name: "OpenAir Comfort Band",
    description:
      "Open-back design for long listening sessions without ear fatigue.",
    price: 109.99,
    category: "Headphones",
    stock: 25,
  },
  {
    name: "TravelMute Foldable ANC",
    description: "Foldable over-ear headphones built for flights.",
    price: 219.99,
    category: "Headphones",
    stock: 20,
  },
  {
    name: "PulseGrip Gaming Headset",
    description: "7.1 surround gaming headset with detachable mic.",
    price: 179.99,
    category: "Headphones",
    stock: 27,
  },

  // Smartwatches
  {
    name: "OrbitFit Kids Watch",
    description: "Simple activity tracking smartwatch designed for children.",
    price: 79.99,
    category: "Smartwatches",
    stock: 32,
  },
  {
    name: "SummitPro Dive Watch",
    description: "Water-resistant to 100m, built-in dive computer.",
    price: 449.99,
    category: "Smartwatches",
    stock: 8,
  },
  {
    name: "StyleLine Hybrid",
    description: "Analog watch face with hidden smart notifications.",
    price: 189.99,
    category: "Smartwatches",
    stock: 24,
  },
  {
    name: "RunTrack Marathon Edition",
    description: "Ultra-light running watch with pace coaching.",
    price: 279.99,
    category: "Smartwatches",
    stock: 19,
  },
  {
    name: "EverydayFit Basic",
    description: "Affordable step counter and sleep tracker.",
    price: 59.99,
    category: "Smartwatches",
    stock: 50,
  },
  {
    name: "ExecutivePro Titanium",
    description: "Premium titanium-body smartwatch with sapphire glass.",
    price: 599.99,
    category: "Smartwatches",
    stock: 7,
  },
  {
    name: "GolfCaddy Sport Watch",
    description: "GPS course-mapping smartwatch built for golfers.",
    price: 329.99,
    category: "Smartwatches",
    stock: 13,
  },

  // Accessories
  {
    name: "PowerBank 20000mAh Fast Charge",
    description: "High-capacity portable battery with dual USB-C output.",
    price: 34.99,
    category: "Accessories",
    stock: 90,
  },
  {
    name: "MagLock Wireless Charger Pad",
    description: "Magnetic snap-on charging pad for compatible phones.",
    price: 29.99,
    category: "Accessories",
    stock: 75,
  },
  {
    name: "GlassGuard Screen Protector 2-Pack",
    description: "Tempered glass protection with easy-align applicator.",
    price: 12.99,
    category: "Accessories",
    stock: 150,
  },
  {
    name: "DeskDock Multi-Port Hub",
    description: "USB-C hub with HDMI, SD card, and 3x USB-A ports.",
    price: 44.99,
    category: "Accessories",
    stock: 60,
  },
  {
    name: "CableCoil Braided USB-C 2m",
    description: "Durable braided fast-charge cable, 2 metre length.",
    price: 14.99,
    category: "Accessories",
    stock: 120,
  },
  {
    name: "TravelPouch Tech Organizer",
    description: "Compact pouch for cables, chargers, and small gadgets.",
    price: 19.99,
    category: "Accessories",
    stock: 65,
  },
  {
    name: "RingGrip Pop Stand",
    description: "Collapsible ring grip and stand for one-handed use.",
    price: 9.99,
    category: "Accessories",
    stock: 200,
  },
];

async function run() {
  const pool = await sql.connect(config);

  for (let i = 0; i < NEW_PRODUCTS.length; i++) {
    const p = NEW_PRODUCTS[i];
    const keyword = CATEGORY_KEYWORD[p.category];
    const image_url = `https://loremflickr.com/400/400/${keyword}?lock=${100 + i}`;

    await pool
      .request()
      .input("name", sql.NVarChar, p.name)
      .input("description", sql.NVarChar, p.description)
      .input("price", sql.Decimal(10, 2), p.price)
      .input("category", sql.NVarChar, p.category)
      .input("image_url", sql.NVarChar, image_url)
      .input("stock", sql.Int, p.stock)
      .query(`INSERT INTO products (name, description, price, category, image_url, stock)
              VALUES (@name, @description, @price, @category, @image_url, @stock)`);

    console.log(`Inserted "${p.name}" (${p.category})`);
  }

  await pool.close();
  console.log(`Done. Added ${NEW_PRODUCTS.length} products.`);
}

run().catch(console.error);
