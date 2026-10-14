// src/app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import { slugify } from "@/utils/format";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { name, description, color, icon, sortOrder, group } = await req.json();
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) { updateData.name = name; updateData.slug = slugify(name); }
  if (description !== undefined) updateData.description = description;
  if (color !== undefined) updateData.color = color;
  if (icon !== undefined) updateData.icon = icon;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (group !== undefined) updateData.group = group;

  const category = await prisma.category.update({ where: { id }, data: updateData });
  await logActivity(session.userId, "UPDATE", `Cập nhật chuyên mục: "${category.name}"`);
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Cascade handled by Prisma — delete files and attachments first manually so storage is cleaned
  const files = await prisma.mediaFile.findMany({
    where: { categoryId: id },
    include: { attachments: true }
  });

  const { deleteFromDrive } = await import("@/lib/gdrive");
  const { unlink } = await import("fs/promises");
  const { existsSync } = await import("fs");
  const path = await import("path");

  for (const f of files) {
    // Delete attachments
    if (f.attachments && f.attachments.length > 0) {
      for (const att of f.attachments) {
        if (att.filepath.startsWith("gdrive://") || att.driveFileId) {
          try {
            if (att.driveFileId) await deleteFromDrive(att.driveFileId);
          } catch {}
        } else if (att.filepath && att.filepath !== "external") {
          const local = path.join(process.cwd(), "uploads", att.filepath);
          if (existsSync(local)) {
            try { await unlink(local); } catch {}
          }
        }
      }
    }

    // Delete main file
    if (f.filepath.startsWith("gdrive://") || f.driveFileId) {
      try {
        if (f.driveFileId) await deleteFromDrive(f.driveFileId);
      } catch {}
    } else if (f.filepath !== "external") {
      const local = path.join(process.cwd(), "uploads", f.filepath);
      if (existsSync(local)) {
        try { await unlink(local); } catch {}
      }
    }
  }

  await prisma.mediaFile.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });

  await logActivity(session.userId, "DELETE_CATEGORY", `Xóa chuyên mục: "${category.name}" (${files.length} file)`);
  return NextResponse.json({ ok: true });
}
