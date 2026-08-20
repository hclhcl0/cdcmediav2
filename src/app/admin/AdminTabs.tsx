// src/app/admin/AdminTabs.tsx
"use client";
import { useState } from "react";
import { FolderOpen, Users, CloudCog, ClipboardList, Megaphone, BarChart3, Layers } from "lucide-react";
import ManageGroups from "./ManageGroups";
import ManageCategories from "./ManageCategories";
import ManageUsers from "./ManageUsers";
import DriveSettings from "./DriveSettings";
import ActivityLogs from "./ActivityLogs";
import ManageAds from "./ManageAds";
import Analytics from "./Analytics";
import { clsx } from "clsx";

const TABS = [
  { id: "analytics", label: "Thống kê", icon: BarChart3 },
  { id: "groups", label: "Phân hệ", icon: Layers },
  { id: "categories", label: "Chuyên mục", icon: FolderOpen },
  { id: "users", label: "Tài khoản", icon: Users },
  { id: "ads", label: "Truyền thông", icon: Megaphone },
  { id: "drive", label: "Cài đặt chung", icon: CloudCog },
  { id: "logs", label: "Nhật ký", icon: ClipboardList },
];

export default function AdminTabs() {
  const [active, setActive] = useState("analytics");

  return (
    <div className="card space-y-5 p-3 sm:p-6">
      {/* Tab bar — scroll ngang trên mobile */}
      <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none -mx-1 px-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={clsx(
              "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0",
              active === id
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100"
            )}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div>
        {active === "analytics" && <Analytics />}
        {active === "groups" && <ManageGroups />}
        {active === "categories" && <ManageCategories />}
        {active === "users" && <ManageUsers />}
        {active === "ads" && <ManageAds />}
        {active === "drive" && <DriveSettings />}
        {active === "logs" && <ActivityLogs />}
      </div>
    </div>
  );
}
