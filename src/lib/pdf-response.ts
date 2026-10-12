import { NextResponse } from "next/server";

export function pdfResponse(buffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function companyName() {
  return process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Infinite Hardware & Electrical";
}
