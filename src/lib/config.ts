export const APP_HOST = "sabina.rominur.com";
export const APP_NAME = "Sabina";
export const BANK_NAME = "Bang Digital";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  `https://${APP_HOST}`;

export const DEEPSEEK_MODEL =
  process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash-vision-exp";
export const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
export const PUBLIC_MODEL_NAME = "DeepRomeo";

export const TRANSACTION_LOOKBACK_YEARS = 10;
export const GUARDRAIL_REFUSAL =
  "Maaf ya, saya Customer Service Bang Digital, bukan kasir. Saya hanya dapat membantu rekening, transaksi, kartu, pinjaman, investasi, dan layanan perbankan.";
