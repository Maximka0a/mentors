import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/**
 * Prisma client for local scripts. Talks to Neon over WebSockets (port 443) instead of
 * raw Postgres on 5432, which some VPNs break. The deployed app keeps the regular client.
 */
export function createScriptClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  neonConfig.webSocketConstructor = ws;
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}
