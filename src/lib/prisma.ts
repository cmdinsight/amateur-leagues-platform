import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// On Vercel the deployment filesystem is read-only and there's no DATABASE_URL
// configured, so for this self-contained demo we copy the committed, seeded
// SQLite snapshot into /tmp (writable) on cold start and point Prisma at it.
// This is a deliberate shortcut for a shareable prototype — swap for a real
// hosted Postgres (Neon, etc.) before this becomes a production deployment.
function resolveVercelDbUrl() {
  const dest = "/tmp/leagues-demo.db";
  if (!fs.existsSync(dest)) {
    const src = path.join(process.cwd(), "prisma", "seed-data.db");
    fs.copyFileSync(src, dest);
  }
  return `file:${dest}`;
}

const isVercel = !!process.env.VERCEL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(isVercel ? { datasourceUrl: resolveVercelDbUrl() } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
