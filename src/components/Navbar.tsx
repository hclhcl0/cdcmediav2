// src/components/Navbar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck, Home } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import ThemeToggle from "@/components/ThemeToggle";
import type { SessionPayload } from "@/lib/auth";

interface NavbarProps {
  session: SessionPayload | null;
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Đã đăng xuất");
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Trang chủ", icon: Home },
    ...(session?.role === "ADMIN" || session?.role === "UPLOADER"
      ? [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
      : []),
    ...(session?.role === "ADMIN"
      ? [{ href: "/admin", label: "Quản trị", icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Main navbar */}
      <nav
        className="bg-[#1D78B8] dark:bg-[#0f2744] border-b border-[#0d5485]/30 dark:border-blue-900/50 shadow-md backdrop-blur-md transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Logo & Header Title */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 group-hover:shadow-md transition-all duration-200 group-hover:scale-105 overflow-hidden shrink-0">
              <Image src="/api/uploads/logo.png" alt="CDC Đà Nẵng Logo" width={44} height={44} className="w-full h-full object-contain scale-110" />
              <span className="hidden font-extrabold text-blue-600 text-[10px]">CDC</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-100 dark:text-blue-200 uppercase tracking-wide opacity-95 leading-tight">
                Trung tâm Kiểm soát Bệnh tật TP. Đà Nẵng
              </span>
              <div className="flex items-center gap-1.5 leading-none mt-0.5">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  CDC<span className="text-orange-400">Media</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium text-blue-200 dark:text-blue-300 tracking-wider uppercase opacity-85 border-l border-white/25 pl-1.5 hidden sm:inline-block">
                  Ngân hàng Tài liệu
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? "bg-white/20 dark:bg-white/15 text-white shadow-sm"
                      : "text-blue-100 hover:text-white hover:bg-white/10 dark:hover:bg-white/5"}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {session ? (
              <>
                <div className="flex flex-col items-end leading-none">
                  <span className="text-sm font-semibold text-white">
                    {session.displayName ?? session.username}
                  </span>
                  <span className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full bg-blue-700/50 dark:bg-blue-900/60 text-blue-100 font-bold tracking-wide uppercase border border-blue-600 dark:border-blue-700">
                    {session.role === "ADMIN" ? "Admin" : session.role === "UPLOADER" ? "Uploader" : "Viewer"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-red-100 bg-red-500/20 border border-red-500/30 hover:bg-red-500/80 hover:text-white transition-all shadow-xs active:scale-95 shrink-0"
                  title="Đăng xuất khỏi hệ thống"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-[#1D78B8] hover:bg-blue-50 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 transition-colors shadow-sm">Đăng nhập</Link>
            )}
          </div>

          {/* Mobile Right */}
          <div className="md:hidden flex items-center gap-1.5">
            <ThemeToggle />
            <button
              className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu — smooth slide down */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d5485] dark:bg-[#071629] border-t border-blue-800 dark:border-blue-950 shadow-xl overflow-hidden">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors
                    ${isActive
                      ? "bg-white/20 dark:bg-white/15 text-white shadow-sm"
                      : "text-blue-100 hover:text-white hover:bg-white/10 dark:hover:bg-white/5"}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              );
            })}

            <div className="mt-4 pt-4 border-t border-blue-800 dark:border-blue-900 space-y-4">
              {session ? (
                <>
                  <div className="px-4 flex flex-col">
                    <span className="text-base font-semibold text-white">
                      {session.displayName ?? session.username}
                    </span>
                    <span className="text-xs text-blue-200 uppercase tracking-wider font-medium mt-0.5">
                      {session.role}
                    </span>
                  </div>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-100 bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 hover:text-white font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 rounded-xl font-semibold bg-white text-[#1D78B8] hover:bg-blue-50 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
