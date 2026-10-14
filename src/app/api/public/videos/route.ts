// src/app/api/public/videos/route.ts
// API công khai cung cấp danh sách Video truyền thông cho Trợ lý AI (Zalo OA, Mini App, Chatbot)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const skip = (page - 1) * limit;

    // Xác định base URL
    const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    let origin = envUrl || req.nextUrl.origin || "https://media.ksbtdanang.vn";
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      origin = "https://media.ksbtdanang.vn";
    }
    const baseUrl = origin.replace(/\/+$/, "");

    // Điều kiện lọc video:
    // 1. fileType startsWith video/
    // 2. filename có đuôi video thông dụng
    // 3. chuyên mục thuộc group "VIDEO" hoặc tên chuyên mục chứa chữ "video", "clip", "phim"
    const videoConditions: any[] = [
      { fileType: { startsWith: "video/" } },
      { filename: { endsWith: ".mp4", mode: "insensitive" } },
      { filename: { endsWith: ".mov", mode: "insensitive" } },
      { filename: { endsWith: ".webm", mode: "insensitive" } },
      { filename: { endsWith: ".avi", mode: "insensitive" } },
      { category: { group: "VIDEO" } },
      { category: { name: { contains: "video", mode: "insensitive" } } },
      { category: { name: { contains: "clip", mode: "insensitive" } } },
      { category: { name: { contains: "phim", mode: "insensitive" } } },
    ];

    const where: any = {
      isPublic: true,
      OR: videoConditions,
    };

    if (q) {
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        },
      ];
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

    const videos = files.map((f) => {
      const tagList = f.tags.map((t) => t.tag.name);
      const tagString = tagList.length > 0 ? tagList.join(", ") : "CDC Đà Nẵng, Truyền thông y tế";
      const detailUrl = `${baseUrl}/document/${f.id}`;
      const streamUrl = `${baseUrl}/api/download/${f.id}?preview=true`;
      const thumbnailUrl = f.thumbnailUrl || `${baseUrl}/api/thumbnail/${f.id}`;
      const summaryText = f.description && f.description.trim().length > 5
        ? f.description.trim()
        : `Video truyền thông giáo dục sức khỏe: ${f.title}. Phục vụ công tác tuyên truyền phòng chống dịch bệnh của CDC Đà Nẵng.`;

      const markdownKnowledge = [
        `### Video: ${f.title}`,
        `- **Chuyên mục**: ${f.category?.name || "Video Truyền thông"}`,
        `- **Từ khóa / Chủ đề**: ${tagString}`,
        `- **Tóm tắt nội dung**: ${summaryText}`,
        `- **Đường link xem video chính thức**: ${detailUrl}`,
      ].join("\n");

      return {
        id: f.id,
        title: f.title,
        description: f.description || "",
        category: f.category?.name || "Video Truyền thông",
        tags: tagList,
        detailUrl,
        streamUrl,
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
      videos,
    });
  } catch (error: any) {
    console.error("[public/videos API error]", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi lấy danh sách video" },
      { status: 500 }
    );
  }
}
