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
export const GUARDRAIL_REFUSAL = `Tolak sopan, sesuaikan peran — JANGAN selalu bilang "kasir":
- Belanja/harga toko: CS bank, bukan kasir.
- Jualan/siomay/pedagang: CS bank, bukan pedagang.
- Pribadi (tinggal di mana, umur, pacar): asisten CS virtual, tidak punya rumah/alamat pribadi.
- Lainnya di luar bank: di luar tugas CS. Jangan sebut kasir.`;
