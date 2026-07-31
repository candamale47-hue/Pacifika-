import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort || 587,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
      tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
}

const FROM_EMAIL = env.smtpFrom;
const ADMIN_EMAIL = env.adminEmail;

/** Statuses that trigger a customer notification email (excludes received — covered by order confirmation). */
export const CUSTOMER_STATUS_EMAIL_STATUSES = new Set([
  "processing",
  "packed",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "cancelled",
]);

function fromHeader() { return `"Pacifika Wear" <${FROM_EMAIL}>`; }

function formatCurrency(n: number): string { return `$${Number(n).toFixed(2)}`; }

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: "Payment Received", processing: "Being Processed",
    shipped: "Shipped", delivered: "Delivered",
    ready_for_pickup: "Ready for Pickup", packed: "Packed",
    cancelled: "Cancelled", pending_payment: "Awaiting Payment",
  };
  return labels[status] ?? status;
}

const emailStyles = `
<style>
body { margin:0; padding:0; background:#f4f4f4; font-family:Arial,Helvetica,sans-serif; }
.container { max-width:600px; margin:0 auto; background:#fff; }
.header { background:#1B2432; padding:28px 24px; text-align:center; }
.header h1 { color:#fff; margin:0; font-size:22px; letter-spacing:1px; }
.header p { color:#D4AF37; margin:6px 0 0; font-size:13px; }
.content { padding:28px 24px; }
.section { margin-bottom:24px; }
.section h2 { color:#1B2432; font-size:16px; margin:0 0 12px; padding-bottom:8px; border-bottom:2px solid #D4AF37; }
.label { color:#666; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
.value { color:#1B2432; font-size:14px; font-weight:600; }
.grid { display:flex; flex-wrap:wrap; gap:16px; }
.grid-half { width:48%; }
table.items { width:100%; border-collapse:collapse; margin-top:8px; }
table.items th { background:#f8f8f8; padding:10px 8px; text-align:left; font-size:12px; color:#666; border-bottom:1px solid #e0e0e0; }
table.items td { padding:10px 8px; border-bottom:1px solid #f0f0f0; font-size:13px; vertical-align:middle; }
.total-row { background:#f8f8f8; font-weight:bold; }
.total-row td { padding:12px 8px; font-size:14px; }
.status-badge { display:inline-block; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:bold; text-transform:uppercase; }
.status-received { background:#e8f5e9; color:#2e7d32; }
.status-processing { background:#fff3e0; color:#ef6c00; }
.status-shipped { background:#e3f2fd; color:#1565c0; }
.status-delivered { background:#e8f5e9; color:#1b5e20; }
.status-ready_for_pickup { background:#f3e5f5; color:#6a1b9a; }
.status-packed { background:#e0f7fa; color:#00838f; }
.status-cancelled { background:#ffebee; color:#c62828; }
.footer { background:#1B2432; padding:20px 24px; text-align:center; color:#aaa; font-size:11px; }
.footer a { color:#D4AF37; text-decoration:none; }
.cta { display:inline-block; background:#D4AF37; color:#1B2432; padding:12px 28px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:13px; margin-top:8px; }
.note { background:#f8f8f8; padding:14px; border-radius:4px; font-size:12px; color:#555; border-left:3px solid #D4AF37; }
@media(max-width:480px) { .grid-half { width:100%; } }
</style>`;

async function sendEmail(opts: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  const mailer = getTransporter();
  if (!mailer) {
    const msg = `[Email] SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env) — skipped: ${opts.subject}`;
    console.error(msg);
    throw new Error(msg);
  }
  const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
  try {
    await mailer.sendMail({ from: fromHeader(), to: opts.to, subject: opts.subject, html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Pacifika Wear</title>${emailStyles}</head><body><div class="container"><div class="header"><h1>Pacifika Wear</h1><p>Pacific Island Fashion · Cairns, Queensland</p></div>${opts.html}<div class="footer"><p style="margin:0 0 8px;">22 Craven Street, Redlynch, QLD 4870<br/>ABN 17 121 686 746 · <a href="https://pacifikawear.com.au">pacifikawear.com.au</a></p><p style="margin:0;font-size:10px;color:#666;">This is an automated message. Please do not reply directly to this email.<br/>For enquiries, contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a></p></div></div></body></html>`, replyTo: opts.replyTo || ADMIN_EMAIL });
    console.log(`[Email] Sent "${opts.subject}" to ${to}`);
  } catch (err) {
    console.error(`[Email] Failed "${opts.subject}" to ${to}:`, err);
    throw err;
  }
}

export async function sendOrderConfirmationCustomer(order: any, items: any[]) {
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-AU");
  const itemRows = items.map(i => `<tr><td>${i.productName}</td><td>${i.size ?? "-"}</td><td>${i.color ?? "-"}</td><td>${i.quantity}</td><td>${formatCurrency(Number(i.unitPrice))}</td><td>${formatCurrency(Number(i.totalPrice))}</td></tr>`).join("");
  const shipping = Number(order.shippingCost ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  const totals = `<table class="items"><tr><td colspan="5" style="text-align:right;border:none;">Subtotal:</td><td style="border:none;font-weight:600;">${formatCurrency(Number(order.subtotal))}</td></tr>${discount > 0 ? `<tr><td colspan="5" style="text-align:right;border:none;color:#2e7d32;">Discount:</td><td style="border:none;color:#2e7d32;">-${formatCurrency(discount)}</td></tr>` : ""}${shipping > 0 ? `<tr><td colspan="5" style="text-align:right;border:none;">Shipping:</td><td style="border:none;font-weight:600;">${formatCurrency(shipping)}</td></tr>` : `<tr><td colspan="5" style="text-align:right;border:none;">Shipping:</td><td style="border:none;color:#2e7d32;">FREE</td></tr>`}<tr class="total-row"><td colspan="5" style="text-align:right;">TOTAL (AUD):</td><td>${formatCurrency(Number(order.total))}</td></tr></table>`;
  await sendEmail({ to: order.shippingEmail, subject: `Order Confirmation - ${order.orderNumber}`, html: `<div class="content"><div style="text-align:center;margin-bottom:24px;"><span class="status-badge status-${order.status}">${statusLabel(order.status)}</span></div><p style="font-size:15px;color:#333;">Hi <strong>${order.shippingName}</strong>,<br/><br/>Thank you for your order! We've received it and are preparing your Pacific Island fashion items.</p><div class="section"><h2>Order Summary</h2><div class="grid"><div class="grid-half"><div class="label">Order Number</div><div class="value">${order.orderNumber}</div></div><div class="grid-half"><div class="label">Order Date</div><div class="value">${dateStr}</div></div></div><div class="section"><h2>Items Ordered</h2><table class="items"><thead><tr><th>Product</th><th>Size</th><th>Colour</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table></div><div class="section">${totals}</div><div style="text-align:center;margin-top:28px;padding:20px;background:#f8f8f8;border-radius:4px;"><p style="margin:0 0 12px;font-size:13px;color:#555;">You can track your order status anytime:</p><a href="https://pacifikawear.com.au/track" class="cta">Track Your Order</a></div></div>` });
}

export async function sendOrderNotificationAdmin(order: any, items: any[]) {
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString("en-AU") : new Date().toLocaleString("en-AU");
  const itemRows = items.map(i => `<tr><td>${i.productName}</td><td>${i.size ?? "-"}</td><td>${i.color ?? "-"}</td><td>${i.quantity}</td><td>${formatCurrency(Number(i.unitPrice))}</td><td>${formatCurrency(Number(i.totalPrice))}</td></tr>`).join("");
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  await sendEmail({ to: ADMIN_EMAIL, subject: `New Order ${order.orderNumber} - $${Number(order.total).toFixed(2)}`, replyTo: order.shippingEmail, html: `<div class="content"><div style="text-align:center;margin-bottom:20px;"><span class="status-badge status-${order.status}">${statusLabel(order.status)}</span></div><div class="section"><h2>Order Details</h2><div class="grid"><div class="grid-half"><div class="label">Order Number</div><div class="value">${order.orderNumber}</div></div><div class="grid-half"><div class="label">Date</div><div class="value">${dateStr}</div></div><div class="grid-half"><div class="label">Total Items</div><div class="value">${totalItems}</div></div></div><div class="section"><h2>Customer</h2><div class="grid"><div class="grid-half"><div class="label">Name</div><div class="value">${order.shippingName}</div></div><div class="grid-half"><div class="label">Email</div><div class="value">${order.shippingEmail}</div></div>${order.shippingPhone ? `<div class="grid-half"><div class="label">Phone</div><div class="value">${order.shippingPhone}</div></div>` : ""}</div></div><div class="section"><h2>Items</h2><table class="items"><thead><tr><th>Product</th><th>Size</th><th>Colour</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table></div><div style="text-align:center;margin-top:20px;"><a href="https://pacifikawear.com.au/admin" class="cta">View in Admin Dashboard</a></div></div>` });
}

export async function sendStatusUpdateEmail(order: any, _items: any[], note?: string) {
  const msgs: Record<string, { title: string; msg: string }> = {
    processing: { title: "Order Processing", msg: "Your order is now being processed. We'll let you know when it ships!" },
    packed: { title: "Order Packed", msg: "Your order has been packed and is almost ready!" },
    ready_for_pickup: { title: "Ready for Pickup", msg: "Your order is ready for collection at our Redlynch store.<br/><strong>22 Craven Street, Redlynch, QLD 4870</strong><br/>Please bring your order number and a valid ID." },
    shipped: { title: "Order Shipped", msg: order.trackingNumber ? `Your order is on its way! Tracking: <strong>${order.trackingNumber}</strong>` : "Your order has been dispatched!" },
    delivered: { title: "Delivered", msg: "Your order has been delivered. We hope you love your new Pacific Island fashion!" },
    cancelled: { title: "Order Cancelled", msg: "Your order has been cancelled. Contact us if you have questions." },
  };
  const s = msgs[order.status] ?? { title: "Update", msg: "Your order status has been updated." };
  await sendEmail({ to: order.shippingEmail, subject: `${s.title} - ${order.orderNumber}`, html: `<div class="content"><div style="text-align:center;margin-bottom:24px;"><span class="status-badge status-${order.status}">${statusLabel(order.status)}</span></div><p style="font-size:15px;color:#333;">Hi <strong>${order.shippingName}</strong>,<br/><br/>${s.msg}</p>${note ? `<div class="note"><strong>Note:</strong> ${note}</div>` : ""}<div style="text-align:center;margin-top:28px;padding:20px;background:#f8f8f8;border-radius:4px;"><p style="margin:0;font-size:13px;color:#555;">Need help? Contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#D4AF37;">${ADMIN_EMAIL}</a></p></div></div>` });
}

export async function sendPasswordResetEmail(email: string, code: string, name?: string | null) {
  const greeting = name ? `Hi <strong>${name}</strong>` : "Hi";
  await sendEmail({
    to: email,
    subject: "Reset Your Pacifika Wear Password",
    html: `<div class="content">
      <p style="font-size:15px;color:#333;">${greeting},<br/><br/>We received a request to reset your password. Use the code below on the reset password page:</p>
      <div style="text-align:center;margin:28px 0;padding:24px;background:#f8f8f8;border-radius:8px;">
        <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Your reset code</p>
        <p style="margin:0;font-size:36px;font-weight:bold;color:#1B2432;letter-spacing:6px;font-family:monospace;">${code}</p>
        <p style="margin:12px 0 0;font-size:12px;color:#888;">Expires in 1 hour</p>
      </div>
      <a href="https://pacifikawear.com.au/reset-password" class="cta">Reset Password</a>
      <p style="font-size:12px;color:#888;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
}

export async function sendOrderCancellationAdmin(order: any) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Order Cancelled - ${order.orderNumber}`,
    replyTo: order.shippingEmail,
    html: `<div class="content">
      <p style="font-size:15px;color:#333;">Order <strong>${order.orderNumber}</strong> has been cancelled.</p>
      <div class="section"><h2>Customer</h2>
        <p><strong>${order.shippingName}</strong><br/>${order.shippingEmail}</p>
      </div>
      <p style="font-size:14px;color:#333;">Total: <strong>${formatCurrency(Number(order.total))}</strong></p>
    </div>`,
  });
}
