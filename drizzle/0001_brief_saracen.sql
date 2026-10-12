CREATE TYPE "public"."po_status" AS ENUM('draft', 'sent', 'cancelled');--> statement-breakpoint
CREATE TABLE "purchase_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"description" text NOT NULL,
	"brand" varchar(128),
	"quantity" numeric(14, 3) DEFAULT '1' NOT NULL,
	"unit" varchar(32) DEFAULT 'ea' NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"lead_time_days" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(64) NOT NULL,
	"quote_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"enquiry_id" uuid,
	"status" "po_status" DEFAULT 'draft' NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "sourcing_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(14, 3) DEFAULT '1' NOT NULL,
	"unit" varchar(32) DEFAULT 'ea' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sourcing_item_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"brand" varchar(128),
	"cost_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"lead_time_days" integer,
	"notes" text,
	"chosen" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_rfq_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"content_type" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"notes" text,
	"reply_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_rfqs_enquiry_supplier" UNIQUE("enquiry_id","supplier_id")
);
--> statement-breakpoint
ALTER TABLE "quote_lines" ADD COLUMN "offer_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_items" ADD CONSTRAINT "sourcing_items_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_sourcing_item_id_sourcing_items_id_fk" FOREIGN KEY ("sourcing_item_id") REFERENCES "public"."sourcing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_files" ADD CONSTRAINT "supplier_rfq_files_rfq_id_supplier_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."supplier_rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfqs" ADD CONSTRAINT "supplier_rfqs_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfqs" ADD CONSTRAINT "supplier_rfqs_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_offer_id_supplier_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."supplier_offers"("id") ON DELETE set null ON UPDATE no action;