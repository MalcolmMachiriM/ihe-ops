export type Customer = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  company: string;
  address: string;
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string;
};

export type Enquiry = {
  id: string;
  reference: string;
  customerId: string;
  title: string;
  description: string;
  status: "new" | "sourcing" | "quoted" | "won" | "lost" | "expired";
  urgency: "low" | "normal" | "high";
  source: string;
  assignedTo: string;
  createdAt: string;
};

export type QuoteLine = {
  id: string;
  description: string;
  brand: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  supplierId: string;
  leadTimeDays: number;
};

export type Quote = {
  id: string;
  number: string;
  enquiryId: string;
  customerId: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  validUntil: string;
  version: number;
  lines: QuoteLine[];
  createdAt: string;
};

export type Invoice = {
  id: string;
  number: string;
  quoteId: string;
  customerId: string;
  status: "draft" | "proforma" | "issued" | "partial" | "paid" | "void";
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  dueDate: string;
  createdAt: string;
};

export type Receipt = {
  id: string;
  number: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: string;
  issuedAt: string;
};

export const customers: Customer[] = [
  {
    id: "cus-1",
    name: "Zimplats Holdings",
    contactPerson: "Tatenda Moyo",
    email: "ops@zimplats.example",
    phone: "+263 77 111 2200",
    company: "Zimplats Holdings",
    address: "Ngezi Mine, Zimbabwe",
  },
  {
    id: "cus-2",
    name: "Jacobson & Associates",
    contactPerson: "Chiedza Ndlovu",
    email: "site@jacobson.example",
    phone: "+263 71 445 8890",
    company: "Jacobson & Associates",
    address: "Harare, Zimbabwe",
  },
  {
    id: "cus-3",
    name: "Savanna Agri-Supply Co.",
    contactPerson: "Farai Mutasa",
    email: "ceo@savanna.example",
    phone: "+263 78 332 1100",
    company: "Savanna Agri-Supply Co.",
    address: "Gweru, Zimbabwe",
  },
];

export const suppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Midlands Tool Distributors",
    contactPerson: "Blessing Chari",
    email: "sales@mtd.example",
    phone: "+263 54 222 110",
    categories: "Hardware, Power tools",
  },
  {
    id: "sup-2",
    name: "SolarGrid Zimbabwe",
    contactPerson: "Nyasha Dube",
    email: "quotes@solargrid.example",
    phone: "+263 77 900 4411",
    categories: "Solar, Inverters, Cables",
  },
  {
    id: "sup-3",
    name: "SafeWear PPE",
    contactPerson: "Rudo Sibanda",
    email: "orders@safewear.example",
    phone: "+263 71 220 3344",
    categories: "PPE, Safety",
  },
];

export const enquiries: Enquiry[] = [
  {
    id: "enq-1",
    reference: "ENQ-2026-0042",
    customerId: "cus-1",
    title: "Underground PPE kit — 40 sets",
    description:
      "Overalls, boots, gloves, helmets and eyewear for underground crew. Prefer high-visibility options.",
    status: "sourcing",
    urgency: "high",
    source: "WhatsApp",
    assignedTo: "Sales Desk",
    createdAt: "2026-10-10T08:30:00.000Z",
  },
  {
    id: "enq-2",
    reference: "ENQ-2026-0041",
    customerId: "cus-2",
    title: "5kW hybrid inverter + cabling",
    description:
      "Supply and quote a 5kW hybrid inverter, compatible lithium pack options, and DC/AC cabling.",
    status: "quoted",
    urgency: "normal",
    source: "Email",
    assignedTo: "Electrical",
    createdAt: "2026-10-08T14:15:00.000Z",
  },
  {
    id: "enq-3",
    reference: "ENQ-2026-0040",
    customerId: "cus-3",
    title: "Workshop power tools restock",
    description: "Angle grinders, welding kit consumables, and drill bits assortment.",
    status: "new",
    urgency: "low",
    source: "Phone",
    assignedTo: "Hardware",
    createdAt: "2026-10-12T09:05:00.000Z",
  },
];

export const quotes: Quote[] = [
  {
    id: "quo-1",
    number: "QT-2026-0018",
    enquiryId: "enq-2",
    customerId: "cus-2",
    status: "sent",
    currency: "USD",
    subtotal: 2480,
    taxTotal: 0,
    total: 2480,
    validUntil: "2026-10-22T00:00:00.000Z",
    version: 1,
    createdAt: "2026-10-09T10:00:00.000Z",
    lines: [
      {
        id: "ql-1",
        description: "5kW hybrid inverter",
        brand: "Deye",
        quantity: 1,
        unit: "ea",
        costPrice: 980,
        sellPrice: 1250,
        supplierId: "sup-2",
        leadTimeDays: 5,
      },
      {
        id: "ql-2",
        description: "4mm solar DC cable — 100m",
        brand: "Generic",
        quantity: 2,
        unit: "roll",
        costPrice: 85,
        sellPrice: 120,
        supplierId: "sup-2",
        leadTimeDays: 3,
      },
      {
        id: "ql-3",
        description: "AC distribution kit + isolators",
        brand: "Mixed",
        quantity: 1,
        unit: "kit",
        costPrice: 720,
        sellPrice: 990,
        supplierId: "sup-2",
        leadTimeDays: 7,
      },
    ],
  },
  {
    id: "quo-2",
    number: "QT-2026-0017",
    enquiryId: "enq-1",
    customerId: "cus-1",
    status: "draft",
    currency: "USD",
    subtotal: 6120,
    taxTotal: 0,
    total: 6120,
    validUntil: "2026-10-20T00:00:00.000Z",
    version: 1,
    createdAt: "2026-10-11T16:20:00.000Z",
    lines: [
      {
        id: "ql-4",
        description: "Hi-vis overalls — size mix",
        brand: "SafeWear",
        quantity: 40,
        unit: "set",
        costPrice: 28,
        sellPrice: 42,
        supplierId: "sup-3",
        leadTimeDays: 10,
      },
      {
        id: "ql-5",
        description: "Steel-toe boots — size mix",
        brand: "SafeWear",
        quantity: 40,
        unit: "pair",
        costPrice: 55,
        sellPrice: 78,
        supplierId: "sup-3",
        leadTimeDays: 12,
      },
      {
        id: "ql-6",
        description: "Helmet + gloves + eyewear kit",
        brand: "SafeWear",
        quantity: 40,
        unit: "kit",
        costPrice: 22,
        sellPrice: 33,
        supplierId: "sup-3",
        leadTimeDays: 8,
      },
    ],
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv-1",
    number: "INV-2026-0009",
    quoteId: "quo-1",
    customerId: "cus-2",
    status: "partial",
    currency: "USD",
    subtotal: 2480,
    taxTotal: 0,
    total: 2480,
    amountPaid: 1240,
    dueDate: "2026-10-25T00:00:00.000Z",
    createdAt: "2026-10-10T11:00:00.000Z",
  },
  {
    id: "inv-2",
    number: "PF-2026-0004",
    quoteId: "quo-2",
    customerId: "cus-1",
    status: "proforma",
    currency: "USD",
    subtotal: 6120,
    taxTotal: 0,
    total: 6120,
    amountPaid: 0,
    dueDate: "2026-10-18T00:00:00.000Z",
    createdAt: "2026-10-11T17:00:00.000Z",
  },
];

export const receipts: Receipt[] = [
  {
    id: "rcp-1",
    number: "RCP-2026-0007",
    invoiceId: "inv-1",
    customerId: "cus-2",
    amount: 1240,
    currency: "USD",
    method: "bank_transfer",
    issuedAt: "2026-10-10T15:30:00.000Z",
  },
];

export function customerName(id: string): string {
  return customers.find((c) => c.id === id)?.name ?? "Unknown customer";
}

export function supplierName(id: string): string {
  return suppliers.find((s) => s.id === id)?.name ?? "Unknown supplier";
}

export function dashboardStats() {
  const openEnquiries = enquiries.filter((e) =>
    ["new", "sourcing", "quoted"].includes(e.status),
  ).length;
  const openQuotes = quotes.filter((q) =>
    ["draft", "sent"].includes(q.status),
  ).length;
  const receivables = invoices.reduce(
    (sum, inv) => sum + Math.max(inv.total - inv.amountPaid, 0),
    0,
  );
  const quotePipeline = quotes
    .filter((q) => ["draft", "sent"].includes(q.status))
    .reduce((sum, q) => sum + q.total, 0);

  return { openEnquiries, openQuotes, receivables, quotePipeline };
}
