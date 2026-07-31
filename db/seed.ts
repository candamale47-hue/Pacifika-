import { getDb } from "../api/queries/connection";
import * as schema from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  await db.insert(schema.categories).values([
    { name: "Island Dresses", slug: "dresses", image: "/images/category-dresses.jpg", sortOrder: 1 },
    { name: "Shirts", slug: "shirts", image: "/images/category-shirts.jpg", sortOrder: 2 },
    { name: "Puletasi", slug: "puletasi", image: "/images/category-puletasi.jpg", sortOrder: 3 },
    { name: "Kids", slug: "kids", image: "/images/category-kids.jpg", sortOrder: 4 },
  ]).onConflictDoNothing();

  await db.insert(schema.products).values([
    {
      name: "Hibiscus Island Dress",
      slug: "hibiscus-island-dress",
      description: "A flowing women's island dress with bold red and pink hibiscus floral patterns on white fabric. Features an elegant off-shoulder design with a beautifully ruffled hem that moves gracefully. Perfect for beach weddings, island getaways, or any special occasion where you want to showcase Pacific Island style.",
      category: "dresses",
      price: 89.99,
      salePrice: 69.99,
      images: ["/images/product-dress-1.jpg"],
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: [{ name: "White/Red", hex: "#FFFFFF" }],
      stockQuantity: 25,
      sku: "DRE-001",
      isActive: true,
      featured: true,
      weightGrams: 450,
    },
    {
      name: "Tapa Pattern Maxi Dress",
      slug: "tapa-maxi-dress",
      description: "A stunning navy blue and gold traditional island maxi dress featuring authentic geometric Polynesian tapa patterns. The elegant maxi length with a tasteful side slit offers both sophistication and comfort. Handcrafted with premium fabric for a luxurious feel.",
      category: "dresses",
      price: 99.99,
      images: ["/images/product-dress-2.jpg"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: [{ name: "Navy/Gold", hex: "#1B2A4A" }],
      stockQuantity: 18,
      sku: "DRE-002",
      isActive: true,
      featured: true,
      weightGrams: 520,
    },
    {
      name: "Palm Wave Island Shirt",
      slug: "palm-wave-shirt",
      description: "A men's short-sleeve Pacific Island shirt in bright sky blue adorned with white palm tree and wave patterns. The relaxed button-up style offers a comfortable fit perfect for tropical climates. Made from breathable cotton blend fabric.",
      category: "shirts",
      price: 64.99,
      salePrice: 54.99,
      images: ["/images/product-shirt-1.jpg"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: [{ name: "Sky Blue", hex: "#5BA4CF" }],
      stockQuantity: 30,
      sku: "SHI-001",
      isActive: true,
      featured: true,
      weightGrams: 350,
    },
    {
      name: "Coral Reef Turtle Shirt",
      slug: "coral-reef-shirt",
      description: "A vibrant coral red and white island shirt featuring unique turtle and tropical fish motifs. The short-sleeve camp collar design adds a relaxed, vacation-ready vibe. Perfect for beach barbecues, island hopping, or casual Fridays.",
      category: "shirts",
      price: 59.99,
      images: ["/images/product-shirt-2.jpg"],
      sizes: ["M", "L", "XL"],
      colors: [{ name: "Coral Red", hex: "#FF6B5B" }],
      stockQuantity: 22,
      sku: "SHI-002",
      isActive: true,
      featured: false,
      weightGrams: 340,
    },
    {
      name: "Emerald Garden Puletasi",
      slug: "emerald-puletasi",
      description: "A beautiful two-piece puletasi set in emerald green with intricate gold and white tropical flower border patterns. The top features elegant flutter sleeves, while the wrap-style skirt comes with a matching sash. This traditional Pacific Island outfit combines cultural heritage with modern elegance.",
      category: "puletasi",
      price: 119.99,
      images: ["/images/product-puletasi-1.jpg"],
      sizes: ["S", "M", "L", "XL"],
      colors: [{ name: "Emerald", hex: "#2E8B57" }],
      stockQuantity: 15,
      sku: "PUL-001",
      isActive: true,
      featured: true,
      weightGrams: 600,
    },
    {
      name: "Royal Blue Puletasi Set",
      slug: "royal-puletasi",
      description: "An elegant royal blue puletasi set featuring gold Polynesian tribal patterns along the borders. The fitted top pairs beautifully with the flowing wrap skirt. Perfect for church services, cultural events, weddings, and formal island gatherings.",
      category: "puletasi",
      price: 109.99,
      salePrice: 89.99,
      images: ["/images/product-puletasi-2.jpg"],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: [{ name: "Royal Blue", hex: "#4169E1" }],
      stockQuantity: 20,
      sku: "PUL-002",
      isActive: true,
      featured: false,
      weightGrams: 580,
    },
    {
      name: "Sunshine Kids Island Dress",
      slug: "sunshine-kids-dress",
      description: "An adorable child's island dress in bright yellow with small colorful hibiscus prints scattered throughout. The A-line style with a sweet bow at the back is comfortable for play yet pretty enough for special occasions. Made from soft, breathable cotton.",
      category: "kids",
      price: 44.99,
      images: ["/images/product-kids-1.jpg"],
      sizes: ["2T", "3T", "4T", "5T", "6", "7", "8"],
      colors: [{ name: "Yellow", hex: "#FFD700" }],
      stockQuantity: 20,
      sku: "KID-001",
      isActive: true,
      featured: true,
      weightGrams: 250,
    },
    {
      name: "Ocean Explorer Kids Shirt",
      slug: "ocean-kids-shirt",
      description: "A fun toddler boy's island shirt in turquoise featuring playful white shark and wave patterns. The short sleeves include authentic coconut button details. Made from durable, easy-care fabric that stands up to island adventures.",
      category: "kids",
      price: 39.99,
      salePrice: 34.99,
      images: ["/images/product-kids-2.jpg"],
      sizes: ["2T", "3T", "4T", "5T", "6"],
      colors: [{ name: "Turquoise", hex: "#40E0D0" }],
      stockQuantity: 18,
      sku: "KID-002",
      isActive: true,
      featured: false,
      weightGrams: 200,
    },
  ]).onConflictDoNothing();

  await db.insert(schema.shippingRates).values([
    { name: "Cairns Local Delivery", countryCode: "AU", region: "Cairns", minWeight: 0, maxWeight: 10000, rate: 0 },
    { name: "Australia Standard", countryCode: "AU", minWeight: 0, maxWeight: 500, rate: 9.99 },
    { name: "Australia Standard", countryCode: "AU", minWeight: 501, maxWeight: 2000, rate: 14.99 },
    { name: "Australia Standard", countryCode: "AU", minWeight: 2001, maxWeight: 10000, rate: 19.99 },
    { name: "International Standard", countryCode: null, minWeight: 0, maxWeight: 500, rate: 24.99 },
    { name: "International Standard", countryCode: null, minWeight: 501, maxWeight: 2000, rate: 34.99 },
  ]).onConflictDoNothing();

  await db.insert(schema.promoCodes).values([
    { code: "WELCOME10", type: "percentage", value: 10, minOrderAmount: 50, usageLimit: 100 },
    { code: "PACIFIKA20", type: "fixed", value: 20, minOrderAmount: 100 },
  ]).onConflictDoNothing();

  await db.insert(schema.settings).values([
    { key: "store_name", value: "Pacifika Wear", group: "general" },
    { key: "store_email", value: "joelandamale@gmail.com", group: "general" },
    { key: "store_phone", value: "+61 460 786 986", group: "general" },
    { key: "store_address", value: "Cairns, QLD, Australia", group: "general" },
    { key: "ga_measurement_id", value: "G-XXXXXXXXXX", group: "analytics" },
    { key: "free_shipping_threshold", value: "150", group: "shipping" },
    { key: "cairns_postcodes", value: "4870,4871,4872,4873,4874,4875,4876,4877,4878,4879", group: "shipping" },
    { key: "bank_account_name", value: "Joel Andamale T/A Pacifika Wear", group: "payment" },
    { key: "bank_name", value: "Commonwealth Bank", group: "payment" },
    { key: "bank_bsb", value: "064836", group: "payment" },
    { key: "bank_account_number", value: "10465795", group: "payment" },
    { key: "payment_instructions", value: "Please transfer the total amount to our bank account. Use your order number as the payment reference. Once payment is confirmed, we will process and ship your order.", group: "payment" },
    { key: "fb_pixel_id", value: "", group: "analytics" },
    { key: "push_notifications_enabled", value: "true", group: "notifications" },
  ]).onConflictDoNothing();

  await db.insert(schema.reviews).values([
    { productId: 1, userName: "Sarah M.", rating: 5, comment: "Absolutely beautiful dress! The fabric is so soft and the print is stunning. Got so many compliments at the island festival." },
    { productId: 1, userName: "Leilani T.", rating: 5, comment: "Perfect for our family luau. The fit is true to size and the quality is excellent." },
    { productId: 3, userName: "James K.", rating: 4, comment: "Great shirt for tropical weather. Very breathable fabric and the palm print is really cool." },
    { productId: 5, userName: "Moana F.", rating: 5, comment: "Wore this to my cousin's wedding and felt so elegant. The emerald color is gorgeous." },
    { productId: 7, userName: "Lisa P.", rating: 5, comment: "My daughter loves this dress! She wants to wear it everywhere. Great quality for kids." },
  ]).onConflictDoNothing();

  console.log("Seed complete!");
  process.exit(0);
}

seed();
