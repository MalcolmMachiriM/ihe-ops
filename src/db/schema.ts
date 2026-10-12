import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new",
  "sourcing",
  "quoted",
  "won",
  "lost",
  "expired",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "proforma",
  "issued",
  "partial",
  "paid",
  "void",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "ecocash",
  "bank_transfer",
  "swipe",
  "other",
]);

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  company: varchar("company", { length: 255 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  categories: text("categories"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const enquiries = pgTable("enquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: enquiryStatusEnum("status").notNull().default("new"),
  urgency: varchar("urgency", { length: 32 }).default("normal"),
  source: varchar("source", { length: 64 }).default("phone"),
  neededBy: timestamp("needed_by", { withTimezone: true }),
  assignedTo: varchar("assigned_to", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 64 }).notNull().unique(),
  enquiryId: uuid("enquiry_id").references(() => enquiries.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  status: quoteStatusEnum("status").notNull().default("draft"),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  notes: text("notes"),
  terms: text("terms"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quoteLines = pgTable("quote_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  description: text("description").notNull(),
  brand: varchar("brand", { length: 128 }),
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull().default("1"),
  unit: varchar("unit", { length: 32 }).notNull().default("ea"),
  costPrice: numeric("cost_price", { precision: 14, scale: 2 }).notNull().default("0"),
  sellPrice: numeric("sell_price", { precision: 14, scale: 2 }).notNull().default("0"),
  leadTimeDays: integer("lead_time_days"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 64 }).notNull().unique(),
  quoteId: uuid("quote_id").references(() => quotes.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  description: text("description").notNull(),
  brand: varchar("brand", { length: 128 }),
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull().default("1"),
  unit: varchar("unit", { length: 32 }).notNull().default("ea"),
  costPrice: numeric("cost_price", { precision: 14, scale: 2 }).notNull().default("0"),
  sellPrice: numeric("sell_price", { precision: 14, scale: 2 }).notNull().default("0"),
  leadTimeDays: integer("lead_time_days"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  method: paymentMethodEnum("method").notNull().default("bank_transfer"),
  reference: varchar("reference", { length: 128 }),
  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const receipts = pgTable("receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 64 }).notNull().unique(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
});
