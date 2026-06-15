import type { Metadata } from "next";
import "./globals.css";
import { themeInitScript } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Zig Beacon — Product Intelligence Platform",
  description:
    "Internal product intelligence and global mobility research platform for ComfortDelGro Zig",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
