import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

export const dynamic = 'force-dynamic';

async function handleCleanTitles() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền quản trị" }, { status: 403 });
  }

  const files = await prisma.mediaFile.findMany();
  let count = 0;
  for (const file of files) {
    if (file.title && file.title.includes('.')) {
      // Check if title ends with an extension like .jpg, .png, .mp4, .pdf
      if (file.title.match(/\.(jpg|jpeg|png|gif|mp4|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
        const newTitle = file.title.replace(/\.[^/.]+$/, "");
        await prisma.mediaFile.update({
          where: { id: file.id },
          data: { title: newTitle }
        });
        count++;
      }
    }
  }

  await logActivity(session.userId, "UPDATE", `Chuẩn hóa bỏ phần mở rộng tên file: cập nhật ${count} tài liệu`);
  return NextResponse.json({ ok: true, updated: count });
}

export async function GET() {
  return handleCleanTitles();
}

export async function POST() {
  return handleCleanTitles();
}

