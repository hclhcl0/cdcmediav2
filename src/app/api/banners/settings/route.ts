// src/app/api/banners/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

const BANNER_SETTING_KEYS = [
  "banner_slide_enabled",
  "banner_slide_top",
  "banner_slide_middle",
  "banner_slide_bottom",
  "banner_slide_interval",
  "banner_slide_auto_play",
];

export async function GET() {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: BANNER_SETTING_KEYS } },
    });

    const settings: Record<string, string> = {
      banner_slide_enabled: "true",
      banner_slide_top: "true",
      banner_slide_middle: "true",
      banner_slide_bottom: "true",
      banner_slide_interval: "5000",
      banner_slide_auto_play: "true",
    };

    for (const r of rows) {
      settings[r.key] = r.value;
    }

    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Lỗi lấy cài đặt" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền quản trị" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updates = [];

    for (const key of BANNER_SETTING_KEYS) {
      if (body[key] !== undefined) {
        updates.push(
          prisma.appSetting.upsert({
            where: { key },
            update: { value: String(body[key]) },
            create: { key, value: String(body[key]) },
          })
        );
      }
    }

    await Promise.all(updates);
    await logActivity(session.userId, "UPDATE_SETTINGS", "Cập nhật cài đặt hiển thị Banner Slide");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Lỗi lưu cài đặt" }, { status: 500 });
  }
}
