import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BCH Close — Invoice reconciliation",
  description: "Compare invoice ledgers with Bitcoin Cash receipts, review exceptions, and export traceable reports.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
