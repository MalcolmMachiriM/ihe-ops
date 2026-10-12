export const QUOTE_SLA_HOURS = 24;

export function quoteSla(
  openedAt: Date | string,
  quotedAt: Date | string | null,
  now = new Date(),
) {
  const opened = new Date(openedAt);
  const end = quotedAt ? new Date(quotedAt) : now;
  const hours = (end.getTime() - opened.getTime()) / 36e5;

  if (quotedAt) {
    const late = hours > QUOTE_SLA_HOURS;
    return {
      label: late ? `Quoted late · ${formatHours(hours)}` : `Quoted in ${formatHours(hours)}`,
      tone: late ? "late" : "met",
    } as const;
  }

  const remaining = QUOTE_SLA_HOURS - hours;
  if (remaining >= 0) {
    return { label: `${formatHours(remaining)} left of 24h`, tone: "open" } as const;
  }
  return { label: `Overdue ${formatHours(-remaining)}`, tone: "overdue" } as const;
}

function formatHours(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  return `${Math.round(hours)}h`;
}
