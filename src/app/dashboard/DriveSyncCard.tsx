"use client";
import { useState } from "react";
import { FolderSync, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onSynced: () => void;
  isAdmin: boolean;
}

export default function DriveSyncCard({ onSynced, isAdmin }: Props) {
  const [folderId, setFolderId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isAlbum, setIsAlbum] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ synced: number, total: number } | null>(null);

  if (!isAdmin) return null;

  async function handleSync(e: React.FormEvent) {
    e.preventDefault();
    if (!folderId.trim()) return toast.error("Vui lòng nhập ID thư mục");

    setSyncing(true);
    setResult(null);

    try {
      const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/sync-gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folderId.trim(), isAlbum, tags })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Đồng bộ thành công ${data.synced} file!`);
        setResult({ synced: data.synced, total: data.totalScanned });
        setFolderId("");
        setTagsInput("");
        onSynced();
      } else {
        toast.error(data.error || "Lỗi đồng bộ");
      }
    } catch (err) {
      toast.error("Lỗi kết nối");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="card p-5 sm:p-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <FolderSync className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg">Đồng bộ Google Drive</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Quét thư mục Google Drive để tải tự động hàng loạt tài liệu</p>
        </div>
      </div>

      {/* 2-Column Responsive Body */}
      <form onSubmit={handleSync} className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 items-start">
        {/* Left: Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ID Thư mục Google Drive *</label>
            <input
              type="text"
              className="input-base text-xs sm:text-sm h-9.5 rounded-xl"
              placeholder="VD: 1Mh7t7Nk506ghcDeXcRT3..."
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              disabled={syncing}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Thẻ / Hashtag mặc định</label>
            <input
              type="text"
              className="input-base text-xs sm:text-sm h-9.5 rounded-xl"
              placeholder="VD: Khoa Bệnh truyền nhiễm, 2025"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={syncing}
            />
          </div>

          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
            <input 
              type="checkbox" 
              checked={isAlbum}
              onChange={(e) => setIsAlbum(e.target.checked)}
              disabled={syncing}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Gộp tất cả file thành 1 Album (Slideshow)</span>
          </label>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between h-full space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Hệ thống sẽ tự động quét toàn bộ file trong thư mục, bỏ qua các file trùng lặp và tự động phân loại chuyên mục dựa theo định dạng file.
          </p>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={syncing || !folderId.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl py-2.5 font-bold transition disabled:opacity-50 text-xs sm:text-sm shadow-md shadow-indigo-500/20"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang quét và đồng bộ...
                </>
              ) : (
                <>
                  <FolderSync className="w-4 h-4" /> Bắt đầu đồng bộ
                </>
              )}
            </button>

            {result && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold">Đồng bộ hoàn tất!</p>
                    <p className="text-[11px] mt-0.5 text-emerald-600 dark:text-emerald-400">Quét được {result.total} file. Đã tải lên mới {result.synced} file.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
