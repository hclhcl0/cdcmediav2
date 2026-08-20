// src/app/dashboard/UserFilesList.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Eye, Download, Pencil, Trash2, RefreshCw, Sparkles, Filter, Lock } from "lucide-react";
import { FileIcon } from "@/utils/fileIcon";
import { formatFileSize, formatDate } from "@/utils/format";
import EditFileModal from "./EditFileModal";
import toast from "react-hot-toast";
import type { CategoryWithCount, FileWithRelations } from "@/types";

interface Group {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  categories: CategoryWithCount[];
  isAdmin: boolean;
  refreshSignal?: number;
}

export default function UserFilesList({ categories, isAdmin, refreshSignal }: Props) {
  const [files, setFiles] = useState<FileWithRelations[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<FileWithRelations | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("");
  const itemsPerPage = 10;

  const fetchFilesAndGroups = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, groupsRes] = await Promise.all([
        fetch("/api/files?limit=1000"),
        fetch("/api/groups")
      ]);
      const filesData = await filesRes.json();
      const groupsData = await groupsRes.json();
      setFiles(filesData.files ?? []);
      setGroups(groupsData.groups ?? []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFilesAndGroups(); }, [fetchFilesAndGroups, refreshSignal]);

  const getCategoryGroup = useCallback((catName: string, availableGroups: Group[]) => {
    if (!catName || !availableGroups || availableGroups.length === 0) return null;
    const lower = catName.toLowerCase();
    
    if ((lower.includes("video") || lower.includes("clip") || lower.includes("phim")) && availableGroups.some(g => g.id === "VIDEO")) return "VIDEO";
    if ((lower.includes("audio") || lower.includes("âm thanh") || lower.includes("mp3")) && availableGroups.some(g => g.id === "AUDIO")) return "AUDIO";
    if ((lower.includes("hình ảnh") || lower.includes("ảnh") || lower.includes("banner") || lower.includes("poster") || lower.includes("infographic")) && availableGroups.some(g => g.id === "GRAPHICS")) return "GRAPHICS";
    
    const docGroup = availableGroups.find(g => g.id === "DOCUMENTS");
    return docGroup ? docGroup.id : availableGroups[availableGroups.length - 1].id;
  }, []);

  const filteredFiles = useMemo(() => {
    if (!selectedGroupFilter) return files;
    return files.filter(f => {
      const cat = categories.find(c => c.id === f.categoryId);
      const catGroup = cat?.group || getCategoryGroup(cat?.name || f.category?.name || "", groups);
      return catGroup === selectedGroupFilter;
    });
  }, [files, selectedGroupFilter, categories, groups, getCategoryGroup]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedFiles(new Set());
  }, [selectedGroupFilter]);

  async function deleteFile(file: FileWithRelations) {
    if (!confirm(`Xóa "${file.title}"? Hành động này không thể hoàn tác.`)) return;
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      fetchFilesAndGroups();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Lỗi xóa file");
    }
  }

  const handleBulkMove = async () => {
    if (selectedFiles.size === 0 || !bulkCategoryId) return;
    
    const confirmMove = window.confirm(`Bạn có chắc muốn chuyển ${selectedFiles.size} tài liệu sang chuyên mục mới?`);
    if (!confirmMove) return;

    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/files/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: Array.from(selectedFiles),
          categoryId: bulkCategoryId
        }),
      });

      if (res.ok) {
        toast.success(`Đã chuyển thành công ${selectedFiles.size} tài liệu`);
        setSelectedFiles(new Set());
        setBulkCategoryId("");
        fetchFilesAndGroups();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Lỗi chuyển chuyên mục");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDescribe = async () => {
    if (selectedFiles.size === 0) return;
    const confirmAI = window.confirm(`Bạn có chắc muốn dùng AI để tạo mô tả cho ${selectedFiles.size} tài liệu?\nLưu ý: Quá trình này có thể mất vài phút tuỳ thuộc vào độ dài nội dung.`);
    if (!confirmAI) return;

    setIsBulkUpdating(true);
    const loadingToast = toast.loading(`Đang nhờ AI phân tích và tạo mô tả...`);
    try {
      const res = await fetch("/api/files/bulk-describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.message);
        setSelectedFiles(new Set());
        fetchFilesAndGroups();
      } else {
        toast.error(d.error ?? "Lỗi gọi AI");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi hệ thống");
    } finally {
      toast.dismiss(loadingToast);
      setIsBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Đang tải…
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
        <Download className="w-10 h-10 opacity-30" />
        <p className="font-medium">Chưa có tài liệu nào</p>
        <p className="text-sm">Hãy tải lên tài liệu đầu tiên</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden p-0">
        {selectedFiles.size > 0 ? (
          <div className="px-3 sm:px-5 py-3 border-b border-blue-100 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-1 rounded-lg">Đã chọn {selectedFiles.size}</span>
              <button onClick={() => setSelectedFiles(new Set())} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">Bỏ chọn</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleBulkDescribe}
                disabled={isBulkUpdating}
                className="btn-secondary py-1.5 text-xs sm:text-sm h-auto flex items-center gap-1 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex-1 sm:flex-initial justify-center"
                title="Tự động đọc nội dung và tạo mô tả bằng AI"
              >
                {isBulkUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Tạo mô tả (AI)
              </button>
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="input-base py-1.5 text-xs sm:text-sm h-auto flex-1 sm:flex-initial"
              >
                <option value="">-- Chọn chuyên mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.group ? `[${c.group}] ` : ""}{c.name}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleBulkMove}
                disabled={!bulkCategoryId || isBulkUpdating}
                className="btn-primary py-1.5 text-xs sm:text-sm h-auto flex items-center gap-1 flex-1 sm:flex-initial justify-center"
              >
                {isBulkUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                Chuyển nhanh
              </button>
            </div>
          </div>
        ) : (
          <div className="px-3.5 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            {/* Title + Actions row */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                {isAdmin ? "Tất cả tài liệu" : "Tài liệu của bạn"}
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">({filteredFiles.length})</span>
              </h2>
              <button onClick={fetchFilesAndGroups} className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-2.5 h-auto" title="Làm mới">
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
            {/* Pill filter tabs for groups */}
            <div className="flex flex-wrap gap-1.5 pb-0.5">
              <button
                onClick={() => setSelectedGroupFilter("")}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  !selectedGroupFilter
                    ? "bg-blue-600 dark:bg-sky-600 text-white border-blue-500 shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                Tất cả
              </button>
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupFilter(g.id)}
                  className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedGroupFilter === g.id
                      ? "bg-blue-600 dark:bg-sky-600 text-white border-blue-500 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-3.5 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
            <input 
              type="checkbox"
              checked={
                filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length > 0 &&
                filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(f => selectedFiles.has(f.id))
              }
              onChange={(e) => {
                const newSet = new Set(selectedFiles);
                const currentFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                if (e.target.checked) {
                  currentFiles.forEach(f => newSet.add(f.id));
                } else {
                  currentFiles.forEach(f => newSet.delete(f.id));
                }
                setSelectedFiles(newSet);
              }}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên tài liệu</span>
          </div>

          {filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((file) => (
            <div key={file.id} className="px-3 sm:px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                <input 
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedFiles);
                    if (e.target.checked) newSet.add(file.id);
                    else newSet.delete(file.id);
                    setSelectedFiles(newSet);
                  }}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1 sm:mt-0 shrink-0"
                />
                <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 relative border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                  {(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={`/api/thumbnail/${file.id}`} 
                      alt="thumbnail" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`flex items-center justify-center w-full h-full ${(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? 'hidden' : ''}`}>
                    <FileIcon mimeType={file.fileType} filename={file.filename} className="w-5 h-5" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2">{file.title}</p>
                    {!file.isPublic && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 text-[10px] shrink-0">
                        <Lock className="w-2.5 h-2.5" /> Chưa chia sẻ
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                    <span
                      className="px-1.5 py-0.2 rounded-md text-white font-semibold text-[10px] shadow-2xs"
                      style={{ backgroundColor: file.category.color ?? "#3B82F6" }}
                    >
                      {file.category.name}
                    </span>
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span className="hidden sm:inline">{formatDate(file.createdAt)}</span>
                    {isAdmin && (
                      <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
                        {file.uploader.displayName ?? file.uploader.username}
                      </span>
                    )}
                    {file.downloadCount > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{file.downloadCount} tải</span>}
                  </div>
                </div>
                {/* Action buttons: ALWAYS visible on mobile, subtle on desktop hover */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Link href={`/document/${file.id}`} className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Xem">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <a href={`/api/download/${file.id}`} download className="p-1.5 sm:p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition" title="Tải xuống">
                    <Download className="w-4 h-4" />
                  </a>
                  <button onClick={() => setEditingFile(file)} className="p-1.5 sm:p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition" title="Chỉnh sửa">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteFile(file)} className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {Math.ceil(filteredFiles.length / itemsPerPage) > 1 && (
          <div className="flex justify-center items-center gap-2 py-3.5 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 transition"
            >
              ‹ Trước
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50">
              {currentPage} / {Math.ceil(filteredFiles.length / itemsPerPage)}
            </span>
            <button
              disabled={currentPage === Math.ceil(filteredFiles.length / itemsPerPage)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 transition"
            >
              Sau ›
            </button>
          </div>
        )}
      </div>

      {editingFile && (
        <EditFileModal
          file={editingFile}
          categories={categories}
          onClose={() => setEditingFile(null)}
          onSuccess={() => {
            setEditingFile(null);
            fetchFilesAndGroups();
          }}
        />
      )}
    </>
  );
}
