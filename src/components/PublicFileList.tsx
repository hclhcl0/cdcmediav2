// src/components/PublicFileList.tsx
"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Search, Download, Eye, X, Image as ImageIcon, Headphones, FileText, Layers, FileSpreadsheet, Presentation, FileEdit, Video, LayoutGrid, Lock, Hash, ChevronDown, ChevronUp } from "lucide-react";
import * as Icons from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileIcon, getFileCategory } from "@/utils/fileIcon";
import { formatFileSize, formatDate } from "@/utils/format";
import type { CategoryWithCount, FileWithRelations } from "@/types";
import { clsx } from "clsx";

interface Group {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  files: FileWithRelations[];
  categories: CategoryWithCount[];
  groups: Group[];
}

// ── Filter Toolbar Configuration ─────────────────────────────────────────────
const FILE_TYPE_FILTERS = [
  { value: "", label: "Tất cả", icon: LayoutGrid },
  { value: "video", label: "Video", icon: Video },
  { value: "image", label: "Hình ảnh", icon: ImageIcon },
  { value: "application/pdf", label: "PDF", icon: FileText },
  { value: "word", label: "Word", icon: FileEdit },
  { value: "audio", label: "Âm thanh", icon: Headphones },
  { value: "sheet", label: "Excel", icon: FileSpreadsheet },
  { value: "presentation", label: "PowerPoint", icon: Presentation },
];

// Helper to get vector hero icon & stick style for card thumbnail (Icon-only)
export function getFileHeroIconInfo(mimeType: string, filename?: string) {
  const cat = getFileCategory(mimeType, filename);
  switch (cat) {
    case "video":
      return { label: "Video", icon: Video, bg: "bg-purple-600/90 text-white border-purple-400/40 shadow-purple-500/20" };
    case "image":
      return { label: "Hình ảnh", icon: ImageIcon, bg: "bg-emerald-600/90 text-white border-emerald-400/40 shadow-emerald-500/20" };
    case "pdf":
      return { label: "PDF", icon: FileText, bg: "bg-rose-600/90 text-white border-rose-400/40 shadow-rose-500/20" };
    case "word":
      return { label: "Word", icon: FileEdit, bg: "bg-blue-600/90 text-white border-blue-400/40 shadow-blue-500/20" };
    case "audio":
      return { label: "Âm thanh", icon: Headphones, bg: "bg-pink-600/90 text-white border-pink-400/40 shadow-pink-500/20" };
    case "excel":
      return { label: "Excel", icon: FileSpreadsheet, bg: "bg-green-600/90 text-white border-green-400/40 shadow-green-500/20" };
    case "powerpoint":
      return { label: "PowerPoint", icon: Presentation, bg: "bg-orange-600/90 text-white border-orange-400/40 shadow-orange-500/20" };
    default:
      return { label: "Tài liệu", icon: FileText, bg: "bg-slate-600/90 text-white border-slate-400/40 shadow-slate-500/20" };
  }
}

const getCategoryGroup = (catName: string, availableGroups: Group[]) => {
  if (!catName || !availableGroups || availableGroups.length === 0) return null;
  const lower = catName.toLowerCase();
  
  if ((lower.includes("video") || lower.includes("clip") || lower.includes("phim")) && availableGroups.some(g => g.id === "VIDEO")) return "VIDEO";
  if ((lower.includes("audio") || lower.includes("âm thanh") || lower.includes("mp3")) && availableGroups.some(g => g.id === "AUDIO")) return "AUDIO";
  if ((lower.includes("hình ảnh") || lower.includes("ảnh") || lower.includes("banner") || lower.includes("poster") || lower.includes("infographic")) && availableGroups.some(g => g.id === "GRAPHICS")) return "GRAPHICS";
  
  const docGroup = availableGroups.find(g => g.id === "DOCUMENTS");
  return docGroup ? docGroup.id : availableGroups[availableGroups.length - 1].id;
};

const isDepartmentTag = (tagName: string) => {
  const depts = [
    "tổ chức - hành chính",
    "kế hoạch - tài chính",
    "kế hoạch - nghiệp vụ",
    "pc bệnh truyền nhiễm",
    "khoa bệnh truyền nhiễm",
    "pc hiv/aids",
    "pc bệnh không lây nhiễm",
    "sức khỏe môi trường - y tế trường học",
    "sức khỏe sinh sản",
    "dinh dưỡng",
    "kiểm dịch y tế quốc tế",
    "ký sinh trùng - côn trùng",
    "truyền thông",
    "xét nghiệm",
    "dược - vật tư y tế",
    "phòng khám đa khoa",
    "bệnh nghề nghiệp"
  ];
  return depts.includes(tagName.toLowerCase().trim());
};

// ── Apple TV Style Media Card Component ──────────────────────────────────────
function AppleTVCard({ file, onTagClick }: { file: FileWithRelations; onTagClick?: (tagName: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const isNew = Date.now() - new Date(file.createdAt).getTime() < 24 * 60 * 60 * 1000;
  const isVideo = file.fileType.startsWith("video/") || (file.filename && /\.(mp4|mov|avi|webm|mkv)$/i.test(file.filename));
  const isAudio = file.fileType.startsWith("audio/");
  const isAlbum = file.attachments && file.attachments.length > 0;
  const heroIconInfo = getFileHeroIconInfo(file.fileType, file.filename);
  const HeroIcon = heroIconInfo.icon;

  // Thumbnail URL calculation
  const hasValidThumb = !imgError && (Boolean(file.thumbnailUrl) || Boolean(file.driveFileId) || (file.fileType.startsWith("image/") && file.filepath !== "external"));
  const thumbSrc = `/api/thumbnail/${file.id}`;

  const cleanTags = file.tags ? file.tags.filter((t: any) => !isDepartmentTag(t.tag.name)) : [];

  return (
    <div className="group relative flex flex-col rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-cyan-500/10 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
      {/* 16:9 Apple TV Cinematic Poster Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950 block">
        {/* Background Clickable Link to Document */}
        <Link href={`/document/${file.id}`} className="absolute inset-0 z-0 block cursor-pointer" aria-label={file.title}>
          {hasValidThumb && !isAudio ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbSrc}
              alt={file.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : !file.isPublic ? (
            /* Unshared / Private / Login-Required Document Fallback Poster (Adaptive Light & Dark Mode) */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100/90 dark:from-slate-950 dark:via-amber-950/40 dark:to-slate-900 transition-colors duration-300">
              <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-amber-400/30 dark:bg-amber-500/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-orange-400/25 dark:bg-amber-600/15 blur-2xl pointer-events-none" />
              <div className="relative z-10 p-3.5 rounded-2xl bg-white/85 dark:bg-amber-500/10 backdrop-blur-md border border-amber-300/80 dark:border-amber-500/30 shadow-xl group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400 drop-shadow-md" />
              </div>
            </div>
          ) : isAudio ? (
            /* Audio Soundwave Equalizer Poster (Adaptive Light & Dark Mode) */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-100 via-rose-50 to-indigo-100 dark:from-slate-950 dark:via-purple-950/80 dark:to-slate-900 transition-colors duration-300">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-rose-400/30 dark:bg-pink-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-purple-400/30 dark:bg-purple-500/20 blur-2xl pointer-events-none" />
              
              {/* Center Headphones Icon */}
              <div className="relative z-10 p-2.5 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-md border border-purple-200/80 dark:border-white/20 shadow-xl mb-3 group-hover:scale-110 transition-all duration-300">
                <Headphones className="w-6 h-6 text-purple-600 dark:text-pink-400 drop-shadow-md" />
              </div>

              {/* Dynamic Soundwave Visualizer Bars */}
              <div className="relative z-10 flex items-center justify-center gap-1.5 h-7 px-4">
                {[35, 70, 95, 55, 85, 45, 90, 100, 65, 80, 50, 75, 40].map((height, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-gradient-to-t from-purple-600 via-pink-500 to-rose-400 dark:from-pink-500 dark:via-rose-400 dark:to-purple-400 shadow-sm"
                    style={{
                      height: `${height}%`,
                      opacity: 0.9,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Clean Minimalist Fallback Poster (Adaptive Light & Dark Mode) */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100/90 dark:from-slate-900 dark:via-slate-850 dark:to-blue-950 transition-colors duration-300">
              <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-blue-400/20 dark:bg-blue-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-indigo-400/20 dark:bg-indigo-500/20 blur-2xl pointer-events-none" />
              
              {/* Center File Hero Icon */}
              <div className="relative z-10 p-3.5 rounded-2xl bg-white/85 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/20 shadow-xl group-hover:scale-110 group-hover:border-white/40 transition-all duration-300 flex items-center justify-center">
                <HeroIcon className="w-7 h-7 text-slate-700 dark:text-white drop-shadow-md" />
              </div>
            </div>
          )}

          {/* Ambient Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        </Link>

        {/* Floating Stick Category Badge (Top-Left, Arrow pointing to the right >, flush to top-left) */}
        <div className="absolute top-0 left-0 z-10 pointer-events-none">
          <span
            className={clsx(
              "backdrop-blur-md bg-black/60 text-white/95 border-r border-b border-white/20 pl-2.5 pr-3.5 py-1 text-[9px] font-bold tracking-wide uppercase shadow-md inline-flex items-center gap-1.5 select-none",
              "[clip-path:polygon(0%_0%,calc(100%-8px)_0%,100%_50%,calc(100%-8px)_100%,0%_100%)]"
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: file.category.color ?? "#38bdf8" }}
            />
            <span className="truncate max-w-[120px]">{file.category.name}</span>
          </span>
        </div>

        {/* Floating Stick Badges & Tags (Top-Right / Right side of thumbnail) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1 max-w-[55%] pointer-events-auto">
          <div className="flex items-center gap-1">
            {isNew && (
              <span className="backdrop-blur-md bg-rose-600/90 text-white border border-rose-400/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse tracking-wider">
                NEW
              </span>
            )}
            {isAlbum && (
              <span className="backdrop-blur-md bg-purple-600/80 text-white border border-purple-400/30 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <Layers className="w-2.5 h-2.5" /> Album
              </span>
            )}
            {/* Quick Download Button (Left of Hero Icon) */}
            <a
              href={`/api/download/${file.id}`}
              download
              className="w-7 h-7 rounded-full backdrop-blur-md bg-black/60 hover:bg-[#1D78B8] hover:text-white dark:bg-black/60 dark:hover:bg-sky-600 text-white/90 border border-white/20 shadow-md flex items-center justify-center transition-all group-hover:scale-110 active:scale-95 cursor-pointer"
              title="Tải xuống tài liệu"
              aria-label="Tải xuống"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            {/* Stick-style Hero Icon-Only Format Badge on Thumbnail */}
            <span
              className={clsx("w-7 h-7 rounded-full backdrop-blur-md shadow-md border flex items-center justify-center transition-transform group-hover:scale-110", heroIconInfo.bg)}
              title={heroIconInfo.label}
              aria-label={heroIconInfo.label}
            >
              <HeroIcon className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Colorless Translucent Frosted Glass Sticky Arrow Tabs (Pointing inward, square edge flush to thumb edge) */}
          {cleanTags.length > 0 && (
            <div className="flex flex-col items-end gap-1.5 sm:gap-1 mt-1 -mr-2.5">
              {cleanTags.slice(0, 3).map((t: any) => (
                <button
                  key={t.tag.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTagClick?.(t.tag.name.toLowerCase());
                  }}
                  className={clsx(
                    "backdrop-blur-md bg-black/60 hover:bg-black/85 text-white/95 hover:text-white border-l border-white/25 text-[10px] sm:text-[9px] font-bold sm:font-semibold pl-4 sm:pl-3.5 pr-2.5 sm:pr-2 py-1.5 sm:py-0.5 shadow-md transition-all hover:-translate-x-1 truncate max-w-[135px] select-none text-right cursor-pointer",
                    "[clip-path:polygon(9px_0%,100%_0%,100%_100%,9px_100%,0%_50%)] sm:[clip-path:polygon(8px_0%,100%_0%,100%_100%,8px_100%,0%_50%)]"
                  )}
                  title={`Lọc theo thẻ: ${t.tag.name}`}
                >
                  #{t.tag.name}
                </button>
              ))}
              {cleanTags.length > 3 && (
                <span
                  className="backdrop-blur-md bg-black/50 text-white/90 text-[9px] sm:text-[8px] font-bold pl-3.5 sm:pl-3 pr-2 sm:pr-1.5 py-1 sm:py-0.5 shadow-sm [clip-path:polygon(7px_0%,100%_0%,100%_100%,7px_100%,0%_50%)] sm:[clip-path:polygon(6px_0%,100%_0%,100%_100%,6px_100%,0%_50%)]"
                >
                  +{cleanTags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Floating Stats Inside Thumbnail */}
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
              {file.year ? `Năm ${file.year}` : formatDate(file.createdAt)}
            </span>

            {/* View & Download Counts next to Upload Date */}
            {(file.viewCount > 0 || file.downloadCount > 0) && (
              <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/55 text-white/90 border border-white/15 px-1.5 py-0.5 rounded-md text-[9px] font-medium shadow-sm shrink-0">
                {file.viewCount > 0 && (
                  <span className="flex items-center gap-0.5" title={`${file.viewCount} lượt xem`}>
                    <Eye className="w-2.5 h-2.5 text-white/70" /> {file.viewCount}
                  </span>
                )}
                {file.downloadCount > 0 && (
                  <span className="flex items-center gap-0.5 text-emerald-400 font-semibold" title={`${file.downloadCount} lượt tải`}>
                    <Download className="w-2.5 h-2.5 text-emerald-400" /> {file.downloadCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: File Size */}
          <span className="backdrop-blur-md bg-black/60 text-white/90 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10 shadow-sm shrink-0">
            {formatFileSize(file.fileSize)}
          </span>
        </div>
      </div>

      {/* Card Info Content (Apple TV clean & compact) */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-center space-y-1">
        {/* Title */}
        <Link href={`/document/${file.id}`} className="block">
          <h3
            className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-[15px] leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors"
            title={file.title}
          >
            {file.title}
          </h3>
        </Link>

        {/* Description (Compact 2 lines) */}
        {file.description ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed" title={file.description}>
            {file.description}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic line-clamp-1">
            Chưa có mô tả chi tiết
          </p>
        )}
      </div>
    </div>
  );
}

export default function PublicFileList({ files, categories, groups }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Collect all tags from files
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    const originalNames = new Map<string, string>();

    files.forEach((f) => {
      const added = new Set<string>();
      f.tags.forEach(({ tag }) => {
        if (isDepartmentTag(tag.name)) return;
        const lowerName = tag.name.toLowerCase();
        if (!added.has(lowerName)) {
          added.add(lowerName);
          counts.set(lowerName, (counts.get(lowerName) || 0) + 1);
          if (!originalNames.has(lowerName)) {
            originalNames.set(lowerName, tag.name);
          }
        }
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([lowerName, count]) => ({
        id: lowerName,
        name: originalNames.get(lowerName) || lowerName,
        lowerName,
        count
      }));
  }, [files]);

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [files]);

  const filtered = useMemo(() => {
    return sortedFiles.filter((f) => {
      const cat = categories.find(c => c.id === f.categoryId);
      const catGroup = cat?.group || getCategoryGroup(cat?.name || f.category.name, groups);

      if (selectedGroup && catGroup !== selectedGroup) return false;
      if (selectedCategory && f.categoryId !== selectedCategory) return false;
      if (typeFilter) {
        const match = typeFilter.includes("/")
          ? f.fileType === typeFilter
          : f.fileType.includes(typeFilter) || f.fileType.startsWith(typeFilter + "/");
        if (!match) return false;
      }
      if (selectedTag && !f.tags.some(({ tag }) => tag.name.toLowerCase() === selectedTag)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !f.title.toLowerCase().includes(q) &&
          !(f.description ?? "").toLowerCase().includes(q) &&
          !f.tags.some(({ tag }) => tag.name.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [sortedFiles, selectedGroup, selectedCategory, typeFilter, selectedTag, query, categories, groups]);

  const clearFilters = useCallback(() => {
    setSelectedGroup("");
    setSelectedCategory("");
    setTypeFilter("");
    setSelectedTag("");
    setQuery("");
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroup, selectedCategory, typeFilter, selectedTag, query]);

  useEffect(() => {
    setSelectedCategory("");
  }, [selectedGroup]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const hasActiveFilters = selectedGroup || selectedCategory || typeFilter || selectedTag || query;

  const currentGroupCategories = categories.filter(c => {
    const cGroup = c.group || getCategoryGroup(c.name, groups);
    return cGroup === selectedGroup;
  });

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      {/* 1. TOP: Phân hệ tabs (Apple TV sleek responsive pills - flex-wrap no horizontal scroll) */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-1">
        <button
          onClick={() => setSelectedGroup("")}
          className={clsx(
            "relative px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2",
            !selectedGroup
              ? "text-white shadow-md shadow-blue-500/20"
              : "bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          {!selectedGroup && (
            <motion.div
              layoutId="active-group"
              className="absolute inset-0 bg-gradient-to-r from-[#1D78B8] to-[#0d5485] dark:from-sky-600 dark:to-blue-700 rounded-xl sm:rounded-full shadow-md"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Tất cả phân hệ</span>
        </button>
        {groups.map((grp) => {
          const IconComponent = (Icons as any)[grp.icon] || Icons.Folder;
          return (
            <button
              key={grp.id}
              onClick={() => setSelectedGroup(grp.id)}
              className={clsx(
                "relative px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2",
                selectedGroup === grp.id
                  ? "text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {selectedGroup === grp.id && (
                <motion.div
                  layoutId="active-group"
                  className="absolute inset-0 bg-gradient-to-r from-[#1D78B8] to-[#0d5485] dark:from-sky-600 dark:to-blue-700 rounded-xl sm:rounded-full shadow-md"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <span className={clsx(selectedGroup === grp.id ? "text-white" : "text-blue-500 dark:text-sky-400")}>
                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span>{grp.name}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. DƯỚI TẤT CẢ PHÂN HỆ: Unified Search & Format Filter Toolbar */}
      <div className="space-y-2.5 pb-2.5 pt-1 border-y border-slate-100 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Compact Search Input with Clear Button */}
          <div className="relative w-full lg:w-72 xl:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu, video, ảnh…"
              aria-label="Tìm kiếm tài liệu"
              className="input-base text-xs sm:text-sm !pl-10 !pr-8 h-10 rounded-xl w-full bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 shadow-2xs focus:bg-white dark:focus:bg-slate-900"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Labeled Format Filter Buttons - flex-wrap to fit naturally on mobile and tablet */}
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 min-w-0 flex-1 justify-start lg:justify-end">
            {FILE_TYPE_FILTERS.map((f) => {
              const active = typeFilter === f.value;
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={clsx(
                    "px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-2xs border select-none active:scale-95",
                    active
                      ? "bg-blue-600 dark:bg-sky-600 text-white border-blue-500 shadow-xs shadow-blue-500/20"
                      : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon className={clsx("w-3.5 h-3.5", active ? "text-white" : "text-slate-500 dark:text-slate-400")} />
                  <span>{f.label}</span>
                </button>
              );
            })}

            {/* Clear Filters button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center gap-1 text-xs text-red-500 dark:text-red-400 px-2.5 py-1.5 rounded-xl h-auto border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                title="Xóa tất cả bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Categories if a group is selected */}
        {selectedGroup && currentGroupCategories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-1 mb-3">
            <button
              onClick={() => setSelectedCategory("")}
              className={clsx(
                "relative px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors",
                !selectedCategory
                  ? "text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
              )}
            >
              {!selectedCategory && (
                <motion.div
                  layoutId="active-category"
                  className="absolute inset-0 bg-blue-600 dark:bg-sky-600 rounded-xl sm:rounded-full shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">Tất cả</span>
            </button>
            {currentGroupCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "relative px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors",
                  selectedCategory === cat.id
                    ? "text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                )}
              >
                {selectedCategory === cat.id && (
                  <motion.div
                    layoutId="active-category"
                    className="absolute inset-0 bg-blue-600 dark:bg-sky-600 rounded-xl sm:rounded-full shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Stats Line */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 mb-4">
          <p>
            Hiển thị <strong className="text-slate-800 dark:text-slate-200 font-bold">{filtered.length}</strong> tài liệu
            {hasActiveFilters && <span className="text-sky-600 dark:text-sky-400 font-semibold"> (đang lọc)</span>}
          </p>
          {totalPages > 1 && (
            <span>Trang {currentPage} / {totalPages}</span>
          )}
        </div>

        {/* Apple TV Cinematic 16:9 Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-base">Không tìm thấy tài liệu phù hợp</p>
            <p className="text-xs text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc chọn tất cả phân hệ</p>
            <button onClick={clearFilters} className="btn-primary text-xs px-4 py-2 mt-2">Xóa bộ lọc</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5">
            {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((file) => (
              <AppleTVCard
                key={file.id}
                file={file}
                onTagClick={(tag) => {
                  setSelectedTag(tag);
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              Trang trước
            </button>
            
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={clsx(
                        "w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition shadow-sm",
                        currentPage === page 
                          ? "bg-blue-600 dark:bg-sky-600 text-white shadow-md shadow-blue-500/20" 
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 || 
                  page === currentPage + 2
                ) {
                  return <span key={page} className="text-slate-400 dark:text-slate-600 px-1">…</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              Trang sau
            </button>
          </div>
        )}

        {/* Popular Tags Cloud (Professional & Gentle UI/UX Pro Max) */}
        {allTags.length > 0 && (
          <div className="mt-8 rounded-2xl bg-slate-50/70 dark:bg-slate-800/25 border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 backdrop-blur-xs transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 dark:bg-sky-400/15 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
                    Từ khóa & Chủ đề phổ biến
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
                    Chạm để lọc nhanh tài liệu theo chủ đề sức khỏe
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {/* Active filter badge with clear button */}
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag("")}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 px-2.5 py-0.5 rounded-full transition hover:bg-sky-200/80 dark:hover:bg-sky-900/80 shadow-2xs"
                    title="Xóa bộ lọc thẻ hiện tại"
                  >
                    <span>Đang lọc: #{selectedTag}</span>
                    <X className="w-3 h-3 ml-0.5 text-sky-500" />
                  </button>
                )}

                {allTags.length > 18 && (
                  <button
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 bg-white/90 dark:bg-slate-800/80 hover:bg-sky-50/50 dark:hover:bg-slate-700/60 border border-slate-200/70 dark:border-slate-700/60 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
                  >
                    <span>{showAllTags ? "Thu gọn" : `Xem tất cả (${allTags.length})`}</span>
                    {showAllTags ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>

            {/* Chips list */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={() => setSelectedTag("")}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-2xs cursor-pointer select-none",
                  !selectedTag
                    ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs ring-1 ring-slate-800/20 dark:ring-slate-100/30"
                    : "bg-white/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                Tất cả
              </button>

              {(showAllTags ? allTags : allTags.slice(0, 18)).map((t) => {
                const active = selectedTag === t.lowerName;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTag(active ? "" : t.lowerName)}
                    className={clsx(
                      "group px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 shadow-2xs cursor-pointer select-none",
                      active
                        ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-xs shadow-sky-500/25 ring-2 ring-sky-400/20"
                        : "bg-white/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60 hover:border-sky-300 dark:hover:border-sky-500/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 hover:text-sky-600 dark:hover:text-sky-300"
                    )}
                  >
                    <span className={clsx("font-semibold mr-0.5", active ? "text-sky-100" : "text-sky-500/70 dark:text-sky-400/70 group-hover:text-sky-600 dark:group-hover:text-sky-300")}>
                      #
                    </span>
                    <span className="truncate max-w-[160px]">{t.name}</span>
                    <span
                      className={clsx(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-medium transition-colors",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-700/80 text-slate-400 dark:text-slate-400 group-hover:bg-sky-100/80 dark:group-hover:bg-sky-900/40 group-hover:text-sky-600 dark:group-hover:text-sky-300"
                      )}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
