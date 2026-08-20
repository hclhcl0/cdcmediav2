// src/components/BannerStrip.tsx
// Banner ngang — hiện dưới Navbar hoặc giữa trang
// Hỗ trợ nhiều banner theo vị trí: TOP | MIDDLE | BOTTOM
"use client";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
};

interface Props {
  position: "TOP" | "MIDDLE" | "BOTTOM";
  className?: string;
  isSticky?: boolean;
}

export default function BannerStrip({ position, className = "", isSticky = false }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [dismissed] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((all: Banner[]) => {
        const filtered = all.filter((b) => b.position === position);
        setBanners(filtered);
      })
      .catch(() => {});
  }, [position]);

  const activeBanners = banners.filter((b) => !failedIds.has(b.id));

  // Auto-slide mỗi 5 giây nếu có nhiều banner
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % activeBanners.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeBanners.length]);

  if (!activeBanners.length || dismissed) return null;

  const banner = activeBanners[current % activeBanners.length];

  const inner = (
    <div className="relative w-full overflow-hidden group rounded-b-2xl border-b border-x border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div 
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" 
        style={{ transform: `translateX(-${(current % activeBanners.length) * 100}%)` }}
      >
        {activeBanners.map((b) => (
          <div key={b.id} className="w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.imageUrl}
              alt={b.title}
              className="w-full h-auto bg-white dark:bg-slate-900 aspect-[4/1] object-cover block"
              onError={() => setFailedIds((prev) => new Set(prev).add(b.id))}
            />
          </div>
        ))}
      </div>

      {/* Nút prev/next nếu nhiều banner */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c - 1 + activeBanners.length) % activeBanners.length); }}
            aria-label="Quảng cáo trước"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c + 1) % activeBanners.length); }}
            aria-label="Quảng cáo tiếp theo"
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                aria-label={`Quảng cáo ${i + 1}`}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );

  const content = (
    <div className={`w-full ${className}`}>
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
          {inner}
        </a>
      ) : inner}
    </div>
  );

  if (isSticky) {
    return (
      <div className="w-full relative sm:sticky top-0 sm:top-16 z-40 bg-[#f8fafc] dark:bg-[#0b1120] border-b border-slate-200/50 dark:border-slate-800/80 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2 sm:pb-3 pt-0 w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
