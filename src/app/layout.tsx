import type { Metadata, Viewport } from "next";
import { Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { CartProvider } from "@/contexts/CartContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lah Gabin — Es Gabin Aneka Rasa",
  description: "Es Gabin kekinian, dingin di hati, renyah di lidah! Pesan online sekarang.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F17" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${montserrat.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <body className={`min-h-screen ${plusJakarta.className} font-sans bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased transition-colors selection:bg-blue-600 selection:text-white`}>
        <ThemeProvider>
          <StoreProvider>
            <CartProvider>{children}</CartProvider>
          </StoreProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}