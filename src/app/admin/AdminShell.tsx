// src/app/admin/AdminShell.tsx
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

type TabId = "analytics" | "groups" | "categories" | "users" | "ads" | "drive" | "logs";

const NAV_GROUPS = [
  {
    label: "Quản lý",
    items: [
      { id: "analytics"  as TabId, label: "Thống kê",    icon: BarChart3 },
      { id: "groups"     as TabId, label: "Phân hệ",     icon: Layers },
      { id: "categories" as TabId, label: "Chuyên mục",  icon: FolderOpen },
      { id: "users"      as TabId, label: "Tài khoản",   icon: Users },
      { id: "ads"        as TabId, label: "Truyền thông",icon: Megaphone },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { id: "drive" as TabId, label: "Cài đặt", icon: CloudCog },
      { id: "logs"  as TabId, label: "Nhật ký",  icon: ClipboardList },
    ],
  },
];

function NavItem({
  label, icon: Icon, active, onClick,
}: { label: string; icon: React.ElementType; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all text-left group",
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
      )}
    >
      <Icon
        className={clsx(
          "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors",
          active
            ? "text-white"
            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
        )}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function AdminShell() {
  const [active, setActive] = useState<TabId>("analytics");

  const setTab = (id: TabId) => setActive(id);

  const content = (
    <>
      {active === "analytics"  && <Analytics />}
      {active === "groups"     && <ManageGroups />}
      {active === "categories" && <ManageCategories />}
      {active === "users"      && <ManageUsers />}
      {active === "ads"        && <ManageAds />}
      {active === "drive"      && <DriveSettings />}
      {active === "logs"       && <ActivityLogs />}
    </>
  );

  return (
    <>
      {/* ── DESKTOP: 2-Panel Sidebar Layout ─────────────────────────────── */}
      <div className="hidden lg:flex rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900" style={{ height: "calc(100dvh - 85px)" }}>
        {/* Sidebar — sticky scroll independently */}
        <aside className="w-48 sm:w-52 shrink-0 flex flex-col bg-slate-50/90 dark:bg-slate-900/90 border-r border-slate-200/70 dark:border-slate-800 p-2 sm:p-2.5 gap-0.5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2.5 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon }) => (
                  <NavItem
                    key={id}
                    label={label}
                    icon={icon}
                    active={active === id}
                    onClick={() => setTab(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Content Panel — independent scroll */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 min-w-0">
          {content}
        </main>
      </div>

      {/* ── MOBILE: Scrollable Tab Bar + Panel ──────────────────────────── */}
      <div className="lg:hidden space-y-4">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-0.5 px-0.5 pb-1">
          {NAV_GROUPS.flatMap((g) => g.items).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0",
                active === id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div>{content}</div>
      </div>
    </>
  );
}
