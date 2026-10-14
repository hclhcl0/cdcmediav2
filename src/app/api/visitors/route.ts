import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

let memoryCount: number | null = null;
let pendingIncrements = 0;
let lastFlush = Date.now();
const FLUSH_INTERVAL_MS = 10000; // 10 seconds

async function flush() {
  if (pendingIncrements === 0) return;
  const toAdd = pendingIncrements;
  pendingIncrements = 0;
  lastFlush = Date.now();

  try {
    const row = await prisma.appSetting.findUnique({ where: { key: "global_visitors" } });
    const currentDb = row ? parseInt(row.value, 10) : 15420;
    const nextCount = (isNaN(currentDb) ? 15420 : currentDb) + toAdd;

    await prisma.appSetting.upsert({
      where: { key: "global_visitors" },
      create: { key: "global_visitors", value: nextCount.toString() },
      update: { value: nextCount.toString() }
    });
    memoryCount = nextCount;
  } catch (e) {
    console.error("[visitors] Failed to flush visitor count to DB:", e);
    // Put back increments in case of error
    pendingIncrements += toAdd;
  }
}

export async function POST() {
  try {
    // If not initialized, fetch from DB
    if (memoryCount === null) {
      const row = await prisma.appSetting.findUnique({ where: { key: "global_visitors" } });
      const val = row ? parseInt(row.value, 10) : 15420;
      memoryCount = isNaN(val) ? 15420 : val;
    }

    pendingIncrements++;
    memoryCount++;

    // Flush periodically or when pending reaches 10
    const now = Date.now();
    if (pendingIncrements >= 10 || now - lastFlush >= FLUSH_INTERVAL_MS) {
      // Non-blocking flush
      flush().catch(() => {});
    }

    return NextResponse.json({ count: memoryCount });
  } catch (err) {
    return NextResponse.json({ count: memoryCount ?? 15420 });
  }
}

