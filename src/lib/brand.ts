import { readFile } from "node:fs/promises";
import path from "node:path";

export const brand = {
  company: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Infinite Hardware & Electrical",
  legalName: "Infinite Hardware and Electrical",
  tagline: "Infinite Solutions",
  address: "160 Marks Road, Gweru.",
  phones: ["+263 774 411 186", "+263 712 167 281"],
  email: "ihardware19@gmail.com",
  colors: {
    ink: "#0f172a",
    muted: "#475569",
    line: "#cbd5e1",
    accent: "#7c3aed",
    accentSoft: "#38bdf8",
    page: "#ffffff",
  },
} as const;

export function companyName() {
  return brand.company;
}

export function letterheadPngPath() {
  return path.join(process.cwd(), "public/brand/IHE_Letter_Head.png");
}

export function letterheadDocxPath() {
  return path.join(process.cwd(), "public/brand/IHE_Letter_Head.docx");
}

export async function letterheadPngBuffer() {
  return readFile(letterheadPngPath());
}

export async function letterheadDocxBuffer() {
  return readFile(letterheadDocxPath());
}
