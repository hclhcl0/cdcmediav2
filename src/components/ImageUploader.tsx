// src/components/ImageUploader.tsx
// Upload ảnh trực tiếp từ máy tính — dùng cho banner/sidebar/popup
"use client";
import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface Props {
  onUploaded: (url: string) => void;
  currentUrl?: string;
  maxSizeMB?: number;
}

export default function ImageUploader({ onUploaded, currentUrl, maxSizeMB = 10 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl ?? "");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ảnh tối đa ${maxSizeMB}MB`);
      return;
    }

    // Preview ngay trước khi upload
    const local = URL.createObjectURL(file);
    setPreview(local);
    setUploading(true);
    setProgress(10);

    const fd = new FormData();
    fd.append("file", file);

    // Dùng XHR để có progress
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
    };
    xhr.onload = () => {
      setUploading(false);
      setProgress(100);
      if (xhr.status === 201) {
        const data = JSON.parse(xhr.responseText);
        setPreview(data.url);
        onUploaded(data.url);
        URL.revokeObjectURL(local);
      } else {
        const data = JSON.parse(xhr.responseText);
        setError(data.error ?? "Lỗi upload");
        setPreview(currentUrl ?? "");
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError("Lỗi kết nối");
      setPreview(currentUrl ?? "");
    };
    xhr.open("POST", "/api/upload-image");
    xhr.send(fd);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clear() {
    setPreview("");
    setError("");
    setProgress(0);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl
                   flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                   bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 overflow-hidden"
        style={{ minHeight: preview ? undefined : "80px" }}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="preview"
              className="w-full object-cover max-h-40 rounded-lg"
              onError={() => setPreview("")}
            />
            {/* Overlay khi uploading */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <div className="w-32 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {/* Nút xóa */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clear(); }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Click để đổi ảnh */}
            {!uploading && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-2 text-center">
                <p className="text-white text-xs font-medium">Click để đổi ảnh</p>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 flex flex-col items-center gap-1.5 text-slate-400 dark:text-slate-500">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            ) : (
              <ImageIcon className="w-7 h-7" />
            )}
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Kéo thả hoặc <span className="text-blue-600 dark:text-blue-400">chọn ảnh</span>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">JPG, PNG, GIF, WebP · Tối đa {maxSizeMB}MB</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Progress khi không có preview */}
      {uploading && !preview && (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
          <Upload className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
