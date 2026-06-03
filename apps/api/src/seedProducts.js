const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Define Schema locally for the script
const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  unit: String,
  supplier: String,
  image: String,
  description: String,
  inStock: { type: Boolean, default: true }
});

const Product = mongoose.model('Product', ProductSchema);

const marketplaceData = [
  {
    name: "Portland Cement Grade 42.5R",
    category: "Cement",
    price: 8.50,
    unit: "Bag",
    supplier: "Dangote Group",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
    description: "High-strength structural cement for foundations and load-bearing walls."
  },
  {
    name: "Deformed Reinforcement Steel (12mm)",
    category: "Steel",
    price: 920.00,
    unit: "Ton",
    supplier: "SteelCo Africa",
    image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=800",
    description: "High-tensile ribbed steel bars for concrete reinforcement."
  },
  {
    name: "Premium Aluminum Zinc Sheets (0.45mm)",
    category: "Roofing & Zinc",
    price: 12.00,
    unit: "Sheet",
    supplier: "AluWorks CM",
    image: "https://images.unsplash.com/photo-1632759145351-1d592919f522?q=80&w=800",
    description: "Anti-corrosive long-span aluminum roofing sheets."
  },
  {
    name: "Caterpillar 320 GC Excavator",
    category: "Heavy Equipment",
    price: 350.00,
    unit: "Day (Hire)",
    supplier: "EquipRent Africa",
    image: "https://images.unsplash.com/photo-1579450371330-9759ba0e3037?q=80&w=800",
    description: "Reliable earthmoving equipment for site preparation and excavation."
  },
  {
    name: "Exterior Weather-Shield Paint (20L)",
    category: "Finishing",
    price: 45.00,
    unit: "Bucket",
    supplier: "Coral Paints",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800",
    description: "UV-resistant, waterproof paint for tropical climates."
  },
  {
    name: "Industrial Power Generator 150kVA",
    category: "Heavy Equipment",
    price: 120.00,
    unit: "Day (Hire)",
    supplier: "PowerNode Logistics",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800",
    description: "Continuous power supply for large-scale construction sites."
  },
  {
    name: "River Sand (High Quality)",
    category: "Aggregates",
    price: 25.00,
    unit: "m3",
    supplier: "BuildSource Ltd",
    image: "https://images.unsplash.com/photo-1509710131404-09947aa6a84d?q=80&w=800",
    description: "Sharp sand specifically filtered for concrete mixing."
  },
  {
    name: "Hollow Concrete Blocks (15cm)",
    category: "Masonry",
    price: 0.85,
    unit: "Piece",
    supplier: "Vertex Precast",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800",
    description: "High-density vibration-compressed blocks for wall construction."
  }
];

const seedMarketplace = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not found in .env");

    await mongoose.connect(mongoUri);
    console.log("📡 Connected to BuildHub Database...");

    // 1. Clear existing products to prevent duplicates
    await Product.deleteMany({});
    console.log("🧹 Marketplace Cleared.");

    // 2. Insert new data
    await Product.insertMany(marketplaceData);
    console.log("💎 8 Premium Materials Seeded Successfully!");

    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedMarketplace();