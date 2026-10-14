// src/app/api/search/route.ts — full-text search across files
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ files: [] });
  }

  const files = await prisma.mediaFile.findMany({
    where: {
      isPublic: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
      uploader: { select: { id: true, username: true, displayName: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ files, query: q });
}
