import { parseEnv } from "@neon/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import neonConfigFile from "../../neon";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as unknown as { pool?: Pool };

function databaseUrl() {
  const { postgres } = parseEnv(neonConfigFile, ["DATABASE_URL"]);
  return postgres.databaseUrl;
}

export function getDb() {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({ connectionString: databaseUrl() });
  }

  return drizzle(globalForDb.pool, { schema });
}

export type Db = ReturnType<typeof getDb>;
