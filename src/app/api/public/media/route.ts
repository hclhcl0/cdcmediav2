// src/app/api/public/media/route.ts
// API công khai cung cấp TOÀN BỘ tài liệu truyền thông (Video, Audio, Infographic/Hình ảnh, Tờ rơi, Tài liệu)
// phục vụ Trợ lý AI (Zalo OA, Chatbot, Mini App) tra cứu và trích dẫn link cho người dân & cán bộ.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFileCategoryLabel } from "@/utils/fileIcon";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const typeFilter = searchParams.get("type")?.toLowerCase()?.trim(); // "video" | "audio" | "image" | "document" | "all"
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "500"), 2000);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const skip = (page - 1) * limit;

    const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    const origin = envUrl || req.nextUrl.origin || "http://media.ksbtdanang.vn";
    const baseUrl = origin.replace(/\/+$/, "");

    const where: any = { isPublic: true };

    // Lọc theo loại nếu có
    if (typeFilter && typeFilter !== "all") {
      if (typeFilter === "video") {
        where.OR = [
          { fileType: { startsWith: "video/" } },
          { filename: { endsWith: ".mp4", mode: "insensitive" } },
          { filename: { endsWith: ".mov", mode: "insensitive" } },
          { filename: { endsWith: ".webm", mode: "insensitive" } },
          { category: { group: "VIDEO" } },
        ];
      } else if (typeFilter === "audio") {
        where.OR = [
          { fileType: { startsWith: "audio/" } },
          { filename: { endsWith: ".mp3", mode: "insensitive" } },
          { filename: { endsWith: ".wav", mode: "insensitive" } },
          { category: { group: "AUDIO" } },
        ];
      } else if (typeFilter === "image") {
        where.OR = [
          { fileType: { startsWith: "image/" } },
          { filename: { endsWith: ".jpg", mode: "insensitive" } },
          { filename: { endsWith: ".png", mode: "insensitive" } },
          { filename: { endsWith: ".webp", mode: "insensitive" } },
          { category: { group: "GRAPHICS" } },
        ];
      } else if (typeFilter === "document") {
        where.OR = [
          { fileType: "application/pdf" },
          { filename: { endsWith: ".pdf", mode: "insensitive" } },
          { filename: { endsWith: ".docx", mode: "insensitive" } },
          { filename: { endsWith: ".pptx", mode: "insensitive" } },
          { filename: { endsWith: ".xlsx", mode: "insensitive" } },
          { category: { group: "DOCUMENTS" } },
        ];
      }
    }

    if (q) {
      const searchCond = {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      };
      if (where.OR) {
        where.AND = [searchCond];
      } else {
        where.OR = searchCond.OR;
      }
    }

    const [files, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true, icon: true, group: true } },
          tags: { include: { tag: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.mediaFile.count({ where }),
    ]);

    const items = files.map((f) => {
      const typeLabel = getFileCategoryLabel(f.fileType, f.filename);
      const tagList = f.tags.map((t) => t.tag.name);
      const tagString = tagList.length > 0 ? tagList.join(", ") : "CDC Đà Nẵng, Truyền thông y tế";
      const detailUrl = `${baseUrl}/document/${f.id}`;
      const previewUrl = `${baseUrl}/api/download/${f.id}?preview=true`;
      const downloadUrl = `${baseUrl}/api/download/${f.id}`;
      const thumbnailUrl = f.thumbnailUrl || `${baseUrl}/api/thumbnail/${f.id}`;

      let mediaGroup = "Tài liệu & Tờ rơi";
      if (f.fileType.startsWith("video/") || f.category?.group === "VIDEO") mediaGroup = "Video";
      else if (f.fileType.startsWith("audio/") || f.category?.group === "AUDIO") mediaGroup = "Âm thanh & Podcast";
      else if (f.fileType.startsWith("image/") || f.category?.group === "GRAPHICS") mediaGroup = "Ấn phẩm & Hình ảnh";

      const summaryText = f.description && f.description.trim().length > 5
        ? f.description.trim()
        : `Tài liệu truyền thông y tế: ${f.title} (${typeLabel}). Phục vụ công tác tuyên truyền, hướng dẫn phòng chống bệnh của CDC Đà Nẵng.`;

      // Cấu trúc Markdown chuẩn hóa để AI Zalo OA đọc và trích xuất link chính xác
      const markdownKnowledge = [
        `### [${mediaGroup}] ${f.title}`,
        `- **Định dạng / Thể loại**: ${typeLabel} (${mediaGroup})`,
        `- **Chuyên mục**: ${f.category?.name || "Truyền thông y tế"}`,
        `- **Chủ đề / Từ khóa**: ${tagString}`,
        `- **Tóm tắt nội dung**: ${summaryText}`,
        `- **Đường link xem / tải chính thức**: ${detailUrl}`,
      ].join("\n");

      return {
        id: f.id,
        title: f.title,
        description: f.description || "",
        category: f.category?.name || "Truyền thông",
        group: f.category?.group || mediaGroup,
        mediaGroup,
        typeLabel,
        fileType: f.fileType,
        filename: f.filename,
        tags: tagList,
        detailUrl,
        previewUrl,
        downloadUrl,
        thumbnailUrl,
        fileSize: f.fileSize,
        viewCount: f.viewCount,
        downloadCount: f.downloadCount,
        createdAt: f.createdAt,
        markdownKnowledge,
      };
    });

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      items,
      // Alias để tương thích nếu script đọc videos
      videos: items.filter((i) => i.mediaGroup === "Video"),
    });
  } catch (error: any) {
    console.error("[public/media API error]", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi lấy danh sách tài liệu truyền thông" },
      { status: 500 }
    );
  }
}
