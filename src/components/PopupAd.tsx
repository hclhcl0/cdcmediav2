// src/components/PopupAd.tsx
// Popup tuyên truyền — hiện sau N giây, đóng được, nhớ qua sessionStorage nếu showOnce=true
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import Image from "next/image";

type PopupData = {
  id: string;
  title: string;
  imageUrl: string | null;
  content: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  showOnce: boolean;
  delayMs: number;
};

const MotionDiv = motion.div as any;

export default function PopupAd() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/popups")
      .then((r) => r.json())
      .then((data: PopupData | null) => {
        if (!data) return;
        // Nếu showOnce=true, kiểm tra sessionStorage
        if (data.showOnce) {
          const key = `popup_seen_${data.id}`;
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, "1");
        }
        setPopup(data);
        // Delay trước khi hiện
        const t = setTimeout(() => setVisible(true), data.delayMs);
        return () => clearTimeout(t);
      })
      .catch(() => {});
  }, []);

  const close = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && popup && (
        <MotionDiv
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <MotionDiv
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Panel */}
          <MotionDiv
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
          >
            {/* Nút đóng */}
            <button
              onClick={close}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ảnh */}
            {popup.imageUrl && (
              <Image
                src={popup.imageUrl}
                alt={popup.title}
                width={448}
                height={252}
                className="w-full h-auto aspect-[16/9] object-cover max-h-72"
              />
            )}

            {/* Nội dung */}
            {(popup.title || popup.content || popup.linkUrl) && (
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{popup.title}</h3>
                {popup.content && (
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{popup.content}</p>
                )}
                <div className="flex items-center gap-3 pt-1">
                  {popup.linkUrl && (
                    <a
                      href={popup.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center gap-1.5 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {popup.linkLabel ?? "Xem thêm"}
                    </a>
                  )}
                  <button onClick={close} className="btn-secondary text-sm">
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
