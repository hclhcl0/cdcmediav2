// src/app/api/banners/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const session = all ? await getSession() : null;

  if (all && (!session || session.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If public request, check if banner slide is enabled
  if (!all) {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: { in: ["banner_slide_enabled", "banner_slide_top", "banner_slide_middle", "banner_slide_bottom"] },
      },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    if (map.banner_slide_enabled === "false") {
      return NextResponse.json([]);
    }

    const disabledPositions: string[] = [];
    if (map.banner_slide_top === "false") disabledPositions.push("TOP");
    if (map.banner_slide_middle === "false") disabledPositions.push("MIDDLE");
    if (map.banner_slide_bottom === "false") disabledPositions.push("BOTTOM");

    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        ...(disabledPositions.length > 0 ? { position: { notIn: disabledPositions } } : {}),
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json(banners);
  }

  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const banner = await prisma.banner.create({
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl ?? null,
      position: body.position ?? "TOP",
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    },
  });
  return NextResponse.json(banner, { status: 201 });
}
