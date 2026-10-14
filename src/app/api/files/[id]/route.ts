// src/app/api/files/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import { deleteFromDrive } from "@/lib/gdrive";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

type Params = { params: Promise<{ id: string }> };

// GET /api/files/[id] — single file detail
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const file = await prisma.mediaFile.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
      uploader: { select: { id: true, username: true, displayName: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });
  if (!file) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ file });
}

// PUT /api/files/[id] — update title, description, category, tags and optionally replace file
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const fileRecord = await prisma.mediaFile.findUnique({ where: { id } });
    if (!fileRecord) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    const isOwner = fileRecord.uploaderId === session.userId;
    if (!isOwner && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const tagsRaw = formData.get("tags") as string | null;
    const year = formData.get("year") as string | null;
    const isPublicRaw = formData.get("isPublic");
    
    const file = formData.get("file") as File | null;
    const googleDriveLink = formData.get("googleDriveLink") as string | null;

    let updateData: any = {};
    if (title) updateData.title = title;
    if (description !== null) updateData.description = description || null;
    if (categoryId) updateData.categoryId = categoryId;
    if (year !== null) updateData.year = year ? parseInt(year) : new Date().getFullYear();
    if (isPublicRaw !== null) updateData.isPublic = isPublicRaw === "true";

    // Handle file replacement
    if (file || googleDriveLink) {
      // 1. Delete old file from storage
      if (fileRecord.filepath.startsWith("gdrive://")) {
        try {
          if (fileRecord.driveFileId) await deleteFromDrive(fileRecord.driveFileId);
        } catch (e) {
          console.warn("[put] Drive delete failed:", e);
        }
      } else if (fileRecord.filepath !== "external") {
        const localPath = path.join(process.cwd(), "uploads", fileRecord.filepath);
        if (existsSync(localPath)) await unlink(localPath);
      }

      // 2. Process new file/link
      const { isDriveConfigured, uploadToDrive, extractDriveIdFromLink, getDriveFileMetadata } = await import("@/lib/gdrive");
      
      let thumbnailLink: string | null = null;
      if (googleDriveLink) {
        updateData.filepath = "external";
        updateData.driveWebLink = googleDriveLink;
        updateData.driveFileId = null;
        updateData.filename = `${title || fileRecord.title} (Google Drive)`;
        updateData.fileType = "link";
        updateData.fileSize = 0;

        if (await isDriveConfigured()) {
          const extractedId = extractDriveIdFromLink(googleDriveLink);
          if (extractedId) {
            const meta = await getDriveFileMetadata(extractedId);
            updateData.fileSize = meta.size || 0;
            updateData.fileType = meta.mimeType || "link";
            if (meta.thumbnailLink) thumbnailLink = meta.thumbnailLink;
          }
        }
      } else if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name) || "";
        const uniqueName = `${crypto.randomUUID()}${ext}`;

        updateData.filename = file.name;
        updateData.fileType = file.type || "application/octet-stream";
        updateData.fileSize = file.size;

        if (await isDriveConfigured()) {
          const result = await uploadToDrive(buffer, file.name, file.type);
          updateData.filepath = `gdrive://${result.fileId}`;
          updateData.driveFileId = result.fileId;
          updateData.driveWebLink = result.webViewLink;
          
          const meta = await getDriveFileMetadata(result.fileId);
          if (meta.thumbnailLink) thumbnailLink = meta.thumbnailLink;
        } else {
          const UPLOADS_DIR = path.join(process.cwd(), "uploads");
          const { mkdir, writeFile } = await import("fs/promises");
          if (!existsSync(UPLOADS_DIR)) await mkdir(UPLOADS_DIR, { recursive: true });
          await writeFile(path.join(UPLOADS_DIR, uniqueName), buffer);
          updateData.filepath = uniqueName;
          updateData.driveFileId = null;
          updateData.driveWebLink = null;
        }
      }
      updateData.thumbnailUrl = thumbnailLink;
    }

    // Rebuild tags
    if (tagsRaw !== null) {
      const tagNames = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const tagRecords = await Promise.all(
        tagNames.map((name: string) =>
          prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
            select: { id: true },
          })
        )
      );
      updateData.tags = {
        deleteMany: {},
        create: tagRecords.map((t: any) => ({ tagId: t.id })),
      };
    }

    const updated = await prisma.mediaFile.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        uploader: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    await logActivity(session.userId, "UPDATE", `Cập nhật: "${updated.title}"`);
    return NextResponse.json({ file: updated });
  } catch (err) {
    console.error("[files/[id]/PUT]", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi cập nhật" }, { status: 500 });
  }
}

// DELETE /api/files/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const file = await prisma.mediaFile.findUnique({
    where: { id },
    include: { attachments: true }
  });
  if (!file) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isOwner = file.uploaderId === session.userId;
  if (!isOwner && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  // 1. Remove attachments from storage
  if (file.attachments && file.attachments.length > 0) {
    for (const att of file.attachments) {
      if (att.filepath.startsWith("gdrive://") || att.driveFileId) {
        try {
          if (att.driveFileId) await deleteFromDrive(att.driveFileId);
        } catch (e) {
          console.warn(`[delete] Attachment Drive delete failed for ${att.id}:`, e);
        }
      } else if (att.filepath && att.filepath !== "external") {
        const localPath = path.join(process.cwd(), "uploads", att.filepath);
        if (existsSync(localPath)) {
          try { await unlink(localPath); } catch {}
        }
      }
    }
  }

  // 2. Remove main file from storage
  if (file.filepath.startsWith("gdrive://") || file.driveFileId) {
    try {
      if (file.driveFileId) await deleteFromDrive(file.driveFileId);
    } catch (e) {
      console.warn("[delete] Drive delete failed:", e);
    }
  } else if (file.filepath !== "external") {
    const localPath = path.join(process.cwd(), "uploads", file.filepath);
    if (existsSync(localPath)) {
      try { await unlink(localPath); } catch {}
    }
  }

  await prisma.mediaFile.delete({ where: { id } });

  await logActivity(session.userId, "DELETE", `Xóa: "${file.title}"`);
  return NextResponse.json({ ok: true });
}
