// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logActivity(
        user.id,
        "LOGIN",
        `Đăng nhập thất bại (sai mật khẩu) cho tài khoản: "${username}"`,
        req.headers.get("x-forwarded-for") ?? undefined
      );
      return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác" }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      username: user.username,
      role: user.role as "ADMIN" | "UPLOADER" | "VIEWER",
      displayName: user.displayName ?? undefined,
    });

    await logActivity(
      user.id,
      "LOGIN",
      `Đăng nhập thành công`,
      req.headers.get("x-forwarded-for") ?? undefined
    );

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role, displayName: user.displayName },
    });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
