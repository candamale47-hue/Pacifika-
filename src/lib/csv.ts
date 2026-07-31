/**
 * CSV Product Export / Import
 */

export interface ProductCSVRow {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  salePrice: string;
  images: string;
  sizes: string;
  colors: string;
  stockQuantity: string;
  sku: string;
  weightGrams: string;
  featured: string;
  isActive: string;
  badge: string;
}

const CSV_HEADER = "name,slug,description,category,price,salePrice,images,sizes,colors,stockQuantity,sku,weightGrams,featured,isActive,badge\n";

function escapeCsv(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function productsToCSV(products: ProductCSVRow[]): string {
  const rows = products.map((p) =>
    [
      escapeCsv(p.name),
      escapeCsv(p.slug),
      escapeCsv(p.description),
      escapeCsv(p.category),
      p.price,
      p.salePrice,
      escapeCsv(p.images),
      escapeCsv(p.sizes),
      escapeCsv(p.colors),
      p.stockQuantity,
      escapeCsv(p.sku),
      p.weightGrams,
      p.featured,
      p.isActive,
      escapeCsv(p.badge),
    ].join(",")
  );
  return CSV_HEADER + rows.join("\n");
}

export function parseCSV(csv: string): ProductCSVRow[] {
  const lines = csv.trim().split("\n");
  const rows: ProductCSVRow[] = [];
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parse (handles quoted fields)
    const cols: string[] = [];
    let inQuotes = false;
    let current = "";
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());

    if (cols.length >= 4 && cols[0]) {
      rows.push({
        name: cols[0] || "",
        slug: cols[1] || "",
        description: cols[2] || "",
        category: cols[3] || "dresses",
        price: cols[4] || "0",
        salePrice: cols[5] || "",
        images: cols[6] || "",
        sizes: cols[7] || "",
        colors: cols[8] || "",
        stockQuantity: cols[9] || "0",
        sku: cols[10] || "",
        weightGrams: cols[11] || "500",
        featured: cols[12] || "false",
        isActive: cols[13] || "true",
        badge: cols[14] || "",
      });
    }
  }
  return rows;
}

/* ─── Order CSV Export ─── */

export interface OrderCSVRow {
  orderNumber: string;
  date: string;
  status: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: string;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  paymentReference: string;
  trackingNumber: string;
  customerNotes: string;
}

const ORDER_CSV_HEADER = "orderNumber,date,status,customerName,customerEmail,shippingAddress,items,subtotal,shipping,discount,total,paymentReference,trackingNumber,customerNotes\n";

export function ordersToCSV(orders: OrderCSVRow[]): string {
  const rows = orders.map((o) =>
    [
      escapeCsv(o.orderNumber),
      escapeCsv(o.date),
      escapeCsv(o.status),
      escapeCsv(o.customerName),
      escapeCsv(o.customerEmail),
      escapeCsv(o.shippingAddress),
      escapeCsv(o.items),
      o.subtotal,
      o.shipping,
      o.discount,
      o.total,
      escapeCsv(o.paymentReference),
      escapeCsv(o.trackingNumber),
      escapeCsv(o.customerNotes),
    ].join(",")
  );
  return ORDER_CSV_HEADER + rows.join("\n");
}

export function downloadCSV(csv: string, filename = "pacifika-products.csv") {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
