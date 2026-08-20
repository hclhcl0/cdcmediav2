// src/app/admin/ActivityLogs.tsx
"use client";
import { useState, useEffect } from "react";
import { RefreshCw, Upload, Trash2, LogIn, LogOut, Settings, Download, FolderPlus, FolderMinus, UserPlus, UserMinus, Pencil } from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { clsx } from "clsx";

interface Log {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { username: string; displayName: string | null } | null;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  UPLOAD:          { label: "Tải lên",         color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300", icon: Upload },
  DELETE:          { label: "Xóa",             color: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300",         icon: Trash2 },
  UPDATE:          { label: "Cập nhật",        color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",     icon: Pencil },
  LOGIN:           { label: "Đăng nhập",       color: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",       icon: LogIn },
  LOGOUT:          { label: "Đăng xuất",       color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",     icon: LogOut },
  DOWNLOAD:        { label: "Tải xuống",       color: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300",   icon: Download },
  UPDATE_SETTINGS: { label: "Cài đặt",         color: "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300",         icon: Settings },
  CREATE_CATEGORY: { label: "Tạo chuyên mục",  color: "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300",      icon: FolderPlus },
  DELETE_CATEGORY: { label: "Xóa chuyên mục",  color: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300",        icon: FolderMinus },
  CREATE_USER:     { label: "Tạo tài khoản",   color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300", icon: UserPlus },
  DELETE_USER:     { label: "Xóa tài khoản",   color: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300",         icon: UserMinus },
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function fetchLogs() {
    setLoading(true);
    const res = await fetch("/api/admin/logs?limit=200");
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchLogs(); }, []);

  const filtered = filter ? logs.filter((l) => l.action === filter) : logs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-slate-700 dark:text-slate-200">Nhật ký hoạt động</h3>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-base text-sm w-auto">
            <option value="">Tất cả hành động</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={fetchLogs} className="btn-secondary text-sm flex items-center gap-1 py-2">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">Đang tải…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">Không có nhật ký</div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((log) => {
            const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300", icon: Settings };
            const Icon = cfg.icon;
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <div className={clsx("p-1.5 rounded-lg shrink-0", cfg.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
                    {log.user && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {log.user.displayName ?? log.user.username}
                      </span>
                    )}
                  </div>
                  {log.details && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{log.details}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(log.createdAt)}</p>
                  {log.ipAddress && <p className="text-[10px] text-slate-400 dark:text-slate-600">{log.ipAddress}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
