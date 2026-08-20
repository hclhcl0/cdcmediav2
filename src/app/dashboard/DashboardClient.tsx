// src/app/dashboard/DashboardClient.tsx
"use client";
import { useState } from "react";
import { Upload, List, CloudSync } from "lucide-react";
import clsx from "clsx";
import UploadFileForm from "./UploadFileForm";
import UserFilesList from "./UserFilesList";
import DriveSyncCard from "./DriveSyncCard";
import type { CategoryWithCount } from "@/types";

interface Props {
  categories: CategoryWithCount[];
  isAdmin: boolean;
}

export default function DashboardClient({ categories, isAdmin }: Props) {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("files");

  const tabs = [
    { id: "files", label: "Danh sách", icon: List },
    { id: "upload", label: "Tải lên", icon: Upload },
    ...(isAdmin ? [{ id: "sync", label: "Đồng bộ Drive", icon: CloudSync }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-2xl w-full sm:w-fit border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "relative flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 select-none min-h-[42px]",
                active
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-sky-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "files" && (
        <UserFilesList
          isAdmin={isAdmin}
          categories={categories}
          refreshSignal={refreshSignal}
        />
      )}

      {activeTab === "upload" && (
        <div className="w-full">
          <UploadFileForm
            categories={categories}
            onUploaded={() => {
              setRefreshSignal((n) => n + 1);
              setActiveTab("files");
            }}
          />
        </div>
      )}

      {activeTab === "sync" && isAdmin && (
        <div className="w-full">
          <DriveSyncCard
            isAdmin={isAdmin}
            onSynced={() => setRefreshSignal((n) => n + 1)}
          />
        </div>
      )}
    </div>
  );
}
