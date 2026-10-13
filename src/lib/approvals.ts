import { num, roundMoney } from "@/lib/format";

export const LOW_MARGIN_PERCENT = 15;
export const LARGE_DISCOUNT_MARKUP = 10;

export function invoiceBalance(
  total: string | number,
  paid: string | number,
  credited: string | number,
) {
  return roundMoney(num(total) - num(paid) - num(credited));
}

export function lineMarkupPercent(cost: number, sell: number) {
  if (cost <= 0) return sell > 0 ? 100 : 0;
  return ((sell - cost) / cost) * 100;
}

export function needsApproval(
  lines: { quantity: number; cost: number; sell: number }[],
  marginPercent: number,
) {
  const sell = lines.reduce((sum, line) => sum + line.quantity * line.sell, 0);
  if (sell <= 0) return false;
  if (marginPercent < LOW_MARGIN_PERCENT) return true;
  return lines.some((line) => lineMarkupPercent(line.cost, line.sell) < LARGE_DISCOUNT_MARKUP);
}

export function approvalReason(
  lines: { quantity: number; cost: number; sell: number }[],
  marginPercent: number,
) {
  const parts: string[] = [];
  if (marginPercent < LOW_MARGIN_PERCENT) {
    parts.push(`margin ${marginPercent.toFixed(1)}% is under ${LOW_MARGIN_PERCENT}%`);
  }
  if (lines.some((line) => lineMarkupPercent(line.cost, line.sell) < LARGE_DISCOUNT_MARKUP)) {
    parts.push(`a line is marked up under ${LARGE_DISCOUNT_MARKUP}%`);
  }
  return parts.join("; ");
}
