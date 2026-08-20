"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { FileIcon } from "@/utils/fileIcon";

interface MediaItem {
  id: string;
  title?: string;
  filename: string;
  filepath: string;
  fileType: string;
  driveFileId?: string | null;
  driveWebLink?: string | null;
  thumbnailUrl?: string | null;
}

export default function AlbumViewer({ items }: { items: MediaItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];

  const proxyUrl = `/api/download/${currentItem.id}?preview=true`;
  const isDrive = currentItem.filepath?.startsWith("gdrive://") || (currentItem.filepath === "external" && !!currentItem.driveWebLink);
  const isImage = currentItem.fileType.startsWith("image/");
  const isVideo = currentItem.fileType.startsWith("video/");
  const isAudio = currentItem.fileType.startsWith("audio/");
  const isPdf = currentItem.fileType === "application/pdf";
  const isOffice =
    currentItem.fileType.includes("word") ||
    currentItem.fileType.includes("sheet") ||
    currentItem.fileType.includes("presentation") ||
    currentItem.fileType.includes("excel") ||
    currentItem.fileType.includes("powerpoint");

  const driveFileId = currentItem.driveFileId ?? currentItem.driveWebLink?.match(/\/file\/d\/([^/]+)/)?.[1] ?? null;
  const driveEmbedUrl = driveFileId ? `https://drive.google.com/file/d/${driveFileId}/preview` : null;

  const handlePrev = () => setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));

  const renderPreview = () => {
    if (isDrive && driveEmbedUrl && (isOffice || currentItem.filepath === "external")) {
      return (
        <iframe
          src={driveEmbedUrl}
          className="w-full h-full border-0 absolute inset-0 bg-white"
          title={currentItem.title || currentItem.filename}
          allow="autoplay"
        />
      );
    }
    if (isImage) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={proxyUrl} alt={currentItem.title || currentItem.filename} className="w-full h-full object-contain bg-slate-900/5 dark:bg-black/40 absolute inset-0" />;
    }
    if (isVideo) {
      return <video src={proxyUrl} controls controlsList="nodownload" playsInline className="w-full h-full bg-black object-contain absolute inset-0" />;
    }
    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 h-full bg-slate-50 dark:bg-slate-950 absolute inset-0">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center shadow-inner">
            <FileIcon mimeType={currentItem.fileType} filename={currentItem.filename} className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <audio src={proxyUrl} controls className="w-full max-w-md mt-6" />
        </div>
      );
    }
    if (isPdf) {
      return <iframe src={proxyUrl} className="w-full h-full border-0 absolute inset-0 bg-white" title={currentItem.title || currentItem.filename} />;
    }
    if (isOffice) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 h-full absolute inset-0">
          <AlertCircle className="w-16 h-16 text-amber-500/50" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">File Office lưu trên máy chủ</p>
          <p className="text-sm">Tải xuống để mở bằng Microsoft Office</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 h-full absolute inset-0">
        <FileText className="w-16 h-16" />
        <p className="text-base">Không hỗ trợ xem trước định dạng này</p>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col relative min-h-[400px]">
      {/* Main Preview Area */}
      <div className="flex-1 relative bg-slate-100/50 dark:bg-slate-950/60 min-h-[350px]">
        {renderPreview()}

        {/* Navigation Arrows if > 1 item */}
        {items.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all z-10"
              aria-label="Tệp trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all z-10"
              aria-label="Tệp tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-md z-10">
              {currentIndex + 1} / {items.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Tray */}
      {items.length > 1 && (
        <div className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 overflow-x-auto">
          {items.map((item, idx) => {
            const isThumbImage = item.fileType.startsWith("image/");
            const thumbUrl = item.thumbnailUrl || (isThumbImage ? `/api/download/${item.id}?preview=true` : null);
            const active = idx === currentIndex;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${active ? "border-blue-500 scale-105 shadow-md" : "border-slate-200 dark:border-slate-750 opacity-60 hover:opacity-100"}`}
              >
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <FileIcon mimeType={item.fileType} filename={item.filename} className="w-8 h-8" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
