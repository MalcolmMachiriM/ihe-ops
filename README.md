# IHE Ops

Quoting, invoicing, and receipting for [Infinite Hardware & Electrical](https://www.ihe.co.zw/) (Gweru, Zimbabwe).

IHE typically does **not** hold warehouse stock. Client requests are sourced from suppliers on demand, then turned into quotes, invoices, and receipts.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Neon Postgres** + Drizzle ORM (schema ready; app runs on mock data until `DATABASE_URL` is set)
- Hosted on **Vercel**

## Features in this slice

- Dashboard with enquiry / quote / receivable snapshot
- Enquiries pipeline (new → sourcing → quoted)
- Quotes with supplier cost vs sell price and lead times
- Invoices (including proforma) and balances
- Receipts linked to payments
- Customers and suppliers directories
- Postgres schema for the full source-to-receipt flow

## Local development

```bash
npm install
npm run dev
```

App runs at [http://127.0.0.1:43127](http://127.0.0.1:43127).

### Optional: Neon database

1. Create a Neon project and copy the connection string.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
3. Run migrations when you are ready to leave mock mode:

```bash
npm run db:generate
npm run db:migrate
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 43127 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Suggested local folder

On your machine, keep this repo next to your other projects, for example:

```text
~/Projects/
  risk-chatbot/
  caimex/
  ihe-ops/          ← this app
```

## Next build steps

1. Wire Neon and replace mock data with live queries
2. Enquiry → supplier RFQ → quote builder forms
3. Convert quote → proforma/invoice → payment → receipt
4. PDF generation + WhatsApp/email send
5. Staff auth and roles
