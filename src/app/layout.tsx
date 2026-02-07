import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "remixicon/fonts/remixicon.css";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "THW music",
  description: "A premium music player",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "THW music",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Script src="https://static.geetest.com/v4/gt4.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
