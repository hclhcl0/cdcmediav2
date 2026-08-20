// src/app/api/download/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadFromDrive } from "@/lib/gdrive";
import { createReadStream, existsSync, statSync, readFileSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { addWatermark } from "@/utils/watermark";

type Params = { params: Promise<{ id: string }> };

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function isWatermarkable(mimeType: string): boolean {
  const mime = mimeType.toLowerCase();
  return (
    mime === "application/pdf" ||
    (mime.startsWith("image/") && !mime.includes("gif") && !mime.includes("svg"))
  );
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const preview = req.nextUrl.searchParams.get("preview") === "true";

  let file = await prisma.mediaFile.findUnique({ where: { id } });
  
  if (!file) {
    const attachment = await prisma.mediaAttachment.findUnique({ where: { id } });
    if (attachment) {
      // Cast attachment to match expected shape of `file` used in this route
      file = {
        id: attachment.id,
        filename: attachment.filename,
        filepath: attachment.filepath,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        driveWebLink: attachment.driveWebLink,
        driveFileId: attachment.driveFileId,
        // Mock remaining fields to satisfy TypeScript
        title: attachment.filename,
        description: "",
        isPublic: true,
        downloadCount: 0,
        categoryId: "",
        uploaderId: "",
        createdAt: attachment.createdAt,
        updatedAt: attachment.createdAt,
      } as any;
    }
  }

  if (!file) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Increment download count (non-blocking)
  if (!preview) {
    prisma.mediaFile.update({ where: { id }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
  }

  const disposition = preview ? "inline" : `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`;

  const watermarkable = isWatermarkable(file.fileType);

  // ─── External Link (e.g. Google Drive Link) ─────────────────────
  if (file.filepath === "external" && file.driveWebLink) {
    if (preview) {
      return NextResponse.redirect(file.driveWebLink);
    } else {
      // Try to extract ID and trigger direct download, fallback to view link if extraction fails
      const driveFileId = file.driveFileId ?? file.driveWebLink.match(/\/file\/d\/([^/]+)/)?.[1];
      if (driveFileId) {
        return NextResponse.redirect(`https://drive.google.com/uc?export=download&id=${driveFileId}`);
      }
      return NextResponse.redirect(file.driveWebLink);
    }
  }

  // ─── Google Drive ───────────────────────────────────────────────
  if (file.filepath.startsWith("gdrive://")) {
    try {
      const { data, contentType } = await downloadFromDrive(file.driveFileId!);

      if (watermarkable) {
        // Read entire stream into memory for watermarking
        const rawBuffer = await streamToBuffer(data as Readable);
        const watermarked = await addWatermark(rawBuffer, contentType);

        return new NextResponse(watermarked, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": disposition,
            "Content-Length": String(watermarked.length),
            "Cache-Control": "private, max-age=3600",
          },
        });
      }

      // Stream directly for non-watermarkable files (e.g. videos)
      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      };

      return new NextResponse(Readable.toWeb(data as Readable) as ReadableStream, { headers });
    } catch (err) {
      console.error("[download] Drive error:", err);
      // Fallback: Redirect directly to Google Drive link so user can still access file
      const driveId = file.driveFileId ?? file.driveWebLink?.match(/\/file\/d\/([^/]+)/)?.[1];
      if (driveId) {
        if (preview) {
          return NextResponse.redirect(`https://drive.google.com/file/d/${driveId}/view`);
        } else {
          return NextResponse.redirect(`https://drive.google.com/uc?export=download&id=${driveId}`);
        }
      }
      if (file.driveWebLink) {
        return NextResponse.redirect(file.driveWebLink);
      }
      return NextResponse.json({ error: "Lỗi khi tải từ Google Drive" }, { status: 502 });
    }
  }

  // ─── Local file ─────────────────────────────────────────────────
  const localPath = path.join(process.cwd(), "uploads", file.filepath);
  if (!existsSync(localPath)) {
    return NextResponse.json({ error: "File không tồn tại trên server" }, { status: 404 });
  }

  if (watermarkable) {
    try {
      const rawBuffer = readFileSync(localPath);
      const watermarked = await addWatermark(rawBuffer, file.fileType);

      return new NextResponse(watermarked, {
        headers: {
          "Content-Type": file.fileType,
          "Content-Disposition": disposition,
          "Content-Length": String(watermarked.length),
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (err) {
      console.error("[download] Watermark processing error for local file:", err);
      // Fallback to normal stream below if watermark fails
    }
  }

  const stat = statSync(localPath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = createReadStream(localPath, { start, end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": file.fileType,
        "Content-Disposition": disposition,
      },
    });
  }

  const stream = createReadStream(localPath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": file.fileType,
      "Content-Disposition": disposition,
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
