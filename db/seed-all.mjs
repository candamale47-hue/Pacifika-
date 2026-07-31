import { createClient } from "@libsql/client";

const client = createClient({ url: "file:./db/pacifika.db" });

// Categories
await client.execute(`INSERT OR IGNORE INTO categories (name, slug, image, sortOrder) VALUES
  ('Island Dresses', 'dresses', '/images/category-dresses.jpg', 1),
  ('Shirts', 'shirts', '/images/category-shirts.jpg', 2),
  ('Puletasi', 'puletasi', '/images/category-puletasi.jpg', 3),
  ('Kids', 'kids', '/images/category-kids.jpg', 4)`);

// Products
await client.execute(`INSERT OR IGNORE INTO products
  (name, slug, description, category, price, salePrice, images, sizes, colors, stockQuantity, sku, isActive, featured, weightGrams)
VALUES
  ('Hibiscus Island Dress', 'hibiscus-island-dress', 'A flowing women''s island dress with bold red and pink hibiscus floral patterns on white fabric. Features an elegant off-shoulder design with a beautifully ruffled hem.', 'dresses', 89.99, 69.99, '["/images/product-dress-1.jpg"]', '["XS","S","M","L","XL"]', '[{"name":"White/Red","hex":"#FFFFFF"}]', 25, 'DRE-001', 1, 1, 450),
  ('Tapa Pattern Maxi Dress', 'tapa-maxi-dress', 'A stunning navy blue and gold traditional island maxi dress featuring authentic geometric Polynesian tapa patterns.', 'dresses', 99.99, NULL, '["/images/product-dress-2.jpg"]', '["S","M","L","XL","XXL"]', '[{"name":"Navy/Gold","hex":"#1B2A4A"}]', 18, 'DRE-002', 1, 1, 520),
  ('Palm Wave Island Shirt', 'palm-wave-shirt', 'A men''s short-sleeve Pacific Island shirt in bright sky blue adorned with white palm tree and wave patterns.', 'shirts', 64.99, 54.99, '["/images/product-shirt-1.jpg"]', '["S","M","L","XL","XXL"]', '[{"name":"Sky Blue","hex":"#5BA4CF"}]', 30, 'SHI-001', 1, 1, 350),
  ('Coral Reef Turtle Shirt', 'coral-reef-shirt', 'A vibrant coral red and white island shirt featuring unique turtle and tropical fish motifs.', 'shirts', 59.99, NULL, '["/images/product-shirt-2.jpg"]', '["M","L","XL"]', '[{"name":"Coral Red","hex":"#FF6B5B"}]', 22, 'SHI-002', 1, 0, 340),
  ('Emerald Garden Puletasi', 'emerald-puletasi', 'A beautiful two-piece puletasi set in emerald green with intricate gold and white tropical flower border patterns.', 'puletasi', 119.99, NULL, '["/images/product-puletasi-1.jpg"]', '["S","M","L","XL"]', '[{"name":"Emerald","hex":"#2E8B57"}]', 15, 'PUL-001', 1, 1, 600),
  ('Royal Blue Puletasi Set', 'royal-puletasi', 'An elegant royal blue puletasi set featuring gold Polynesian tribal patterns along the borders.', 'puletasi', 109.99, 89.99, '["/images/product-puletasi-2.jpg"]', '["XS","S","M","L","XL","XXL"]', '[{"name":"Royal Blue","hex":"#4169E1"}]', 20, 'PUL-002', 1, 0, 580),
  ('Sunshine Kids Island Dress', 'sunshine-kids-dress', 'An adorable child''s island dress in bright yellow with small colorful hibiscus prints.', 'kids', 44.99, NULL, '["/images/product-kids-1.jpg"]', '["2T","3T","4T","5T","6","7","8"]', '[{"name":"Yellow","hex":"#FFD700"}]', 20, 'KID-001', 1, 1, 250),
  ('Ocean Explorer Kids Shirt', 'ocean-kids-shirt', 'A fun toddler boy''s island shirt in turquoise featuring playful white shark and wave patterns.', 'kids', 39.99, 34.99, '["/images/product-kids-2.jpg"]', '["2T","3T","4T","5T","6"]', '[{"name":"Turquoise","hex":"#40E0D0"}]', 18, 'KID-002', 1, 0, 200)`);

// Shipping Rates
await client.execute(`INSERT OR IGNORE INTO shipping_rates (name, countryCode, region, minWeight, maxWeight, rate, isActive) VALUES
  ('Cairns Local Delivery', 'AU', 'Cairns', 0, 10000, 0, 1),
  ('Australia Standard', 'AU', NULL, 0, 500, 9.99, 1),
  ('Australia Standard', 'AU', NULL, 501, 2000, 14.99, 1),
  ('Australia Standard', 'AU', NULL, 2001, 10000, 19.99, 1),
  ('International Standard', NULL, NULL, 0, 500, 24.99, 1),
  ('International Standard', NULL, NULL, 501, 2000, 34.99, 1)`);

// Promo Codes
await client.execute(`INSERT OR IGNORE INTO promo_codes (code, type, value, minOrderAmount, usageLimit, isActive) VALUES
  ('WELCOME10', 'percentage', 10, 50, 100, 1),
  ('PACIFIKA20', 'fixed', 20, 100, NULL, 1)`);

// Reviews
await client.execute(`INSERT OR IGNORE INTO reviews (productId, userName, rating, comment, isApproved) VALUES
  (1, 'Sarah M.', 5, 'Absolutely beautiful dress! The fabric is so soft and the print is stunning. Got so many compliments at the island festival.', 1),
  (1, 'Leilani T.', 5, 'Perfect for our family luau. The fit is true to size and the quality is excellent.', 1),
  (3, 'James K.', 4, 'Great shirt for tropical weather. Very breathable fabric and the palm print is really cool.', 1),
  (5, 'Moana F.', 5, 'Wore this to my cousin''s wedding and felt so elegant. The emerald color is gorgeous.', 1),
  (7, 'Lisa P.', 5, 'My daughter loves this dress! She wants to wear it everywhere. Great quality for kids.', 1)`);

console.log("Seeded: categories, products, shipping rates, promo codes, reviews");
process.exit(0);
