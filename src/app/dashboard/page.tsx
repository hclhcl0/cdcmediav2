// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatFileSize } from "@/utils/format";
import DashboardClient from "./DashboardClient";
import { FileArchive, HardDrive, FolderOpen, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "ADMIN";

  const [categories, ownFiles, storageAgg] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, description: true, color: true, icon: true, group: true, sortOrder: true, _count: { select: { files: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.mediaFile.findMany({
      where: isAdmin ? {} : { uploaderId: session.userId },
      select: { fileSize: true, downloadCount: true },
    }),
    prisma.mediaFile.aggregate({
      _sum: { fileSize: true },
      where: isAdmin ? {} : { uploaderId: session.userId },
    }),
  ]);

  const totalSize = storageAgg._sum.fileSize ?? 0;
  const totalDownloads = ownFiles.reduce((s: number, f: any) => s + f.downloadCount, 0);

  const stats = [
    { label: "Tài liệu", value: ownFiles.length, icon: FileArchive, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/60", border: "border-blue-100 dark:border-blue-900/50" },
    { label: "Dung lượng", value: formatFileSize(totalSize), icon: HardDrive, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/60", border: "border-indigo-100 dark:border-indigo-900/50" },
    { label: "Chuyên mục", value: categories.length, icon: FolderOpen, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/60", border: "border-emerald-100 dark:border-emerald-900/50" },
    { label: "Lượt tải", value: totalDownloads, icon: TrendingUp, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/60", border: "border-violet-100 dark:border-violet-900/50" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-3 sm:py-8 space-y-4 sm:space-y-6 transition-colors duration-300">
      {/* Compact Hero Header */}
      <div className="card !py-4 !px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: greeting */}
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Xin chào,{" "}
            <span className="gradient-text">{session.displayName ?? session.username}</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {isAdmin ? "Quản trị viên — Toàn quyền quản lý tài liệu" : "Quản lý tài liệu của bạn"}
          </p>
        </div>

        {/* Right: stats mini row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:items-center gap-2 w-full md:w-auto">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl border ${s.bg} ${s.border} w-full md:w-auto`}
            >
              <div className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20">
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-sm font-bold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Dashboard Client (tabs: upload / files / settings) */}
      <DashboardClient
        categories={categories}
        isAdmin={isAdmin}
      />
    </div>
  );
}

