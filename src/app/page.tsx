import { prisma } from "@/lib/prisma";
import PublicFileList from "@/components/PublicFileList";
import TopDownloadedFiles from "@/components/TopDownloadedFiles";
import BannerStrip from "@/components/BannerStrip";
import { isDriveConfigured } from "@/lib/gdrive";
import { formatFileSize } from "@/utils/format";
import { FileArchive, FolderOpen, Download, HardDrive, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, files, storageAgg, downloadAgg, useDrive, appGroupsSetting, topDownloadedFiles] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { files: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.mediaFile.findMany({
      include: {
        category: { select: { id: true, name: true, color: true, icon: true, group: true } },
        uploader: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mediaFile.aggregate({ _sum: { fileSize: true } }),
    prisma.mediaFile.aggregate({ _sum: { downloadCount: true } }),
    isDriveConfigured(),
    prisma.appSetting.findUnique({ where: { key: "APP_GROUPS" } }),
    prisma.mediaFile.findMany({
      where: { isPublic: true },
      orderBy: { downloadCount: "desc" },
      take: 6,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    }),
  ]);

  const groups = appGroupsSetting ? JSON.parse(appGroupsSetting.value) : [
    { id: "VIDEO", name: "Thư viện Video", icon: "Film" },
    { id: "AUDIO", name: "Âm thanh & Podcast", icon: "Mic" },
    { id: "GRAPHICS", name: "Ấn phẩm & Hình ảnh", icon: "ImageIcon" },
    { id: "DOCUMENTS", name: "Tài liệu & Khai thác dữ liệu", icon: "FileText" }
  ];

  const totalSize = storageAgg._sum.fileSize ?? 0;
  const totalDownloads = downloadAgg._sum.downloadCount ?? 0;

  const stats = [
    {
      label: "Tài liệu",
      value: files.length,
      icon: FileArchive,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-100 dark:border-blue-900/50",
      iconBg: "bg-white dark:bg-slate-900",
    },
    {
      label: "Chuyên mục",
      value: categories.length,
      icon: FolderOpen,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-100 dark:border-indigo-900/50",
      iconBg: "bg-white dark:bg-slate-900",
    },
    {
      label: "Lượt tải",
      value: totalDownloads.toLocaleString("vi-VN"),
      icon: Download,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-100 dark:border-emerald-900/50",
      iconBg: "bg-white dark:bg-slate-900",
    },
    {
      label: "Dung lượng",
      value: formatFileSize(totalSize),
      icon: HardDrive,
      color: useDrive ? "text-violet-600 dark:text-violet-400" : "text-slate-600 dark:text-slate-400",
      bg: useDrive ? "bg-violet-50 dark:bg-violet-950/40" : "bg-slate-50 dark:bg-slate-800/40",
      border: useDrive ? "border-violet-100 dark:border-violet-900/50" : "border-slate-100 dark:border-slate-800",
      iconBg: "bg-white dark:bg-slate-900",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 space-y-4 transition-colors duration-300">
      {/* Ultra-compact Sleek Hero & Stats Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-xs transition-colors duration-300">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#1D78B8]/10 dark:bg-[#38bdf8]/10 blur-2xl" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-[#F26A21]/10 dark:bg-[#fb923c]/10 blur-2xl" />
        </div>

        <div className="relative px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          {/* Headline & Brief info */}
          <div className="min-w-0 text-left">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight flex items-center gap-2">
              <span>Ngân hàng Tài liệu</span>
              <span className="text-[#1D78B8] dark:text-[#38bdf8]">Truyền thông</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Kho lưu trữ tập trung tài liệu, hình ảnh, video và ấn phẩm phòng chống dịch bệnh CDC Đà Nẵng.
            </p>
          </div>

          {/* Responsive 2-Row x 2-Column Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap md:items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0 pt-1 md:pt-0">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl ${s.bg} border ${s.border} backdrop-blur-md shadow-2xs hover:shadow-xs transition-all w-full md:w-auto`}
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-white/80 dark:bg-black/25 shadow-2xs shrink-0 border border-black/5 dark:border-white/10">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="flex flex-col items-center justify-center text-center min-w-[52px]">
                  <span className={`text-base sm:text-lg md:text-xl font-black ${s.color} tabular-nums leading-tight tracking-tight`}>
                    {s.value}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5 text-center">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner MIDDLE — giữa trang, sau hero */}
      <BannerStrip position="MIDDLE" className="rounded-2xl overflow-hidden shadow-sm" />

      {/* File list */}
      <div className="w-full bg-white dark:bg-slate-900/90 shadow-xl shadow-slate-200/50 dark:shadow-black/40 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 relative z-10 transition-colors duration-300">
        <PublicFileList files={files as never} categories={categories as never} groups={groups} />
      </div>

      {/* Top tài liệu được tải nhiều nhất */}
      {topDownloadedFiles.length > 0 && (
        <TopDownloadedFiles files={topDownloadedFiles as never} />
      )}
    </div>
  );
}
