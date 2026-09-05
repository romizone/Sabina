# Sabina — Live CS Bang Digital

Customer Service live untuk bank digital fiksi **Bang Digital**.  
Produksi: [https://sabina.rominur.com](https://sabina.rominur.com)

Sabina memakai **DeepRomeo** di tampilan nasabah, data mock CIF / simpanan / pinjaman / kartu / ATM / wealth, mutasi 10 tahun yang selalu dihitung dari tanggal hari ini, plus ratusan SOP RAG. Pertanyaan di luar perbankan ditolak guardrail.

## Menjalankan lokal

```bash
cp .env.example .env.local
# isi DEEPSEEK_API_KEY
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) lalu **CHAT SABINA**.

Tanpa API key, Sabina tetap menjawab dari data mock + SOP (mode fallback).

## Deploy ke sabina.rominur.com

Produksi di Vercel, domain `sabina.rominur.com` (wildcard `*.rominur.com`).

```bash
# env wajib di Vercel: DEEPSEEK_API_KEY, DEEPSEEK_MODEL, NEXT_PUBLIC_APP_URL
vercel --prod
vercel domains add sabina.rominur.com
```

Self-host alternatif: `docker compose up -d --build` lalu Caddy di `Caddyfile`.

## Demo nasabah

Pilih CIF di panel kiri chat, misalnya Ierfan Syuckhur (`1001001000`) atau Somat Gzodin (`1001001001`).
