export const staffRoles = ["admin", "sales", "accounts"] as const;

export type StaffRole = (typeof staffRoles)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && staffRoles.includes(value as StaffRole);
}

export function canManageDirectory(role: StaffRole) {
  return role === "admin" || role === "sales";
}

export function canManageEnquiries(role: StaffRole) {
  return role === "admin" || role === "sales";
}

export function canEditQuotes(role: StaffRole) {
  return role === "admin" || role === "sales";
}

export function canCreateProforma(role: StaffRole) {
  return role === "admin" || role === "sales";
}

export function canIssueInvoice(role: StaffRole) {
  return role === "admin" || role === "accounts";
}

export function canRecordPayment(role: StaffRole) {
  return role === "admin" || role === "accounts";
}
