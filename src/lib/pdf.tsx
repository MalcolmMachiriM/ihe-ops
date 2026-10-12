import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatDate, formatMoney, num } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  brand: { fontSize: 18, marginBottom: 4 },
  muted: { color: "#475569", marginBottom: 16 },
  title: { fontSize: 16, marginBottom: 8 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 6 },
  head: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#0f172a", paddingBottom: 4, marginTop: 12 },
  cell: { flex: 1 },
  wide: { flex: 2 },
  total: { marginTop: 16, fontSize: 13 },
});

type Line = {
  description: string;
  quantity: string | number;
  unit: string;
  sellPrice: string | number;
};

function DocumentShell({
  company,
  title,
  subtitle,
  children,
}: {
  company: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>{company}</Text>
        <Text style={styles.muted}>Gweru, Zimbabwe</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.muted}>{subtitle}</Text>
        {children}
      </Page>
    </Document>
  );
}

export async function quotePdf(input: {
  company: string;
  number: string;
  customerName: string;
  validUntil: Date | string | null;
  currency: string;
  total: string | number;
  lines: Line[];
}) {
  const buffer = await renderToBuffer(
    <DocumentShell
      company={input.company}
      title={input.number}
      subtitle={`${input.customerName} · valid until ${formatDate(input.validUntil)}`}
    >
      <View style={styles.head}>
        <Text style={styles.wide}>Item</Text>
        <Text style={styles.cell}>Qty</Text>
        <Text style={styles.cell}>Price</Text>
        <Text style={styles.cell}>Amount</Text>
      </View>
      {input.lines.map((line) => {
        const amount = num(line.quantity) * num(line.sellPrice);
        return (
          <View key={line.description} style={styles.row}>
            <Text style={styles.wide}>{line.description}</Text>
            <Text style={styles.cell}>
              {num(line.quantity)} {line.unit}
            </Text>
            <Text style={styles.cell}>{formatMoney(line.sellPrice, input.currency)}</Text>
            <Text style={styles.cell}>{formatMoney(amount, input.currency)}</Text>
          </View>
        );
      })}
      <Text style={styles.total}>Total {formatMoney(input.total, input.currency)}</Text>
    </DocumentShell>,
  );
  return buffer;
}

export async function invoicePdf(input: {
  company: string;
  number: string;
  customerName: string;
  status: string;
  dueDate: Date | string | null;
  currency: string;
  total: string | number;
  amountPaid: string | number;
  lines: Line[];
}) {
  const balance = num(input.total) - num(input.amountPaid);
  const buffer = await renderToBuffer(
    <DocumentShell
      company={input.company}
      title={input.number}
      subtitle={`${input.customerName} · ${input.status} · due ${formatDate(input.dueDate)}`}
    >
      <View style={styles.head}>
        <Text style={styles.wide}>Item</Text>
        <Text style={styles.cell}>Qty</Text>
        <Text style={styles.cell}>Price</Text>
        <Text style={styles.cell}>Amount</Text>
      </View>
      {input.lines.map((line) => {
        const amount = num(line.quantity) * num(line.sellPrice);
        return (
          <View key={line.description} style={styles.row}>
            <Text style={styles.wide}>{line.description}</Text>
            <Text style={styles.cell}>
              {num(line.quantity)} {line.unit}
            </Text>
            <Text style={styles.cell}>{formatMoney(line.sellPrice, input.currency)}</Text>
            <Text style={styles.cell}>{formatMoney(amount, input.currency)}</Text>
          </View>
        );
      })}
      <Text style={styles.total}>Total {formatMoney(input.total, input.currency)}</Text>
      <Text>Paid {formatMoney(input.amountPaid, input.currency)}</Text>
      <Text>Balance {formatMoney(balance, input.currency)}</Text>
    </DocumentShell>,
  );
  return buffer;
}

export async function receiptPdf(input: {
  company: string;
  number: string;
  customerName: string;
  invoiceNumber: string;
  method: string;
  amount: string | number;
  currency: string;
  issuedAt: Date | string;
}) {
  const buffer = await renderToBuffer(
    <DocumentShell
      company={input.company}
      title={input.number}
      subtitle={`${input.customerName} · ${formatDate(input.issuedAt)}`}
    >
      <Text>Invoice {input.invoiceNumber}</Text>
      <Text>Method {input.method.replace(/_/g, " ")}</Text>
      <Text style={styles.total}>Amount {formatMoney(input.amount, input.currency)}</Text>
    </DocumentShell>,
  );
  return buffer;
}
