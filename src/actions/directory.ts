"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { customers, suppliers } from "@/db/schema";
import { guardRole } from "@/lib/auth";
import {
  type ActionState,
  type CreatePartyState,
  customerSchema,
  field,
  optionalId,
  supplierSchema,
  zodError,
} from "@/lib/schemas";

function blankToNull(value: string) {
  return value ? value : null;
}

export async function saveCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;

  const parsed = customerSchema.safeParse({
    id: optionalId(field(formData, "id")),
    name: field(formData, "name"),
    contactPerson: field(formData, "contactPerson"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    company: field(formData, "company"),
    address: field(formData, "address"),
    notes: field(formData, "notes"),
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const values = {
    name: data.name,
    contactPerson: blankToNull(data.contactPerson),
    email: blankToNull(data.email),
    phone: blankToNull(data.phone),
    company: blankToNull(data.company),
    address: blankToNull(data.address),
    notes: blankToNull(data.notes),
    updatedAt: new Date(),
  };

  const db = getDb();
  if (data.id) {
    await db.update(customers).set(values).where(eq(customers.id, data.id));
    revalidatePath("/customers");
    revalidatePath(`/customers/${data.id}`);
    redirect(`/customers/${data.id}`);
  }

  const [created] = await db.insert(customers).values(values).returning({ id: customers.id });
  revalidatePath("/customers");
  redirect(`/customers/${created.id}`);
}

export async function saveSupplier(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;

  const parsed = supplierSchema.safeParse({
    id: optionalId(field(formData, "id")),
    name: field(formData, "name"),
    contactPerson: field(formData, "contactPerson"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    categories: field(formData, "categories"),
    notes: field(formData, "notes"),
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const values = {
    name: data.name,
    contactPerson: blankToNull(data.contactPerson),
    email: blankToNull(data.email),
    phone: blankToNull(data.phone),
    categories: blankToNull(data.categories),
    notes: blankToNull(data.notes),
    updatedAt: new Date(),
  };

  const db = getDb();
  if (data.id) {
    await db.update(suppliers).set(values).where(eq(suppliers.id, data.id));
    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${data.id}`);
    redirect(`/suppliers/${data.id}`);
  }

  const [created] = await db.insert(suppliers).values(values).returning({ id: suppliers.id });
  revalidatePath("/suppliers");
  redirect(`/suppliers/${created.id}`);
}

export async function createCustomerQuick(
  _prev: CreatePartyState,
  formData: FormData,
): Promise<CreatePartyState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;

  const parsed = customerSchema.safeParse({
    name: field(formData, "name"),
    contactPerson: field(formData, "contactPerson"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    company: field(formData, "company"),
    address: "",
    notes: "",
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const db = getDb();
  const [created] = await db
    .insert(customers)
    .values({
      name: data.name,
      contactPerson: blankToNull(data.contactPerson),
      email: blankToNull(data.email),
      phone: blankToNull(data.phone),
      company: blankToNull(data.company),
    })
    .returning({ id: customers.id, name: customers.name });

  revalidatePath("/customers");
  revalidatePath("/quotes");
  revalidatePath("/quotes/new");
  revalidatePath("/enquiries");
  return created;
}

export async function createSupplierQuick(
  _prev: CreatePartyState,
  formData: FormData,
): Promise<CreatePartyState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;

  const parsed = supplierSchema.safeParse({
    name: field(formData, "name"),
    contactPerson: field(formData, "contactPerson"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    categories: "",
    notes: "",
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const db = getDb();
  const [created] = await db
    .insert(suppliers)
    .values({
      name: data.name,
      contactPerson: blankToNull(data.contactPerson),
      email: blankToNull(data.email),
      phone: blankToNull(data.phone),
    })
    .returning({ id: suppliers.id, name: suppliers.name });

  revalidatePath("/suppliers");
  revalidatePath("/quotes");
  revalidatePath("/quotes/new");
  return created;
}
