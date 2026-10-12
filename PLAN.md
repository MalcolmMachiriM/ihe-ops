# IHE Ops — Delivery checklist

Day-to-day system for Infinite Hardware & Electrical: take client requests, source from suppliers (no warehouse stock), quote, invoice, collect payment, and issue receipts. Hosted on Vercel.

**Core loop:** source → quote → order → bill → receipt. This is not an inventory POS.

**Done for the product when:** a full job can be completed in the app without spreadsheets — enquiry → sourced quote → accepted → deposit/invoice → receipt.

## Locked stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router) + TypeScript + Tailwind + shadcn |
| DB | Neon Postgres + Drizzle |
| Hosting | Vercel |
| Files | Vercel Blob (PDFs and attachments) |
| Auth | Clerk (`publicMetadata.role`: `admin`, `sales`, or `accounts`) |
| Email (later) | Resend |

## Already in the scaffold

Checked items below are already true. Unchecked items are the remaining work.

- [x] Next.js + Tailwind + shadcn list UI: Dashboard, Enquiries, Quotes, Invoices, Receipts, Customers, Suppliers
- [x] Drizzle schema in `src/db/schema.ts`: customers, suppliers, enquiries (`new` → `sourcing` → `quoted` → `won` / `lost` / `expired`), quotes and lines (supplier, cost, sell, lead time, version), invoices, payments (`cash`, `ecocash`, `bank_transfer`, `swipe`, `other`), receipts
- [x] `src/db/index.ts` requires `DATABASE_URL` and uses a Neon pool so payments and receipts can share a transaction
- [x] `drizzle.config.ts` and `.env.example` are ready for a Neon connection string and Clerk
- [x] `drizzle/` migration is generated (`invoice_lines` included). Apply it with `npm run db:migrate`, then `npm run db:seed`, once `DATABASE_URL` is set
- [x] Live queries — pages read Postgres. `src/lib/mock-data.ts` is only the seed source
- [x] Write flows — create and edit customers, suppliers, enquiries, and quotes; convert a quote; record a payment
- [x] Clerk staff auth and PDF download
- [ ] Vercel Blob and Resend — later phases

## Session order

Work top to bottom. Tick a session when its “done when” is true.

- [ ] **1. Neon + migrations + seed** — migration and seed script are in the repo. Tick this after `npm run db:migrate` and `npm run db:seed` against Neon
- [x] **2. Auth + protect the app** — Clerk. Unsigned-in staff are sent to `/sign-in`. Roles: Admin, Sales, Accounts
- [x] **3. Enquiry + quote create/edit**
- [x] **4. Invoice + payment + receipt**
- [x] **5. PDFs** — quote, invoice, and receipt download
- [ ] **6. Sourcing compare + PO**
- [ ] **7. Reports** — pipeline and margin

## Phase 1 — Make it real (MVP)

Ship what staff use every day.

- [ ] Wire `DATABASE_URL`, migrate the schema, replace mock data (session 1 — run migrate and seed locally)
- [x] Staff auth and roles: Admin / Sales / Accounts (Clerk)
- [x] CRUD: customers and suppliers
- [x] Enquiry intake: WhatsApp / phone / email source, urgency, specs
- [x] Supplier cost lines → quote with markup, validity, and version
- [x] Convert quote → proforma / invoice
- [x] Record payment → auto receipt (cash, EcoCash, bank, swipe)
- [x] PDF quote / invoice / receipt + download (store files in Vercel Blob later)

**Done when:** a full job can be completed in the app without spreadsheets.

## Phase 2 — Sourcing workflow

Match how IHE actually prices.

- [ ] Enquiry status in the UI: New → Sourcing → Quoted → Won / Lost / Expired (enum already exists)
- [ ] Internal supplier RFQ notes and attached supplier replies
- [ ] Side-by-side supplier compare (price, lead time, brand)
- [ ] Choose winning lines → generate the client quote
- [ ] Optional: purchase order to the supplier after the client accepts or pays a deposit
- [ ] Quote SLA tracking against a ~24h target

**Done when:** sales can show which supplier priced each line and why that quote was issued.

## Phase 3 — Money and ops polish

- [ ] Partial payments, deposits, credit notes
- [ ] Customer statements and receivables ageing
- [ ] Margin reports (by quote, category, salesperson)
- [ ] Document numbering (`ENQ` / `QT` / `INV` / `RCP`) with year sequences
- [ ] Multi-currency if needed (USD / ZiG)
- [ ] Email / WhatsApp send of PDFs (Resend + share links)

**Done when:** accounts can reconcile who owes what, and management can see pipeline and margin.

## Phase 4 — Only if needed

- [ ] Client portal (view and accept quotes)
- [ ] Light product templates (“last known cost”) — still not full stock
- [ ] Approvals for low-margin quotes and large discounts
- [ ] Audit log of price and term changes
- [ ] Mobile-friendly field use for sales on site

## Out of scope

Unless IHE later holds stock: warehouse quantities, barcodes, e-commerce checkout, full ERP.

## Success metrics

- A quote can be issued within the turnaround target from one screen
- Every invoice and receipt links back to a quote and a customer
- Cost vs sell (margin) is visible before a quote is sent
- No parallel spreadsheet is required for open jobs
