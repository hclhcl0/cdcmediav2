// src/components/SidebarAds.tsx
// Sidebar dọc chạy trượt 2 bên màn hình (Căn lề sát nội dung chính)
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type Ad = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position?: string;
};

export default function SidebarAds() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch("/api/sidebar-ads")
      .then((r) => r.json())
      .then(setAds)
      .catch(() => {});
  }, []);

  if (!ads.length) return null;

  // Phân loại quảng cáo trái phải theo vị trí (mặc định nếu null thì xem như LEFT)
  const leftAds = ads.filter(a => a.position === "LEFT");
  const rightAds = ads.filter(a => a.position === "RIGHT");

  const renderAdCard = (ad: Ad) => (
    <div key={ad.id} className="relative group rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 transition-colors duration-300">
      {ad.linkUrl ? (
        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" title={ad.title} className="block w-full h-full">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            width={224}
            height={398}
            className="w-full h-auto aspect-[9/16] object-cover hover:scale-105 transition-transform duration-300 rounded-xl"
          />
        </a>
      ) : (
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          width={224}
          height={398}
          className="w-full h-auto aspect-[9/16] object-cover rounded-xl"
        />
      )}
    </div>
  );

  return (
    <>
      {/* Popup dọc bên TRÁI */}
      {leftAds.length > 0 && (
        <aside
          className="hidden min-[1650px]:flex flex-col gap-3 fixed top-24 w-44 2xl:w-56 z-40 animate-fade-in"
          style={{ left: "max(12px, calc(50% - 640px - 224px - 24px))" }}
        >
          <div className="flex flex-col gap-3">
            {leftAds.map(renderAdCard)}
          </div>
        </aside>
      )}

      {/* Popup dọc bên PHẢI */}
      {rightAds.length > 0 && (
        <aside
          className="hidden min-[1650px]:flex flex-col gap-3 fixed top-24 w-44 2xl:w-56 z-40 animate-fade-in"
          style={{ right: "max(12px, calc(50% - 640px - 224px - 24px))" }}
        >
          <div className="flex flex-col gap-3">
            {rightAds.map(renderAdCard)}
          </div>
        </aside>
      )}
    </>
  );
}