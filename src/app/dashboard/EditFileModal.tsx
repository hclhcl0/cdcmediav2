"use client";
import { useState, useRef, useEffect } from "react";
import { X, Upload, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface Category { id: string; name: string; color: string | null; }

interface EditFileModalProps {
  file: any;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditFileModal({ file, categories, onClose, onSuccess }: EditFileModalProps) {
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description || "");
  const [categoryId, setCategoryId] = useState(file.categoryId);
  const [year, setYear] = useState(file.year ? file.year.toString() : new Date().getFullYear().toString());
  const [tags, setTags] = useState(file.tags.map((t: any) => t.tag.name).join(", "));
  const [isPublic, setIsPublic] = useState(file.isPublic ?? true);
  const [mode, setMode] = useState<"keep" | "file" | "link">("keep");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then(r => r.json())
      .then(d => {
        if (d.tags) setAvailableTags(d.tags.map((t: any) => t.name));
      })
      .catch(() => {});
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !categoryId) return toast.error("Vui lòng nhập tiêu đề và chuyên mục");
    if (mode === "file" && !newFile) return toast.error("Vui lòng chọn file mới");
    if (mode === "link" && !googleDriveLink) return toast.error("Vui lòng nhập link Google Drive");

    setSaving(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("categoryId", categoryId);
    fd.append("year", year);
    fd.append("tags", tags);
    fd.append("isPublic", isPublic ? "true" : "false");

    if (mode === "file" && newFile) fd.append("file", newFile);
    if (mode === "link" && googleDriveLink) fd.append("googleDriveLink", googleDriveLink);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded * 100) / ev.total));
    };

    xhr.onload = () => {
      setSaving(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success("Đã lưu thay đổi");
        onSuccess();
      } else {
        const data = JSON.parse(xhr.responseText);
        toast.error(data.error ?? "Lỗi lưu file");
      }
    };

    xhr.onerror = () => { setSaving(false); toast.error("Lỗi kết nối"); };
    xhr.open("PUT", `/api/files/${file.id}`);
    xhr.send(fd);
  }

  function cancelUpload() {
    xhrRef.current?.abort();
    setSaving(false);
    setProgress(0);
    toast("Đã hủy", { icon: "🚫" });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">Chỉnh sửa tài liệu</h2>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">File đính kèm</label>
              <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 p-1 sm:p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
                <button type="button" onClick={() => setMode("keep")} className={`flex-1 min-w-[90px] py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${mode === "keep" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60"}`}>Giữ nguyên gốc</button>
                <button type="button" onClick={() => setMode("file")} className={`flex-1 min-w-[90px] py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${mode === "file" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60"}`}>Tải file mới lên</button>
                <button type="button" onClick={() => setMode("link")} className={`flex-1 min-w-[90px] py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${mode === "link" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60"}`}>Link GG Drive</button>
              </div>

              {mode === "keep" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs sm:text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 shrink-0" /> <span className="truncate">Đang dùng file hiện tại: {file.filename}</span>
                </div>
              )}

              {mode === "file" && (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative cursor-pointer group bg-white dark:bg-slate-900">
                  <input type="file" onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{newFile ? newFile.name : "Nhấp để chọn file mới"}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hỗ trợ tất cả định dạng (tối đa 500MB)</p>
                </div>
              )}

              {mode === "link" && (
                <div>
                  <input
                    type="url"
                    value={googleDriveLink}
                    onChange={(e) => setGoogleDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="input-base text-xs sm:text-sm"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dán link Google Drive chia sẻ ở chế độ công khai.</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Tiêu đề tài liệu *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base text-xs sm:text-sm h-10"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Chuyên mục *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-base text-xs sm:text-sm h-10"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Năm phát hành</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  className="input-base text-xs sm:text-sm h-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mô tả tài liệu</label>
                <button
                  type="button"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const res = await fetch("/api/ai/describe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileId: file.id }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setDescription(data.description);
                        toast.success("Đã tạo mô tả bằng AI!");
                      } else {
                        toast.error(data.error || "Không thể tạo mô tả");
                      }
                    } catch {
                      toast.error("Lỗi kết nối tới AI");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800/60"
                >
                  <Sparkles className="w-3 h-3" /> Tạo lại bằng AI
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-base text-xs sm:text-sm"
                placeholder="Nhập mô tả tóm tắt nội dung..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Thẻ (Tags)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="VD: truyền thông, y tế, 2025"
                className="input-base text-xs sm:text-sm h-10 mb-2"
              />
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  {availableTags.map(t => {
                    const currentTags = tags.split(",").map((x: string) => x.trim()).filter(Boolean);
                    const active = currentTags.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => {
                          if (active) {
                            setTags(currentTags.filter((x: string) => x !== t).join(", "));
                          } else {
                            setTags([...currentTags, t].join(", "));
                          }
                        }}
                        className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-lg border transition-colors ${active ? "bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quyền chia sẻ (Công khai / Chưa cấp quyền) */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 cursor-pointer" htmlFor="edit-isPublic">
                  <span>Trạng thái chia sẻ công khai</span>
                </label>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPublic ? "Tài liệu được chia sẻ công khai cho mọi người xem và tải." : "Tài liệu chưa được cấp quyền (hiển thị biểu tượng Ổ khóa bảo mật)."}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="edit-isPublic"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </form>
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 rounded-b-2xl">
          {saving ? (
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium"><span>Đang lưu…</span><span>{progress}%</span></div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              <button type="button" onClick={cancelUpload} className="btn-danger text-xs w-full py-1.5 mt-2">Hủy</button>
            </div>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-center text-xs sm:text-sm">Hủy</button>
              <button type="submit" form="edit-form" className="btn-primary w-full sm:w-auto py-2.5 text-xs sm:text-sm">Lưu thay đổi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
