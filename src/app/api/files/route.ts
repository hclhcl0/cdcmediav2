// src/app/api/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import { isDriveConfigured, uploadToDrive, extractDriveIdFromLink, getDriveFileMetadata } from "@/lib/gdrive";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getGeminiKey, generateFileDescription } from "@/lib/ai";

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// GET /api/files — public list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const q = searchParams.get("q");
  const tag = searchParams.get("tag");
  const year = searchParams.get("year");
  const type = searchParams.get("type"); // mime category filter
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isPublic: true };
  if (categoryId) where.categoryId = categoryId;
  if (year) where.year = parseInt(year);
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }
  if (tag) {
    where.tags = { some: { tag: { name: { equals: tag, mode: "insensitive" } } } };
  }
  if (type) {
    // e.g. type=image → mimeType starts with image/
    where.fileType = { startsWith: type + "/" };
  }

  const [files, total] = await Promise.all([
    prisma.mediaFile.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true, group: true } },
        uploader: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.mediaFile.count({ where }),
  ]);

  return NextResponse.json({ files, total, page, limit });
}

async function processFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const uniqueName = `${crypto.randomUUID()}${ext}`;

  let filepath = "";
  let driveFileId = undefined;
  let driveWebLink = undefined;
  let thumbnailUrl = undefined;

  if (await isDriveConfigured()) {
    const result = await uploadToDrive(buffer, file.name, file.type);
    filepath = `gdrive://${result.fileId}`;
    driveFileId = result.fileId;
    driveWebLink = result.webViewLink;
    
    const meta = await getDriveFileMetadata(result.fileId);
    if (meta.thumbnailLink) {
      thumbnailUrl = meta.thumbnailLink;
    }
  } else {
    if (!existsSync(UPLOADS_DIR)) await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, uniqueName), buffer);
    filepath = uniqueName;
  }

  return {
    filename: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    filepath,
    driveFileId,
    driveWebLink,
    thumbnailUrl
  };
}

// POST /api/files — upload (auth required, UPLOADER or ADMIN)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const googleDriveLink = formData.get("googleDriveLink") as string | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const categoryId = formData.get("categoryId") as string;
    const tagsRaw = formData.get("tags") as string | null;
    const year = formData.get("year") as string | null;
    const autoDescribe = formData.get("autoDescribe") === "true";

    if ((files.length === 0 && !googleDriveLink) || !title || !categoryId) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    for (const f of files) {
      if (f.size > MAX_SIZE) return NextResponse.json({ error: "Một trong các file vượt quá 500 MB" }, { status: 413 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "Chuyên mục không tồn tại" }, { status: 400 });

    let finalDescription = description || null;
    if (autoDescribe && files.length > 0 && !finalDescription) {
      const geminiKey = await getGeminiKey();
      if (geminiKey) {
        try {
          const buffer = Buffer.from(await files[0].arrayBuffer());
          const generated = await generateFileDescription(buffer, files[0].name, geminiKey);
          if (generated) finalDescription = generated;
        } catch (e) {
          console.error("[AutoDescribe error]", e);
        }
      }
    }

    let mainFileData: any = null;
    const attachmentsData: any[] = [];

    if (googleDriveLink) {
      let fileSize = 0;
      let fileType = "link";
      let thumbnailUrl = null;
      let driveFileId = undefined;

      if (await isDriveConfigured()) {
        const extractedId = extractDriveIdFromLink(googleDriveLink);
        if (extractedId) {
          const meta = await getDriveFileMetadata(extractedId);
          fileSize = meta.size || 0;
          fileType = meta.mimeType || "link";
          driveFileId = extractedId;
          if (meta.thumbnailLink) thumbnailUrl = meta.thumbnailLink;
        }
      }
      
      mainFileData = {
        filename: `${title} (Google Drive)`,
        fileType,
        fileSize,
        filepath: "external",
        driveWebLink: googleDriveLink,
        driveFileId,
        thumbnailUrl
      };
    } else if (files.length > 0) {
      // Process first file as main
      mainFileData = await processFile(files[0]);
      
      // Process rest as attachments
      for (let i = 1; i < files.length; i++) {
        attachmentsData.push(await processFile(files[i]));
      }
    } else {
      return NextResponse.json({ error: "Thiếu file hoặc link" }, { status: 400 });
    }

    // Parse tags
    const tagNames: string[] = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const tagConnects = await Promise.all(
      tagNames.map((name) =>
        prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
          select: { id: true },
        })
      )
    );

    const mediaFile = await prisma.mediaFile.create({
      data: {
        title,
        description: finalDescription,
        year: year ? parseInt(year) : new Date().getFullYear(),
        categoryId,
        uploaderId: session.userId,
        tags: { create: tagConnects.map((t: any) => ({ tagId: t.id })) },
        ...mainFileData,
        attachments: {
          create: attachmentsData.map(att => ({
            filename: att.filename,
            filepath: att.filepath,
            driveFileId: att.driveFileId,
            driveWebLink: att.driveWebLink,
            thumbnailUrl: att.thumbnailUrl,
            fileType: att.fileType,
            fileSize: att.fileSize,
          }))
        }
      },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true, group: true } },
        uploader: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: true } },
        attachments: true
      },
    });

    await logActivity(
      session.userId,
      "UPLOAD",
      `Tải lên: "${title}" (${files.length} file)`,
      req.headers.get("x-forwarded-for") ?? undefined
    );

    return NextResponse.json({ file: mediaFile }, { status: 201 });
  } catch (err) {
    console.error("[files/POST]", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi tải lên" }, { status: 500 });
  }
}
