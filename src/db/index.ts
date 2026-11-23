import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDbClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Memberikan dummy client saat build-time jika env belum diisi
    const dummySql = neon("postgresql://user:pass@localhost:5432/db");
    return drizzle(dummySql, { schema });
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = createDbClient();
export { schema };
