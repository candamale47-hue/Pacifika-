// SECURITY-HARDENED ORDER ROUTER - Replace the create endpoint
// Key changes:
// 1. Client CANNOT send prices anymore - only product IDs + quantities
// 2. Server recalculates ALL totals from database prices
// 3. GST calculated server-side (subtotal / 11)
// 4. Shipping cost determined server-side by country
// 5. Payment verification endpoint confirms Square payment amount matches

// NEW create input schema - NO price fields from client:
const createInput = z.object({
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1).max(99),
    size: z.string().optional(),
    color: z.string().optional(),
  })).min(1),
  shipping: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address1: z.string().min(1),
    address2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postcode: z.string().min(1),
    country: z.string().default("Australia"),
  }),
  notes: z.string().optional(),
});

// Server-side shipping calculator:
function calculateShipping(country: string, subtotal: number): number {
  if (country === "Australia") {
    return subtotal >= 100 ? 0 : 9.99; // Free over $100
  }
  if (country === "New Zealand") return 19.99;
  return 29.99; // Rest of world
}

// Server-side GST calculator (inclusive):
function calculateGst(subtotal: number): { gst: number; taxableAmount: number } {
  const gst = Math.round((subtotal / 11) * 100) / 100;
  return { gst, taxableAmount: subtotal - gst };
}
