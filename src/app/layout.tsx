import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import IdleLogoutProvider from "@/components/providers/IdleLogoutProvider";

export const metadata: Metadata = {
  title: "POS Rukun Jaya",
  description: "Enterprise Inventory & POS Management System",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <QueryProvider>
          <IdleLogoutProvider>
            {children}
          </IdleLogoutProvider>
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
