import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "./client-providers";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Decentralized Exchange",
  description: "a SC4053 project",
};

const inter = Inter({ subsets: ["latin", "latin-ext"] });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
