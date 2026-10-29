import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });
config({ path: ".env.local", override: true });

// Migrations need the direct (unpooled) connection — PgBouncer breaks session state.
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
