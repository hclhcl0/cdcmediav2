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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Chỉnh sửa tài liệu</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">File đính kèm</label>
              <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
                <button type="button" onClick={() => setMode("keep")} className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${mode === "keep" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60"}`}>Giữ nguyên gốc</button>
                <button type="button" onClick={() => setMode("file")} className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${mode === "file" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60"}`}>Tải file mới lên</button>
                <button type="button" onClick={() => setMode("link")} className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${mode === "link" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60"}`}>Dán Link GG Drive</button>
              </div>

              {mode === "keep" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4" /> Đang dùng file hiện tại: {file.filename}
                </div>
              )}

              {mode === "file" && (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative cursor-pointer group bg-white dark:bg-slate-900">
                  <input type="file" onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    {newFile ? <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{newFile.name}</p> : <><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kéo thả hoặc bấm để chọn file thay thế</p><p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tối đa 500 MB</p></>}
                  </div>
                </div>
              )}

              {mode === "link" && (
                <div className="space-y-2">
                  <input type="url" value={googleDriveLink} onChange={(e) => setGoogleDriveLink(e.target.value)} placeholder="Dán link chia sẻ từ Google Drive vào đây..." className="input-base" required />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mẹo: Đảm bảo link đã được bật quyền "Bất kỳ ai có đường liên kết đều có thể xem". Hệ thống sẽ tự động quét số MB và loại file thay bạn.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Tiêu đề *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Năm</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="input-base" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Chuyên mục *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-base" required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mô tả</label>
                <button
                  type="button"
                  onClick={async () => {
                    if (mode === "link") return toast.error("Tính năng AI hiện chưa hỗ trợ Link Google Drive");
                    
                    setSaving(true);
                    const fd = new FormData();
                    if (mode === "file" && newFile) {
                      fd.append("file", newFile);
                    } else if (mode === "keep") {
                      fd.append("fileId", file.id);
                    } else {
                      setSaving(false);
                      return toast.error("Không có file để phân tích");
                    }
                    
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
                      setSaving(false);
                    }
                  }}
                  disabled={saving || (mode === "file" && !newFile)}
                  className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1.5 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3" />
                  Tạo bằng AI
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base h-20 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Thẻ (Cách nhau bởi dấu phẩy)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-base" placeholder="vd: Kế hoạch, 2026, Covid" />
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
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
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 cursor-pointer" htmlFor="edit-isPublic">
                  <span>Trạng thái chia sẻ công khai</span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 rounded-b-2xl">
          {saving ? (
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium"><span>Đang lưu…</span><span>{progress}%</span></div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              <button type="button" onClick={cancelUpload} className="btn-danger text-xs w-full py-1.5 mt-2">Hủy</button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Hủy</button>
              <button type="submit" form="edit-form" className="btn-primary py-2.5">Lưu thay đổi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
