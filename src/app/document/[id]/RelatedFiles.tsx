"use client";
import { useState } from "react";
import Link from "next/link";
import { formatFileSize, formatDate } from "@/utils/format";
import { Download, Headphones, Layers, Lock } from "lucide-react";
import { getFileHeroIconInfo } from "@/components/PublicFileList";
import clsx from "clsx";

export default function RelatedFiles({ relatedFiles }: { relatedFiles: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  if (relatedFiles.length === 0) return null;

  const totalPages = Math.ceil(relatedFiles.length / itemsPerPage);
  const paginatedFiles = relatedFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
          <span className="w-2 h-7 rounded-full bg-gradient-to-b from-sky-500 to-indigo-600 shadow-sm block"></span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-sky-700 dark:from-slate-100 dark:to-sky-300">
            Tài liệu cùng chuyên mục
          </span>
        </h2>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 shadow-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
            >
              &lt;
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-2 min-w-[3rem] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {paginatedFiles.map((rel) => {
          const isVideo = rel.fileType?.startsWith("video/") || (rel.filename && /\.(mp4|mov|avi|webm|mkv)$/i.test(rel.filename));
          const isAudio = rel.fileType?.startsWith("audio/");
          const isAlbum = rel.attachments && rel.attachments.length > 0;
          const heroIconInfo = getFileHeroIconInfo(rel.fileType || "", rel.filename);
          const HeroIcon = heroIconInfo.icon;

          return (
            <Link
              key={rel.id}
              href={`/document/${rel.id}`}
              className="group relative flex flex-col rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-cyan-500/10 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 h-full"
            >
              {/* 16:9 Apple TV Cinematic Poster */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950 block">
                {(rel.thumbnailUrl || (rel.fileType?.startsWith("image/") && rel.filepath !== "external")) && !isAudio ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/thumbnail/${rel.id}`}
                    alt={rel.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.lock-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : !rel.isPublic ? (
                  /* Unshared / Private Document Fallback Poster (Adaptive Light & Dark Mode) */
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100/90 dark:from-slate-950 dark:via-amber-950/40 dark:to-slate-900 transition-colors duration-300">
                    <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-amber-400/30 dark:bg-amber-500/15 blur-2xl pointer-events-none" />
                    <div className="relative z-10 p-2.5 rounded-2xl bg-white/85 dark:bg-amber-500/10 backdrop-blur-md border border-amber-300/80 dark:border-amber-500/30 shadow-xl group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400 drop-shadow-md" />
                    </div>
                  </div>
                ) : isAudio ? (
                  /* Audio Soundwave Equalizer Poster (Adaptive Light & Dark Mode) */
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 relative overflow-hidden bg-gradient-to-br from-purple-100 via-rose-50 to-indigo-100 dark:from-slate-950 dark:via-purple-950/80 dark:to-slate-900 transition-colors duration-300">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-rose-400/30 dark:bg-pink-500/20 blur-2xl pointer-events-none" />
                    <div className="relative z-10 p-2 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-md border border-purple-200/80 dark:border-white/20 shadow-xl mb-2.5 group-hover:scale-110 transition-all duration-300">
                      <Headphones className="w-5 h-5 text-purple-600 dark:text-pink-400 drop-shadow-md" />
                    </div>
                    <div className="relative z-10 flex items-center justify-center gap-1 h-6 px-3">
                      {[35, 70, 95, 55, 85, 45, 90, 100, 65, 80, 50].map((height, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-gradient-to-t from-purple-600 via-pink-500 to-rose-400 dark:from-pink-500 dark:via-rose-400 dark:to-purple-400 shadow-sm"
                          style={{ height: `${height}%`, opacity: 0.9 }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Clean Fallback Poster (Adaptive Light & Dark Mode) */
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 relative overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100/90 dark:from-slate-900 dark:via-slate-850 dark:to-blue-950 transition-colors duration-300">
                    <div className="p-3 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-md border border-slate-200/80 dark:border-white/20 shadow-lg group-hover:scale-110 transition-all duration-300">
                      <HeroIcon className="w-7 h-7 text-slate-700 dark:text-white drop-shadow-md" />
                    </div>
                  </div>
                )}

                {/* Ambient Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Floating Stick Category Badge (Top-Left, Arrow pointing to the right >, flush to top-left) */}
                {rel.category && (
                  <div className="absolute top-0 left-0 z-10">
                    <span
                      className={clsx(
                        "backdrop-blur-md bg-black/60 text-white/95 border-r border-b border-white/20 pl-2.5 pr-3.5 py-1 text-[9px] font-bold tracking-wide uppercase shadow-md inline-flex items-center gap-1.5 select-none",
                        "[clip-path:polygon(0%_0%,calc(100%-8px)_0%,100%_50%,calc(100%-8px)_100%,0%_100%)]"
                      )}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: rel.category.color ?? "#38bdf8" }}
                      />
                      <span className="truncate max-w-[120px]">{rel.category.name}</span>
                    </span>
                  </div>
                )}

                {/* Floating Badges */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                  {isAlbum && (
                    <span className="backdrop-blur-md bg-purple-600/80 text-white border border-purple-400/30 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" /> Album
                    </span>
                  )}
                  {/* Quick Download Button (Left of Hero Icon) */}
                  <a
                    href={`/api/download/${rel.id}`}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 rounded-full backdrop-blur-md bg-black/60 hover:bg-[#1D78B8] hover:text-white dark:bg-black/60 dark:hover:bg-sky-600 text-white/90 border border-white/20 shadow-md flex items-center justify-center transition-all group-hover:scale-110 active:scale-95 cursor-pointer"
                    title="Tải xuống tài liệu"
                    aria-label="Tải xuống"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  {/* Hero Icon-Only Format Badge */}
                  <span
                    className={clsx("w-7 h-7 rounded-full backdrop-blur-md shadow-md border flex items-center justify-center transition-transform group-hover:scale-110", heroIconInfo.bg)}
                    title={heroIconInfo.label}
                    aria-label={heroIconInfo.label}
                  >
                    <HeroIcon className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Bottom Stats */}
                <div className="absolute bottom-2 left-0 right-2.5 z-10 flex items-center justify-between pointer-events-none gap-1">
                  {/* Left: Date + Views/Downloads stats */}
                  <div className="flex items-center gap-1 min-w-0">
                    {/* Stick Date Bookmark (Arrow pointing right, flat edge flush to left edge) */}
                    <span
                      className={clsx(
                        "backdrop-blur-md bg-black/55 text-white/90 border-r border-white/20 text-[9px] font-semibold pl-2.5 pr-3.5 py-0.5 shadow-md truncate max-w-[110px] select-none text-left shrink-0",
                        "[clip-path:polygon(0%_0%,calc(100%-8px)_0%,100%_50%,calc(100%-8px)_100%,0%_100%)]"
                      )}
                    >
                      {rel.year ? `Năm ${rel.year}` : formatDate(rel.createdAt)}
                    </span>

                    {/* View & Download Counts next to Upload Date */}
                    {(rel.viewCount > 0 || rel.downloadCount > 0) && (
                      <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/55 text-white/90 border border-white/15 px-1.5 py-0.5 rounded-md text-[9px] font-medium shadow-sm shrink-0">
                        {rel.viewCount > 0 && (
                          <span className="flex items-center gap-0.5" title={`${rel.viewCount} lượt xem`}>
                            <Eye className="w-2.5 h-2.5 text-white/70" /> {rel.viewCount}
                          </span>
                        )}
                        {rel.downloadCount > 0 && (
                          <span className="flex items-center gap-0.5 text-emerald-400 font-semibold" title={`${rel.downloadCount} lượt tải`}>
                            <Download className="w-2.5 h-2.5 text-emerald-400" /> {rel.downloadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: File Size */}
                  <span className="backdrop-blur-md bg-black/60 text-white/90 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10 shadow-sm shrink-0">
                    {formatFileSize(rel.fileSize)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-center space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {rel.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
