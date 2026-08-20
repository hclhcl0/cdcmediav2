// src/app/admin/DriveSettings.tsx
"use client";
import { useState, useEffect, FormEvent } from "react";
import { Save, TestTube, Check, X, Cloud, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface Settings {
  gdrive_client_id: string;
  gdrive_client_secret: string;
  gdrive_refresh_token: string;
  gdrive_folder_id: string;
  default_thumbnail_url: string;
  gemini_api_key: string;
}

export default function DriveSettings() {
  const [settings, setSettings] = useState<Settings>({
    gdrive_client_id: "",
    gdrive_client_secret: "",
    gdrive_refresh_token: "",
    gdrive_folder_id: "",
    default_thumbnail_url: "",
    gemini_api_key: "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; email?: string; used?: number; total?: number; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.settings) setSettings((prev) => ({ ...prev, ...d.settings }));
    });
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gdrive_client_id: settings.gdrive_client_id,
        gdrive_client_secret: settings.gdrive_client_secret,
        gdrive_refresh_token: settings.gdrive_refresh_token,
        gdrive_folder_id: settings.gdrive_folder_id,
        default_thumbnail_url: settings.default_thumbnail_url,
        gemini_api_key: settings.gemini_api_key,
      }),
    });
    setSaving(false);
    if (res.ok) toast.success("Đã lưu cài đặt Google Drive");
    else toast.error("Lỗi lưu cài đặt");
  }

  async function handleTest() {
    setTesting(true); setTestResult(null);
    const res = await fetch("/api/settings/test-drive", { method: "POST" });
    const data = await res.json();
    setTesting(false); setTestResult(data);
    if (data.ok) toast.success("Kết nối Google Drive thành công!");
    else toast.error("Không thể kết nối: " + (data.error ?? ""));
  }

  async function handleSaveThumbnail() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_thumbnail_url: settings.default_thumbnail_url }),
    });
    setSaving(false);
    if (res.ok) toast.success("Đã lưu cấu hình ảnh bìa thành công!");
    else toast.error("Lỗi lưu cài đặt");
  }

  function formatGB(bytes?: number) {
    if (!bytes) return "0 GB";
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  }

  async function handleUploadThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    
    setSaving(true);
    try {
      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setSettings({ ...settings, default_thumbnail_url: data.url });
        toast.success("Tải ảnh lên thành công! Bấm 'Lưu ảnh bìa' để áp dụng.");
      } else toast.error(data.error || "Lỗi upload");
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        <h3 className="font-bold text-slate-700 dark:text-slate-200">Cài đặt Google Drive</h3>
      </div>

      <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 rounded-2xl p-4 text-sm text-sky-700 dark:text-sky-300 space-y-1">
        <p className="font-semibold">Hướng dẫn:</p>
        <ol className="list-decimal list-inside space-y-1 text-sky-600 dark:text-sky-400">
          <li>Tạo Google Cloud Project → bật Google Drive API</li>
          <li>Tạo OAuth 2.0 Client ID (Desktop App)</li>
          <li>Lấy Refresh Token bằng OAuth Playground</li>
          <li>Điền thông tin bên dưới và lưu</li>
        </ol>
      </div>

      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">1. Ảnh bìa mặc định</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Hình ảnh này sẽ được hiển thị khi một video hoặc tài liệu không tải được ảnh bìa.</p>
        
        <div className="flex items-start gap-6">
          <div className="w-48 h-32 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative shrink-0">
            {settings.default_thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.default_thumbnail_url} alt="Default Thumbnail" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Chưa có ảnh</span>
            )}
          </div>
          <div>
            <div className="flex flex-col gap-2">
              <label className="btn-secondary px-4 py-2 cursor-pointer inline-flex items-center justify-center gap-2">
                <Cloud className="w-4 h-4" /> Chọn ảnh tải lên
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadThumbnail} disabled={saving} />
              </label>
              <button type="button" onClick={handleSaveThumbnail} disabled={saving} className="btn-primary px-4 py-2 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Lưu ảnh bìa
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">2. Cấu hình kết nối Google Drive</h4>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Client ID</label>
          <input
            type="text" value={settings.gdrive_client_id}
            onChange={(e) => setSettings((s) => ({ ...s, gdrive_client_id: e.target.value }))}
            placeholder="xxxx.apps.googleusercontent.com"
            className="input-base"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Client Secret</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"} value={settings.gdrive_client_secret}
              onChange={(e) => setSettings((s) => ({ ...s, gdrive_client_secret: e.target.value }))}
              placeholder="GOCSPX-…"
              className="input-base pr-10"
            />
            <button type="button" onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Refresh Token</label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"} value={settings.gdrive_refresh_token}
              onChange={(e) => setSettings((s) => ({ ...s, gdrive_refresh_token: e.target.value }))}
              placeholder="1//0g…"
              className="input-base pr-10"
            />
            <button type="button" onClick={() => setShowToken((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Folder ID (tùy chọn)</label>
          <input
            type="text" value={settings.gdrive_folder_id}
            onChange={(e) => setSettings((s) => ({ ...s, gdrive_folder_id: e.target.value }))}
            placeholder="ID thư mục Google Drive (để trống = My Drive)"
            className="input-base"
          />
        </div>

        <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 mt-6">3. Cấu hình Trí tuệ Nhân tạo (Google Gemini)</h4>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Gemini API Key</label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"} value={settings.gemini_api_key}
              onChange={(e) => setSettings((s) => ({ ...s, gemini_api_key: e.target.value }))}
              placeholder="AIzaSy..."
              className="input-base pr-10"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dùng để tự động tạo mô tả tài liệu. Lấy key miễn phí tại <a href="https://aistudio.google.com" target="_blank" className="text-blue-500 dark:text-blue-400 hover:underline">Google AI Studio</a></p>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm py-2.5">
            <Save className="w-4 h-4" /> {saving ? "Đang lưu…" : "Lưu cài đặt"}
          </button>
          <button type="button" onClick={handleTest} disabled={testing} className="btn-secondary flex items-center gap-1.5 text-sm py-2.5">
            <TestTube className="w-4 h-4" /> {testing ? "Đang kiểm tra…" : "Kiểm tra kết nối Drive"}
          </button>
        </div>
      </form>

      {/* Test result */}
      {testResult && (
        <div className={`rounded-2xl p-4 text-sm flex items-start gap-3 ${testResult.ok ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"}`}>
          {testResult.ok ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
          <div>
            {testResult.ok ? (
              <>
                <p className="font-semibold">Kết nối thành công!</p>
                <p>Tài khoản: {testResult.email}</p>
                <p>Đã dùng: {formatGB(testResult.used)} / {testResult.total ? formatGB(testResult.total) : "Không giới hạn"}</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Kết nối thất bại</p>
                <p>{testResult.error}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
