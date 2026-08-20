// src/app/admin/ManageUsers.tsx
"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, X, Check, Eye, EyeOff, ShieldCheck, Upload, UserCircle, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/utils/format";
import { clsx } from "clsx";
import ChangePasswordCard from "@/components/ChangePasswordCard";

interface User {
  id: string; username: string; displayName: string | null;
  role: string; isActive: boolean; createdAt: Date;
  _count: { files: number };
}

const ROLES = [
  { value: "ADMIN", label: "Admin", icon: ShieldCheck, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50" },
  { value: "UPLOADER", label: "Uploader", icon: Upload, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50" },
  { value: "VIEWER", label: "Viewer", icon: UserCircle, color: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" },
];

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Create form
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState("UPLOADER");

  // Reset password form
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleCreate() {
    if (!username || !password) { toast.error("Nhập đủ thông tin"); return; }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, password, role }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Đã tạo tài khoản");
      setShowForm(false); setUsername(""); setDisplayName(""); setPassword(""); setRole("UPLOADER");
      fetchUsers();
    } else {
      toast.error(data.error ?? "Lỗi");
    }
  }

  async function toggleActive(user: User) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (res.ok) { toast.success(user.isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt"); fetchUsers(); }
  }

  async function handleDelete(user: User) {
    if (user.username === "admin") { toast.error("Không thể xóa tài khoản admin gốc"); return; }
    if (!confirm(`Xóa tài khoản "${user.username}"?`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); fetchUsers(); }
    else { const d = await res.json(); toast.error(d.error ?? "Lỗi"); }
  }

  async function handleResetPassword(user: User) {
    if (!newPw) { toast.error("Nhập mật khẩu mới"); return; }
    if (newPw.length < 6) { toast.error("Tối thiểu 6 ký tự"); return; }
    setResetting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã đặt lại mật khẩu cho "${user.username}"`);
        setResetUserId(null); setNewPw(""); setShowNewPw(false);
      } else {
        toast.error(data.error ?? "Lỗi");
      }
    } finally {
      setResetting(false);
    }
  }

  function openReset(userId: string) {
    setResetUserId(userId); setNewPw(""); setShowNewPw(false);
  }

  const getRoleBadge = (role: string) => {
    const r = ROLES.find((x) => x.value === role);
    if (!r) return null;
    return <span className={clsx("text-xs px-2 py-0.5 rounded-full font-semibold", r.color)}>{r.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* 1. Phần Đổi mật khẩu cá nhân */}
      <ChangePasswordCard />

      {/* 2. Phần Quản lý tài khoản hệ thống */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Quản lý tài khoản hệ thống</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Danh sách người dùng, phân quyền và trạng thái hoạt động ({users.length} tài khoản)</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4 shadow-sm">
            <Plus className="w-4 h-4" /> Thêm tài khoản
          </button>
        </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/30 rounded-2xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Tạo tài khoản mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên đăng nhập *" className="input-base text-sm" />
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tên hiển thị" className="input-base text-sm" />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu * (tối thiểu 6 ký tự)"
                className="input-base text-sm"
                style={{ paddingRight: "2.5rem" }}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-base text-sm">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary text-sm py-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Tạo tài khoản
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Hủy
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">Đang tải…</div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 transition overflow-hidden">
              {/* User row */}
              <div className={clsx(
                "flex items-center gap-3 px-4 py-3 transition",
                user.isActive ? "bg-white/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700" : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60"
              )}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xs">{user.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.username}</p>
                    {user.displayName && <span className="text-xs text-slate-400 dark:text-slate-500">({user.displayName})</span>}
                    {getRoleBadge(user.role)}
                    {!user.isActive && <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Vô hiệu</span>}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {user._count.files} tài liệu · Tạo {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => resetUserId === user.id ? (setResetUserId(null), setNewPw("")) : openReset(user.id)}
                    className={clsx(
                      "p-1.5 rounded-lg transition",
                      resetUserId === user.id
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                        : "hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                    )}
                    title="Đặt lại mật khẩu"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  {user.username !== "admin" && (
                    <>
                      <button onClick={() => toggleActive(user)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
                        title={user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                      >
                        {user.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(user)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline reset password panel */}
              {resetUserId === user.id && (
                <div className="border-t border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 px-4 py-3 flex flex-wrap items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 shrink-0">Đặt lại mật khẩu:</span>
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                      className="input-base text-sm w-full"
                      style={{ paddingRight: "2.5rem" }}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword(user)}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleResetPassword(user)}
                    disabled={resetting}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    {resetting
                      ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Check className="w-3.5 h-3.5" />
                    }
                    Lưu
                  </button>
                  <button
                    onClick={() => { setResetUserId(null); setNewPw(""); }}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
