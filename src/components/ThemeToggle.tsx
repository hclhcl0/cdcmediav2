"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    }
    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Quick toggle button */}
      <button
        type="button"
        onClick={toggleTheme}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpenMenu(!openMenu);
        }}
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all duration-200 shadow-sm border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer overflow-hidden group"
        aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
        title={isDark ? "Giao diện tối (Nhấp để đổi sang sáng, nhấp chuột phải để chọn hệ thống)" : "Giao diện sáng (Nhấp để đổi sang tối, nhấp chuột phải để chọn hệ thống)"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="dark"
              initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center text-amber-300"
            >
              <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-amber-300/20" />
            </motion.div>
          ) : (
            <motion.div
              key="light"
              initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center text-amber-200"
            >
              <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown for explicit selection if opened */}
      <AnimatePresence>
        {openMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/50 z-50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => { setTheme("light"); setOpenMenu(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${
                theme === "light"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" /> Sáng
            </button>
            <button
              type="button"
              onClick={() => { setTheme("dark"); setOpenMenu(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${
                theme === "dark"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Tối
            </button>
            <button
              type="button"
              onClick={() => { setTheme("system"); setOpenMenu(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${
                theme === "system"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-slate-400" /> Hệ thống
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
