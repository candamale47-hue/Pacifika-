import "dotenv/config";
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM;
const admin = process.env.ADMIN_EMAIL;

if (!host || !user || !pass) {
  console.error("FAIL: SMTP not fully configured in .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { rejectUnauthorized: false },
});

try {
  await transporter.verify();
  console.log("OK: SMTP connection verified");
} catch (err) {
  console.error("FAIL: SMTP verify error:", err.message);
  process.exit(1);
}

const testTo = process.argv[2] || admin;
try {
  await transporter.sendMail({
    from: `"Pacifika Wear Test" <${from}>`,
    to: testTo,
    subject: "Pacifika Wear - Email Test",
    text: "If you received this, SMTP is working.",
  });
  console.log("OK: Test email sent to", testTo);
} catch (err) {
  console.error("FAIL: Send error:", err.message);
  process.exit(1);
}
