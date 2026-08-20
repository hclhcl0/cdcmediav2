// src/components/TopDownloadedFiles.tsx
// Phiên bản rút gọn 2 cột (trên PC) của Top tài liệu tải nhiều nhất cho Trang chủ
"use client";

import Link from "next/link";
import { Trophy, Download, ArrowUpRight, Flame } from "lucide-react";
import { formatFileSize } from "@/utils/format";
import { FileIcon } from "@/utils/fileIcon";
import { clsx } from "clsx";

export type TopDownloadedFile = {
  id: string;
  title: string;
  filename?: string | null;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  viewCount: number;
  createdAt: Date | string;
  isPublic?: boolean;
  category: {
    id?: string;
    name: string;
    color: string | null;
    icon?: string | null;
  };
};

interface Props {
  files: TopDownloadedFile[];
}

export default function TopDownloadedFiles({ files }: { files: TopDownloadedFile[] }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="w-full bg-white/90 dark:bg-slate-900/85 backdrop-blur-md shadow-md rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 dark:border-slate-800 transition-colors duration-300">
      {/* Header gọn gàng */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            Tài liệu tải nhiều nhất
          </h2>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 px-2 py-0.5 rounded-full">
          <Flame className="w-3 h-3 text-amber-500 animate-pulse" /> Top {files.length}
        </span>
      </div>

      {/* Danh sách 2 cột trên PC (md/lg), 1 cột trên Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
        {files.map((file, idx) => (
          <Link
            key={file.id}
            href={`/document/${file.id}`}
            className="group p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/90 hover:border-blue-200/80 dark:hover:border-blue-800/60 hover:shadow-2xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 cursor-pointer block min-w-0"
          >
            {/* Huy hiệu thứ hạng */}
            <span
              className={clsx(
                "w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 shadow-2xs",
                idx === 0
                  ? "bg-amber-400 text-slate-950 ring-1 ring-amber-500/30"
                  : idx === 1
                  ? "bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 ring-1 ring-slate-400/20"
                  : idx === 2
                  ? "bg-amber-600 text-white ring-1 ring-amber-700/20"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
              )}
            >
              {idx + 1}
            </span>

            {/* Icon loại file */}
            <div className="w-6 h-6 rounded bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/40 dark:border-slate-700/50 flex items-center justify-center shrink-0">
              <FileIcon
                mimeType={file.fileType}
                filename={file.filename || file.title}
                className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              />
            </div>

            {/* Tiêu đề & chuyên mục */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {file.title}
                </p>
                <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-blue-500 transition-all shrink-0 hidden sm:inline-block" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded text-white font-medium shadow-2xs shrink-0 truncate max-w-[120px]"
                  style={{ backgroundColor: file.category?.color ?? "#3B82F6" }}
                >
                  {file.category?.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                  {formatFileSize(file.fileSize)}
                </span>
              </div>
            </div>

            {/* Số lượt tải */}
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded-lg shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{file.downloadCount.toLocaleString("vi-VN")}</span>
              <span className="text-[10px] font-normal text-slate-400 hidden lg:inline">lượt</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
