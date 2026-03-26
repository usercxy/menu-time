import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu Time Backend",
  description: "Stage 0 backend foundation for 食光记",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
