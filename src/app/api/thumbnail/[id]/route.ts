import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDriveConfigured, getDriveClient, getDriveAccessToken } from "@/lib/gdrive";
import fs from "fs";
import path from "path";

// GET /api/thumbnail/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    let file: any = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) {
      const attachment = await prisma.mediaAttachment.findUnique({ where: { id } });
      if (attachment) {
        file = attachment;
      }
    }
    
    if (!file) return new NextResponse("Not Found", { status: 404 });

    // 1. If it's a local image upload, stream it directly
    if (file.filepath && !file.filepath.startsWith("gdrive://") && file.filepath !== "external") {
      if (file.fileType.startsWith("image/")) {
        const localPath = path.join(process.cwd(), "uploads", file.filepath);
        if (fs.existsSync(localPath)) {
          const stream = fs.createReadStream(localPath);
          return new NextResponse(stream as unknown as ReadableStream, {
            headers: {
              "Content-Type": file.fileType,
              "Cache-Control": "public, max-age=31536000, immutable"
            }
          });
        }
      }
    }

    // 2. If it is a Google Drive file, try authenticated fetch or redirect
    if (file.driveFileId) {
      // If server has Drive OAuth configured, fetch authenticated thumbnail
      if (await isDriveConfigured()) {
        try {
          const token = await getDriveAccessToken();
          const { drive } = await getDriveClient();
          const meta = await drive.files.get({
            fileId: file.driveFileId,
            fields: "thumbnailLink, hasThumbnail"
          });
          
          if (meta.data.thumbnailLink) {
            const highResThumb = meta.data.thumbnailLink.replace(/=s\d+.*$/, "=s800");
            const thumbRes = await fetch(highResThumb, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (thumbRes.ok) {
              const buffer = Buffer.from(await thumbRes.arrayBuffer());
              return new NextResponse(buffer, {
                headers: {
                  "Content-Type": thumbRes.headers.get("Content-Type") || "image/jpeg",
                  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
                }
              });
            }
          }
        } catch (driveErr) {
          // Fall back to direct Google CDN thumbnail URL
        }
      }

      // Permanent Google Drive thumbnail CDN endpoint
      const driveThumbUrl = `https://drive.google.com/thumbnail?id=${file.driveFileId}&sz=w800`;
      const response = NextResponse.redirect(driveThumbUrl);
      response.headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
      return response;
    }

    // 3. Fallback to custom thumbnailUrl if exists and not googleusercontent
    if (file.thumbnailUrl && !file.thumbnailUrl.includes('googleusercontent.com')) {
      const response = NextResponse.redirect(file.thumbnailUrl);
      response.headers.set("Cache-Control", "public, max-age=86400");
      return response;
    }

    // 4. Default thumbnail from AppSettings
    const defaultThumbSetting = await prisma.appSetting.findUnique({ where: { key: "default_thumbnail_url" } });
    if (defaultThumbSetting?.value) {
      const fallbackUrl = new URL(defaultThumbSetting.value, req.url).toString();
      const response = NextResponse.redirect(fallbackUrl);
      response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
      return response;
    }

    return new NextResponse("No thumbnail available", { status: 404 });
  } catch (error) {
    console.error("[thumbnail API]", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
