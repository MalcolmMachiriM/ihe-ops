export const currencies = ["USD", "ZiG"] as const;

export type CurrencyCode = (typeof currencies)[number];

export function isCurrency(value: string): value is CurrencyCode {
  return currencies.includes(value as CurrencyCode);
}
