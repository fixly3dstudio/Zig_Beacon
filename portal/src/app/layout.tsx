import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { PageTransition } from "@/components/page-transition";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto max-w-[1200px] px-8 py-8">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
