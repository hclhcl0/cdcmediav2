// src/components/ChangePasswordCard.tsx
"use client";
import { useState } from "react";
import { KeyRound, Eye, EyeOff, Check, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

export default function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 6) { toast.error("Mật khẩu mới tối thiểu 6 ký tự"); return; }
    if (newPw !== confirmPw) { toast.error("Xác nhận mật khẩu không khớp"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Đổi mật khẩu thành công");
        setCurrentPw(""); setNewPw(""); setConfirmPw(""); setOpen(false);
      } else {
        toast.error(data.error ?? "Lỗi");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50">
            <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Đổi mật khẩu</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Cập nhật mật khẩu đăng nhập của bạn</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="input-base text-sm"
                style={{ paddingRight: "2.5rem" }}
                required
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="input-base text-sm"
                style={{ paddingRight: "2.5rem" }}
                required
              />
              <button type="button" onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength indicator */}
            {newPw.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    newPw.length >= i * 3
                      ? i <= 1 ? "bg-red-400" : i === 2 ? "bg-amber-400" : i === 3 ? "bg-blue-400" : "bg-emerald-500"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`} />
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="input-base text-sm"
              required
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">Mật khẩu không khớp</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (confirmPw.length > 0 && newPw !== confirmPw)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Check className="w-4 h-4" />
            }
            {loading ? "Đang lưu…" : "Cập nhật mật khẩu"}
          </button>
        </form>
      )}
    </div>
  );
}
