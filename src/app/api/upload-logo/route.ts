// src/app/api/upload-logo/route.ts
// Upload logo ghi đè trực tiếp lên public/logo.png
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Không có file" }, { status: 400 });
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Chỉ chấp nhận ảnh (JPG, PNG, WebP)" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Ảnh tối đa 5MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "uploads");
  try { await import("fs/promises").then(fs => fs.mkdir(uploadsDir, { recursive: true })); } catch (e) {}
  const logoPath = path.join(uploadsDir, "logo.png");

  await writeFile(logoPath, buffer);

  const { logActivity } = await import("@/lib/logger");
  await logActivity(session.userId, "UPDATE_SETTINGS", "Cập nhật logo website");

  return NextResponse.json({ ok: true, url: `/api/uploads/logo.png?v=${Date.now()}` }, { status: 201 });
}
