import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Segadty POS | نظام نقاط بيع سجادتى",
  description: "نظام نقاط بيع متكامل لسجادات الصلاة - إدارة المبيعات والمخزون",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
