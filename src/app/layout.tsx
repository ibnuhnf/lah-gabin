import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { CartProvider } from "@/contexts/CartContext";

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
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased transition-colors selection:bg-accent-500 selection:text-white">
        <ThemeProvider>
          <StoreProvider>
            <CartProvider>{children}</CartProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}