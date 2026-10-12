export function lineMargin(quantity: number, cost: number, sell: number) {
  const value = quantity * (sell - cost);
  const percent = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
  return { value, percent };
}

export function quoteMargin(
  lines: { quantity: number; cost: number; sell: number }[],
) {
  const cost = lines.reduce((sum, line) => sum + line.quantity * line.cost, 0);
  const sell = lines.reduce((sum, line) => sum + line.quantity * line.sell, 0);
  const value = sell - cost;
  const percent = sell > 0 ? (value / sell) * 100 : 0;
  return { cost, sell, value, percent };
}
