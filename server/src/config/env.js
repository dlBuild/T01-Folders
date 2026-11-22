require("dotenv").config();

const get = (key, fallback = "") => (process.env[key] ?? fallback).toString().trim();

const env = {
  nodeEnv: get("NODE_ENV", "development"),
  port: parseInt(get("PORT", "5000"), 10),
  clientUrl: get("CLIENT_URL", "http://localhost:5173").replace(/\/$/, ""),
  serverPublicUrl: get("SERVER_PUBLIC_URL").replace(/\/$/, ""),
  mongoUri: get("MONGO_URI"),
  dataDir: get("DATA_DIR"), // optional: persistent-disk folder for uploaded thumbnails/files (e.g. /var/data)
  jwtSecret: get("JWT_SECRET"),
  jwtExpire: get("JWT_EXPIRE", "7d"),
  payment: {
    mode: get("PAYMENT_MODE", "mock"), // "mock" | "cashfree"
    env: get("CASHFREE_ENV", "sandbox"), // "sandbox" | "production"
    appId: get("CASHFREE_APP_ID"),
    secret: get("CASHFREE_SECRET_KEY"),
    apiVersion: get("CASHFREE_API_VERSION", "2023-08-01"),
  },
  mail: {
    host: get("EMAIL_HOST"),
    port: parseInt(get("EMAIL_PORT", "587"), 10),
    user: get("EMAIL_USER"),
    pass: get("EMAIL_PASS"),
    from: get("EMAIL_FROM", "T01 <no-reply@t01.example>"),
  },
  admin: {
    name: get("ADMIN_NAME", "T01 Admin"),
    email: get("ADMIN_EMAIL", "admin@t01.local"),
    password: get("ADMIN_PASSWORD", "ChangeMe@123"),
    phone: get("ADMIN_PHONE", "9999999999"),
  },
};

env.isProd = env.nodeEnv === "production";

// Fail fast on misconfiguration
const problems = [];
if (!env.mongoUri) problems.push("MONGO_URI is required");
if (!env.jwtSecret || env.jwtSecret.length < 16) problems.push("JWT_SECRET is required (min 16 characters)");
if (!["mock", "cashfree"].includes(env.payment.mode)) problems.push("PAYMENT_MODE must be \"mock\" or \"cashfree\"");
if (env.payment.mode === "cashfree" && (!env.payment.appId || !env.payment.secret)) {
  problems.push("CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required when PAYMENT_MODE=cashfree");
}
if (env.isProd && (/change-me|t01-|secret|password/i.test(env.jwtSecret) || env.jwtSecret.length < 32)) {
  problems.push("JWT_SECRET looks like a placeholder or is too short for production (use 48+ random bytes)");
}
if (env.isProd && env.admin.password === "ChangeMe@123") problems.push("ADMIN_PASSWORD must be changed from the default before production");
if (env.isProd && !env.clientUrl.startsWith("https://")) problems.push("CLIENT_URL must be https:// in production");
if (env.isProd && env.payment.mode === "cashfree" && !env.serverPublicUrl.startsWith("https://")) problems.push("SERVER_PUBLIC_URL (https) is required in production so Cashfree webhooks can reach you");
if (env.isProd && env.payment.mode === "mock") problems.push("PAYMENT_MODE=mock is not allowed in production");

if (problems.length) {
  console.error("[T01] Configuration error:\n - " + problems.join("\n - "));
  process.exit(1);
}

module.exports = env;
