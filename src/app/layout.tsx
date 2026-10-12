import type { Metadata } from "next";
import { Archivo, Figtree } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IHE Ops · Quoting, Invoicing & Receipting",
  description:
    "Infinite Hardware & Electrical operations system for supplier-sourced quotes, invoices, and receipts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
