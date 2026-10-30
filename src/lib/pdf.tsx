import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { brand, letterheadPngBuffer } from "@/lib/brand";
import type {
  InvoiceExportInput,
  PurchaseOrderExportInput,
  QuoteExportInput,
  ReceiptExportInput,
  ReportExportInput,
  StatementExportInput,
} from "@/lib/export-types";
import { formatDate, formatMoney, num } from "@/lib/format";

const styles = StyleSheet.create({
  page: {
    paddingTop: 110,
    paddingBottom: 90,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: brand.colors.ink,
    backgroundColor: brand.colors.page,
  },
  letterhead: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  muted: { color: brand.colors.muted, marginBottom: 4 },
  block: { marginBottom: 10 },
  head: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: brand.colors.ink,
    paddingBottom: 4,
    marginTop: 14,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: brand.colors.line,
    paddingVertical: 5,
  },
  cell: { flex: 1 },
  wide: { flex: 2.4 },
  right: { flex: 1, textAlign: "right" },
  total: { marginTop: 14, fontSize: 12, fontFamily: "Helvetica-Bold" },
  note: { marginTop: 10, color: brand.colors.muted, fontSize: 9 },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
});

function DocumentShell({
  letterhead,
  title,
  subtitle,
  children,
}: {
  letterhead: Buffer;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead is decorative page chrome for @react-pdf, not an HTML image. */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={letterhead} style={styles.letterhead} fixed />

        <View style={styles.block}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.muted}>{subtitle}</Text>
        </View>
        {children}
      </Page>
    </Document>
  );
}

function LinesTable({
  lines,
  currency,
  priceLabel = "Price",
}: {
  lines: {
    description: string;
    brand?: string | null;
    quantity: string | number;
    unit: string;
    unitPrice: string | number;
  }[];
  currency: string;
  priceLabel?: string;
}) {
  return (
    <>
      <View style={styles.head}>
        <Text style={styles.wide}>Item</Text>
        <Text style={styles.cell}>Qty</Text>
        <Text style={styles.right}>{priceLabel}</Text>
        <Text style={styles.right}>Amount</Text>
      </View>
      {lines.map((line, index) => {
        const amount = num(line.quantity) * num(line.unitPrice);
        return (
          <View key={`${line.description}-${index}`} style={styles.row} wrap={false}>
            <View style={styles.wide}>
              <Text>{line.description}</Text>
              {line.brand ? <Text style={styles.muted}>{line.brand}</Text> : null}
            </View>
            <Text style={styles.cell}>
              {num(line.quantity)} {line.unit}
            </Text>
            <Text style={styles.right}>{formatMoney(line.unitPrice, currency)}</Text>
            <Text style={styles.right}>{formatMoney(amount, currency)}</Text>
          </View>
        );
      })}
    </>
  );
}

export async function quotePdf(input: QuoteExportInput & { company?: string }) {
  const letterhead = await letterheadPngBuffer();
  return renderToBuffer(
    <DocumentShell
      letterhead={letterhead}
      title={input.number}
      subtitle={`${input.customerName} · valid until ${formatDate(input.validUntil)}`}
    >
      <LinesTable lines={input.lines} currency={input.currency} />
      <Text style={styles.total}>Total {formatMoney(input.total, input.currency)}</Text>
      {input.notes ? <Text style={styles.note}>Notes: {input.notes}</Text> : null}
      {input.terms ? <Text style={styles.note}>Terms: {input.terms}</Text> : null}
    </DocumentShell>,
  );
}

export async function invoicePdf(input: InvoiceExportInput & { company?: string }) {
  const letterhead = await letterheadPngBuffer();
  const balance = num(input.total) - num(input.amountPaid) - num(input.credited ?? 0);
  return renderToBuffer(
    <DocumentShell
      letterhead={letterhead}
      title={input.number}
      subtitle={`${input.customerName} · ${input.status} · due ${formatDate(input.dueDate)}`}
    >
      <LinesTable lines={input.lines} currency={input.currency} />
      <Text style={styles.total}>Total {formatMoney(input.total, input.currency)}</Text>
      <Text>Paid {formatMoney(input.amountPaid, input.currency)}</Text>
      <Text>Credits {formatMoney(input.credited ?? 0, input.currency)}</Text>
      <Text style={styles.total}>Balance {formatMoney(balance, input.currency)}</Text>
      {input.notes ? <Text style={styles.note}>Notes: {input.notes}</Text> : null}
    </DocumentShell>,
  );
}

export async function receiptPdf(input: ReceiptExportInput & { company?: string }) {
  const letterhead = await letterheadPngBuffer();
  return renderToBuffer(
    <DocumentShell
      letterhead={letterhead}
      title={input.number}
      subtitle={`${input.customerName} · ${formatDate(input.issuedAt)}`}
    >
      <Text>Invoice {input.invoiceNumber}</Text>
      <Text>Method {input.method.replace(/_/g, " ")}</Text>
      <Text style={styles.total}>Amount {formatMoney(input.amount, input.currency)}</Text>
      {input.notes ? <Text style={styles.note}>Notes: {input.notes}</Text> : null}
    </DocumentShell>,
  );
}

export async function purchaseOrderPdf(input: PurchaseOrderExportInput) {
  const letterhead = await letterheadPngBuffer();
  return renderToBuffer(
    <DocumentShell
      letterhead={letterhead}
      title={input.number}
      subtitle={`${input.supplierName} · ${input.quoteNumber} · ${input.status}`}
    >
      <LinesTable lines={input.lines} currency={input.currency} priceLabel="Cost" />
      {input.notes ? <Text style={styles.note}>Notes: {input.notes}</Text> : null}
    </DocumentShell>,
  );
}

export async function statementPdf(input: StatementExportInput) {
  const letterhead = await letterheadPngBuffer();
  return renderToBuffer(
    <DocumentShell letterhead={letterhead} title="Customer statement" subtitle={input.customerName}>
      <View style={styles.head}>
        <Text style={styles.cell}>Date</Text>
        <Text style={styles.wide}>Item</Text>
        <Text style={styles.right}>Debit</Text>
        <Text style={styles.right}>Credit</Text>
        <Text style={styles.right}>Balance</Text>
      </View>
      {input.rows.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.row} wrap={false}>
          <Text style={styles.cell}>{formatDate(row.date)}</Text>
          <Text style={styles.wide}>{row.label}</Text>
          <Text style={styles.right}>
            {row.debit ? formatMoney(row.debit, row.currency) : "—"}
          </Text>
          <Text style={styles.right}>
            {row.credit ? formatMoney(row.credit, row.currency) : "—"}
          </Text>
          <Text style={styles.right}>{formatMoney(row.balance, row.currency)}</Text>
        </View>
      ))}
      {input.balances.map(([currency, amount]) => (
        <Text key={currency} style={styles.total}>
          Balance {currency}: {formatMoney(amount, currency)}
        </Text>
      ))}
    </DocumentShell>,
  );
}

export async function reportPdf(input: ReportExportInput) {
  const letterhead = await letterheadPngBuffer();
  return renderToBuffer(
    <DocumentShell
      letterhead={letterhead}
      title="Operations report"
      subtitle="Pipeline, margin, and receivables ageing"
    >
      <Text style={styles.sectionTitle}>Pipeline</Text>
      <View style={styles.head}>
        <Text style={styles.wide}>Status</Text>
        <Text style={styles.cell}>Currency</Text>
        <Text style={styles.cell}>Quotes</Text>
        <Text style={styles.right}>Amount</Text>
      </View>
      {input.pipeline.map((row, index) => (
        <View key={`${row.status}-${index}`} style={styles.row} wrap={false}>
          <Text style={styles.wide}>{row.status}</Text>
          <Text style={styles.cell}>{row.currency}</Text>
          <Text style={styles.cell}>{row.count}</Text>
          <Text style={styles.right}>{formatMoney(row.amount, row.currency)}</Text>
        </View>
      ))}
      <MarginBlock title="Margin by quote" rows={input.byQuote} />
      <MarginBlock title="Margin by category" rows={input.byCategory} />
      <MarginBlock title="Margin by salesperson" rows={input.bySalesperson} />
      <Text style={styles.sectionTitle}>Receivables ageing</Text>
      <View style={styles.head}>
        <Text style={styles.cell}>Currency</Text>
        <Text style={styles.right}>Current</Text>
        <Text style={styles.right}>1–30</Text>
        <Text style={styles.right}>31–60</Text>
        <Text style={styles.right}>61–90</Text>
        <Text style={styles.right}>90+</Text>
      </View>
      {input.ageing.map((row) => (
        <View key={row.currency} style={styles.row} wrap={false}>
          <Text style={styles.cell}>{row.currency}</Text>
          <Text style={styles.right}>{formatMoney(row.current, row.currency)}</Text>
          <Text style={styles.right}>{formatMoney(row.d30, row.currency)}</Text>
          <Text style={styles.right}>{formatMoney(row.d60, row.currency)}</Text>
          <Text style={styles.right}>{formatMoney(row.d90, row.currency)}</Text>
          <Text style={styles.right}>{formatMoney(row.older, row.currency)}</Text>
        </View>
      ))}
    </DocumentShell>,
  );
}

function MarginBlock({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; currency: string; cost: number; sell: number }[];
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.head}>
        <Text style={styles.wide}>Label</Text>
        <Text style={styles.cell}>Currency</Text>
        <Text style={styles.right}>Cost</Text>
        <Text style={styles.right}>Sell</Text>
        <Text style={styles.right}>Margin</Text>
      </View>
      {rows.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.row} wrap={false}>
          <Text style={styles.wide}>{row.label}</Text>
          <Text style={styles.cell}>{row.currency}</Text>
          <Text style={styles.right}>{formatMoney(row.cost, row.currency)}</Text>
          <Text style={styles.right}>{formatMoney(row.sell, row.currency)}</Text>
          <Text style={styles.right}>{formatMoney(row.sell - row.cost, row.currency)}</Text>
        </View>
      ))}
    </>
  );
}
