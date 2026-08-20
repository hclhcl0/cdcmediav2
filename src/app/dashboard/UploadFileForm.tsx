// src/app/dashboard/UploadFileForm.tsx
"use client";
import { useState, useRef, FormEvent, useEffect } from "react";
import { Upload, X, FileText, Tag, Calendar, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { formatFileSize } from "@/utils/format";
import type { CategoryWithCount } from "@/types";

interface Props {
  categories: CategoryWithCount[];
  onUploaded: () => void;
}

export default function UploadFileForm({ categories, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [tags, setTags] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then(r => r.json())
      .then(d => {
        if (d.tags) setAvailableTags(d.tags.map((t: any) => t.name));
      })
      .catch(() => {});
  }, []);

  // Auto-fill title from filename
  useEffect(() => {
    if (files.length > 0 && !title) {
      setTitle(files[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  }, [files, title]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) setFiles((prev) => [...prev, ...dropped]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "file" && files.length === 0) return;
    if (mode === "link" && !googleDriveLink) return;
    if (!title || !categoryId) return;

    setUploading(true);
    setProgress(0);

    const fd = new FormData();
    if (mode === "file") {
      files.forEach(f => fd.append("file", f));
    }
    if (mode === "link" && googleDriveLink) fd.append("googleDriveLink", googleDriveLink);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("categoryId", categoryId);
    fd.append("tags", tags);
    fd.append("year", year);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 201) {
        toast.success("Tải lên thành công!");
        setFiles([]);
        setGoogleDriveLink("");
        setTitle("");
        setDescription("");
        setTags("");
        setYear(String(new Date().getFullYear()));
        setCategoryId(categories[0]?.id ?? "");
        setProgress(0);
        onUploaded();
      } else {
        const data = JSON.parse(xhr.responseText);
        toast.error(data.error ?? "Lỗi tải lên");
      }
    };

    xhr.onerror = () => { setUploading(false); toast.error("Lỗi kết nối"); };

    xhr.open("POST", "/api/files");
    xhr.send(fd);
  }

  function cancelUpload() {
    xhrRef.current?.abort();
    setUploading(false);
    setProgress(0);
    toast("Đã hủy tải lên", { icon: "🚫" });
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 sm:p-6 w-full">
      {/* Header with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Tải lên tài liệu
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tải tệp tin trực tiếp hoặc liên kết từ Google Drive</p>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === "file" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
          >
            Từ Máy tính
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === "link" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
          >
            Link Google Drive
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mt-4 items-start">
        {/* Left Column: Dropzone & Upload Button */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          {mode === "file" ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-5
                         flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center min-h-[190px]
                         bg-slate-50/60 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
            >
              {files.length > 0 ? (
                <div className="text-center w-full">
                  <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-1.5 animate-bounce" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{files.length} file đã chọn</p>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-h-24 overflow-y-auto space-y-1 text-left px-2 bg-white/70 dark:bg-slate-900/60 rounded-lg p-1.5 border border-slate-100 dark:border-slate-800">
                    {files.map((f, i) => (
                      <div key={i} className="truncate text-[11px]">• {f.name} ({formatFileSize(f.size)})</div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 hover:underline">Bấm để thay đổi file</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kéo thả file hoặc <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-300">chọn file</span></p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Hỗ trợ PDF, Word, Excel, PPT, Ảnh, Video, Audio, ZIP<br/>Tối đa 500 MB / file</p>
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mkv,.mp3,.wav,.zip,.rar"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </div>
          ) : (
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Đường dẫn Google Drive *</label>
              <input
                type="url"
                value={googleDriveLink}
                onChange={(e) => setGoogleDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="input-base text-xs sm:text-sm"
                required={mode === "link"}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">Mẹo: Bật quyền "Bất kỳ ai có đường liên kết đều có thể xem" để tự động quét dung lượng & thumbnail.</p>
            </div>
          )}

          {/* Progress / Submit button on desktop */}
          <div className="hidden lg:block">
            {uploading ? (
              <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <div className="flex justify-between text-xs text-blue-800 dark:text-blue-300 font-semibold">
                  <span>Đang tải lên…</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button type="button" onClick={cancelUpload} className="btn-danger text-xs w-full py-1.5 mt-1">
                  Hủy tải lên
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={(mode === "file" && files.length === 0) || (mode === "link" && !googleDriveLink) || !title || !categoryId}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 text-sm font-bold"
              >
                <Upload className="w-4 h-4" /> Bắt đầu tải lên
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Metadata Fields */}
        <div className="lg:col-span-7 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề tài liệu *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề rõ ràng, dễ tìm kiếm"
              className="input-base text-xs sm:text-sm h-10 rounded-xl"
              required
            />
          </div>

          {/* Category + Year Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Chuyên mục *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-base text-xs sm:text-sm h-9.5 rounded-xl"
                required
              >
                {["VIDEO", "AUDIO", "GRAPHICS", "DOCUMENTS"].map(grpId => {
                  const grpCats = categories.filter(c => c.group === grpId);
                  if (grpCats.length === 0) return null;
                  const grpName = grpId === "VIDEO" ? "Thư viện Video" : grpId === "AUDIO" ? "Âm thanh & Podcast" : grpId === "GRAPHICS" ? "Ấn phẩm & Hình ảnh" : "Tài liệu & Khai thác dữ liệu";
                  return (
                    <optgroup key={grpId} label={grpName}>
                      {grpCats.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
                {categories.filter(c => !c.group).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <Calendar className="inline w-3 h-3 mr-1 text-slate-400" />Năm phát hành
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="2000"
                max={new Date().getFullYear() + 1}
                className="input-base text-xs sm:text-sm h-9.5 rounded-xl"
              />
            </div>
          </div>

          {/* Description + AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mô tả tóm tắt</label>
              <button
                type="button"
                onClick={async () => {
                  if (mode === "file" && files.length === 0) return toast.error("Vui lòng chọn file trước khi dùng AI");
                  if (mode === "link") return toast.error("Tính năng AI hiện chỉ hỗ trợ khi tải file trực tiếp từ máy tính");
                  
                  setUploading(true);
                  const fd = new FormData();
                  fd.append("file", files[0]);

                  try {
                    const res = await fetch("/api/ai/describe", { method: "POST", body: fd });
                    const data = await res.json();
                    if (res.ok) {
                      setDescription(data.description);
                      toast.success("Tạo mô tả thành công!");
                    } else {
                      toast.error(data.error || "Không thể tạo mô tả");
                    }
                  } catch (e) {
                    toast.error("Lỗi kết nối tới AI");
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading || (mode === "file" && files.length === 0)}
                className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                Tạo bằng AI
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu nội dung tài liệu..."
              rows={2}
              className="input-base text-xs sm:text-sm resize-none rounded-xl"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Tag className="inline w-3 h-3 mr-1 text-slate-400" />Thẻ / Từ khóa (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vd: sốt xuất huyết, phòng dịch, 2025"
              className="input-base text-xs sm:text-sm h-9 rounded-xl mb-1.5"
            />
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto scrollbar-none py-0.5">
                {availableTags.map(t => {
                  const currentTags = tags.split(",").map(x => x.trim()).filter(Boolean);
                  const active = currentTags.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        if (active) {
                          setTags(currentTags.filter(x => x !== t).join(", "));
                        } else {
                          setTags([...currentTags, t].join(", "));
                        }
                      }}
                      className={`px-2 py-0.5 text-[10px] rounded-md border transition-all select-none ${active ? "bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs" : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mobile Submit Button (at bottom of form) */}
          <div className="pt-2 block lg:hidden">
              {uploading ? (
                <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <div className="flex justify-between text-xs text-blue-800 dark:text-blue-300 font-semibold">
                    <span>Đang tải lên…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <button type="button" onClick={cancelUpload} className="btn-danger text-xs w-full py-1.5 mt-1">
                    Hủy tải lên
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={(mode === "file" && files.length === 0) || (mode === "link" && !googleDriveLink) || !title || !categoryId}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 text-sm font-bold"
                >
                  <Upload className="w-4 h-4" /> Bắt đầu tải lên
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    );
  }
