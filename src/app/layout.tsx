import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { APP_URL, BANK_NAME } from "@/lib/config";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `Sabina | Customer Service ${BANK_NAME}`,
    template: `%s | ${BANK_NAME}`,
  },
  description:
    "Sabina, live Customer Service Bank Digital Bang Digital. Bantuan rekening, transaksi, kartu, pinjaman, dan investasi.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: `Sabina | ${BANK_NAME}`,
    description: "Live Customer Service bank digital.",
    url: APP_URL,
    siteName: BANK_NAME,
    locale: "id_ID",
    type: "website",
    images: [{ url: "/images/sabina-hero.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${sans.variable} antialiased`}>{children}</body>
    </html>
  );
}
