// src/components/Footer.tsx
"use client";
import Link from "next/link";
import { MapPin, Phone, Globe, Heart } from "lucide-react";
import VisitorCounter from "./VisitorCounter";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-8 bg-[#1D78B8] dark:bg-[#07192f] border-t border-[#0d5485]/40 dark:border-blue-950/60 text-blue-100 dark:text-blue-200 transition-colors duration-300">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand column */}
          <div className="sm:col-span-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <img src="/api/uploads/logo.png" alt="CDC Đà Nẵng Logo" className="w-full h-full object-contain scale-110" onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (target.src.includes('/api/uploads/logo.png')) { target.src = '/logo.png'; } else { target.style.display = 'none'; target.nextElementSibling?.classList.remove('hidden'); } }} />
                <span className="hidden font-extrabold text-blue-600 text-[10px]">CDC</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-white text-base tracking-tight">
                  CDC<span className="text-orange-400">Media</span>
                </span>
                <span className="text-[9px] font-medium text-blue-200 dark:text-blue-300 tracking-widest uppercase">Ngân hàng Tài liệu</span>
              </div>
            </div>
            <p className="text-xs text-blue-100 dark:text-blue-200 leading-relaxed max-w-[200px]">
              Hệ thống quản lý và chia sẻ tài liệu truyền thông sức khỏe cộng đồng.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-widest">Truy cập nhanh</p>
            <nav className="flex flex-col gap-2">
              {[
                { href: "/", label: "Trang chủ" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/admin", label: "Quản trị" },
                { href: "/login", label: "Đăng nhập" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs text-blue-200 dark:text-blue-300 hover:text-white transition-colors flex items-center gap-1.5 group"
                >
                  <span className="w-1 h-1 rounded-full bg-blue-400 group-hover:bg-orange-400 transition-colors" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-widest">Liên hệ</p>
            <div className="flex flex-col gap-2 text-xs text-blue-200 dark:text-blue-300">
              <div className="font-semibold text-white mb-1">
                Trung tâm Kiểm soát Bệnh tật Thành phố Đà Nẵng
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-300 dark:text-blue-400 shrink-0" />
                <span>118 Lê Đình Lý, Phường Thanh Khê, Thành phố Đà Nẵng</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-300 dark:text-blue-400 shrink-0" />
                <span>0236 3890 407</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-300 dark:text-blue-400 shrink-0" />
                <a href="mailto:kiemsoatbenhtat@danang.gov.vn" className="hover:text-white transition-colors">
                  kiemsoatbenhtat@danang.gov.vn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 mt-8 border-t border-[#0d5485]/40 dark:border-blue-900/50 text-[11px] font-medium text-blue-300 dark:text-blue-400">
          <p>
            © {year} <span className="font-bold text-white">CDC Đà Nẵng</span>. Bản quyền thuộc về Trung tâm Kiểm soát Bệnh tật Đà Nẵng.
          </p>
          <VisitorCounter />
        </div>
      </div>
    </footer>
  );
}
