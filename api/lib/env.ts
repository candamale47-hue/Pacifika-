import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: required("OWNER_UNION_ID"),
  // Square
  squareApplicationId: process.env.SQUARE_APPLICATION_ID ?? "",
  squareAccessToken: process.env.SQUARE_ACCESS_TOKEN ?? "",
  squareLocationId: process.env.SQUARE_LOCATION_ID ?? "",
  squareEnvironment: process.env.SQUARE_ENVIRONMENT ?? "sandbox",
  // SMTP Email
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587", 10),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "info@pacifikawear.com.au",
  adminEmail: process.env.ADMIN_EMAIL ?? "info@pacifikawear.com.au",
};
