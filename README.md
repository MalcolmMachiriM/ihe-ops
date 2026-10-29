# IHE Ops

Quoting, invoicing, and receipting for [Infinite Hardware & Electrical](https://www.ihe.co.zw/) (Gweru, Zimbabwe).

IHE typically does **not** hold warehouse stock. Client requests are sourced from suppliers on demand, then turned into quotes, invoices, and receipts.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Neon Postgres** + Drizzle ORM (`DATABASE_URL` is required)
- **Clerk** for staff sign-in (Admin, Sales, Accounts)
- Hosted on **Vercel**

## Features in this slice

- Staff sign-in with Admin, Sales, and Accounts roles
- Dashboard with enquiry / quote / receivable snapshot
- Enquiry intake and quote builder with supplier cost, markup, and margin
- Proforma or invoice from a sent quote, then payment and automatic receipt
- Downloadable quote, invoice, and receipt PDFs

## Local development

```bash
npm install
npm run dev
```

App runs at [http://localhost:43127](http://localhost:43127).

### Database and sign-in

1. Create a Neon project and copy the connection string.
2. Create a Clerk application and copy the API keys.
3. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` plus the Clerk keys.
4. In Clerk, set each staff user's public metadata to `{ "role": "admin" }`, `"sales"`, or `"accounts"`, and add `{ "metadata": "{{user.public_metadata}}" }` to the session token.
5. Apply the schema and load the sample job:

```bash
npm run db:migrate
npm run db:seed
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
| `npm run db:seed` | Load sample customers, quotes, and a receipt |
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

Tracked checklist: [PLAN.md](PLAN.md). Phases 1–4 are in the app. After setting `DATABASE_URL`, run `npm run db:migrate` and `npm run db:seed`. Supplier reply files need `BLOB_READ_WRITE_TOKEN`. Quote emails need `RESEND_API_KEY` and `NEXT_PUBLIC_APP_URL`. Website contact intake from ihe-site needs `INTAKE_API_KEY` (site sends the same value as `OPS_INTAKE_API_KEY`).
