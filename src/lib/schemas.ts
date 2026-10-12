import { z } from "zod";

const optionalText = z.string().trim().optional().default("");

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required"),
  contactPerson: optionalText,
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a valid email",
    })
    .optional()
    .default(""),
  phone: optionalText,
  company: optionalText,
  address: optionalText,
  notes: optionalText,
});

export const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required"),
  contactPerson: optionalText,
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a valid email",
    })
    .optional()
    .default(""),
  phone: optionalText,
  categories: optionalText,
  notes: optionalText,
});

export const enquirySchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid("Choose a customer"),
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  source: z.enum(["whatsapp", "phone", "email"]),
  urgency: z.enum(["low", "normal", "high"]),
  status: z.enum(["new", "sourcing", "quoted", "won", "lost", "expired"]),
  neededBy: z.string().optional().default(""),
});

export const quoteLineSchema = z.object({
  description: z.string().trim().min(1, "Each line needs a description"),
  brand: z.string().trim().default(""),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unit: z.string().trim().min(1).default("ea"),
  supplierId: z.string().uuid("Each line needs a supplier"),
  costPrice: z.number().min(0, "Cost cannot be negative"),
  sellPrice: z.number().min(0, "Sell price cannot be negative"),
  leadTimeDays: z.number().int().min(0).nullable(),
});

export const quoteSchema = z.object({
  id: z.string().uuid().optional(),
  enquiryId: z.string().uuid().optional(),
  customerId: z.string().uuid("Choose a customer"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
  currency: z.string().trim().min(3).max(8).default("USD"),
  validUntil: z.string().optional().default(""),
  notes: optionalText,
  terms: optionalText,
  lines: z.array(quoteLineSchema).min(1, "Add at least one line"),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive("Enter a payment amount"),
  method: z.enum(["cash", "ecocash", "bank_transfer", "swipe"]),
  reference: optionalText,
  paidAt: z.string().min(1, "Payment date is required"),
});

export type ActionState = { error: string } | null;

export function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function optionalId(value: string) {
  return value ? value : undefined;
}

export function zodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
