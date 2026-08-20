// src/app/admin/ManageAds.tsx — quản lý Banner, Sidebar Ads, Popup
"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight, Image, Megaphone, Bell } from "lucide-react";
import toast from "react-hot-toast";
import ImageUploader from "@/components/ImageUploader";
import { clsx } from "clsx";

type Banner = {
  id: string; title: string; imageUrl: string; linkUrl: string | null;
  position: string; isActive: boolean; sortOrder: number;
};
type Popup = {
  id: string; title: string; imageUrl: string | null; content: string | null;
  linkUrl: string | null; linkLabel: string | null; isActive: boolean;
  showOnce: boolean; delayMs: number;
};

type Tab = "banners" | "sidebar" | "popup" | "logo";

// ── Form helpers ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}

// ── Banner tab ───────────────────────────────────────────────────────────────
function BannerManager() {
  const [items, setItems] = useState<Banner[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", position: "TOP", sortOrder: "0" });

  const load = useCallback(() => {
    fetch("/api/banners?all=1")
      .then(r => r.json()).then(data => setItems(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ title: "", imageUrl: "", linkUrl: "", position: "TOP", sortOrder: "0" }); }

  async function save() {
    if (!form.title || !form.imageUrl) return toast.error("Cần tiêu đề và URL ảnh");
    const payload = { ...form, sortOrder: Number(form.sortOrder) || 0, linkUrl: form.linkUrl || null };
    const url = editId ? `/api/banners/${editId}` : "/api/banners";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success(editId ? "Đã cập nhật" : "Đã thêm banner"); setAdding(false); setEditId(null); resetForm(); load(); }
    else { const d = await res.json(); toast.error(d.error ?? "Lỗi"); }
  }

  async function del(id: string) {
    if (!confirm("Xóa banner này?")) return;
    const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); load(); } else toast.error("Lỗi xóa");
  }

  async function toggle(item: Banner) {
    await fetch(`/api/banners/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, isActive: !item.isActive }) });
    load();
  }

  function startEdit(item: Banner) {
    setEditId(item.id); setAdding(true);
    setForm({ title: item.title, imageUrl: item.imageUrl, linkUrl: item.linkUrl ?? "", position: item.position, sortOrder: String(item.sortOrder) });
  }

  const posLabel: Record<string, string> = { TOP: "Trên cùng", MIDDLE: "Giữa trang", BOTTOM: "Dưới footer" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Banner ngang hiển thị trên/giữa/dưới trang chủ</p>
        <button onClick={() => { setAdding(true); setEditId(null); resetForm(); }} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Thêm banner
        </button>
      </div>

      {(adding) && (
        <div className="border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{editId ? "Sửa banner" : "Banner mới"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tiêu đề *"><input className="input-base text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tên banner" /></Field>
            <Field label="Vị trí">
              <select className="input-base text-sm" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
                <option value="TOP">Trên cùng (dưới Navbar)</option>
                <option value="MIDDLE">Giữa trang</option>
                <option value="BOTTOM">Dưới trang (trên Footer)</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Ảnh banner * (Kích thước khuyên dùng: 1200x300 px hoặc 1920x480 px - tỷ lệ ~4:1)">
                <ImageUploader currentUrl={form.imageUrl} onUploaded={url => setForm(f => ({ ...f, imageUrl: url }))} />
                <input className="input-base text-xs mt-1.5" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="hoặc nhập URL ảnh trực tiếp…" />
              </Field>
            </div>
            <Field label="Link khi click (tùy chọn)"><input className="input-base text-sm" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." /></Field>
            <Field label="Thứ tự"><input type="number" className="input-base text-sm" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></Field>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary flex items-center gap-1 text-sm"><Check className="w-3.5 h-3.5" /> Lưu</button>
            <button onClick={() => { setAdding(false); setEditId(null); resetForm(); }} className="btn-secondary text-sm"><X className="w-3.5 h-3.5" /> Hủy</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Chưa có banner nào</p>}
        {items.map(item => (
          <div key={item.id} className={clsx("flex items-center gap-3 p-3 rounded-2xl border transition-all", item.isActive ? "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60" : "border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 opacity-60")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.title} className="w-20 h-12 object-cover rounded-xl shrink-0 border border-slate-100 dark:border-slate-700" onError={e => (e.currentTarget.style.display = "none")} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate">{item.title}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{posLabel[item.position] ?? item.position} · Thứ tự: {item.sortOrder}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggle(item)} title={item.isActive ? "Đang bật" : "Đang tắt"} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500">
                {item.isActive ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



// ── Popup tab ────────────────────────────────────────────────────────────────
function PopupManager() {
  const [items, setItems] = useState<Popup[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", content: "", linkUrl: "", linkLabel: "", showOnce: true, delayMs: "1000" });

  const load = useCallback(() => {
    fetch("/api/popups?all=1")
      .then(r => r.json()).then(data => {
        setItems(Array.isArray(data) ? data : data ? [data] : []);
      }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ title: "", imageUrl: "", content: "", linkUrl: "", linkLabel: "", showOnce: true, delayMs: "1000" }); }

  async function save() {
    if (!form.title) return toast.error("Cần tiêu đề");
    const payload = {
      title: form.title,
      imageUrl: form.imageUrl || null,
      content: form.content || null,
      linkUrl: form.linkUrl || null,
      linkLabel: form.linkLabel || null,
      showOnce: form.showOnce,
      delayMs: Number(form.delayMs) || 1000,
      isActive: true,
    };
    const url = editId ? `/api/popups/${editId}` : "/api/popups";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success(editId ? "Đã cập nhật" : "Đã thêm popup"); setAdding(false); setEditId(null); resetForm(); load(); }
    else { const d = await res.json(); toast.error(d.error ?? "Lỗi"); }
  }

  async function del(id: string) {
    if (!confirm("Xóa popup này?")) return;
    const res = await fetch(`/api/popups/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); load(); } else toast.error("Lỗi xóa");
  }

  async function toggle(item: Popup) {
    await fetch(`/api/popups/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, isActive: !item.isActive }) });
    load();
  }

  function startEdit(item: Popup) {
    setEditId(item.id); setAdding(true);
    setForm({ title: item.title, imageUrl: item.imageUrl ?? "", content: item.content ?? "", linkUrl: item.linkUrl ?? "", linkLabel: item.linkLabel ?? "", showOnce: item.showOnce, delayMs: String(item.delayMs) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Popup hiện khi người dùng vào trang chủ</p>
        <button onClick={() => { setAdding(true); setEditId(null); resetForm(); }} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Thêm popup
        </button>
      </div>

      {adding && (
        <div className="border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{editId ? "Sửa popup" : "Popup mới"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tiêu đề *"><input className="input-base text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tiêu đề popup" /></Field>
            <Field label="Delay (ms) trước khi hiện"><input type="number" className="input-base text-sm" value={form.delayMs} onChange={e => setForm(f => ({ ...f, delayMs: e.target.value }))} /></Field>
            <div className="sm:col-span-2">
              <Field label="Ảnh popup (tùy chọn - Kích thước khuyên dùng: 800x450 px - tỷ lệ 16:9)">
                <ImageUploader currentUrl={form.imageUrl} onUploaded={url => setForm(f => ({ ...f, imageUrl: url }))} />
                <input className="input-base text-xs mt-1.5" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="hoặc nhập URL ảnh trực tiếp…" />
              </Field>
            </div>
            <Field label="Nội dung text (tùy chọn)">
              <textarea className="input-base text-sm resize-none h-16" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Nội dung thông báo..." />
            </Field>
            <div className="space-y-3">
              <Field label="Link khi nhấn nút"><input className="input-base text-sm" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." /></Field>
              <Field label="Nhãn nút"><input className="input-base text-sm" value={form.linkLabel} onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))} placeholder="Xem thêm" /></Field>
            </div>
            <Field label="Chỉ hiện 1 lần / phiên">
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={form.showOnce} onChange={e => setForm(f => ({ ...f, showOnce: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-600 dark:text-slate-300">Bật (mỗi lần mở tab mới hiện 1 lần)</span>
              </label>
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary flex items-center gap-1 text-sm"><Check className="w-3.5 h-3.5" /> Lưu</button>
            <button onClick={() => { setAdding(false); setEditId(null); resetForm(); }} className="btn-secondary text-sm"><X className="w-3.5 h-3.5" /> Hủy</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Chưa có popup nào</p>}
        {items.map(item => (
          <div key={item.id} className={clsx("flex items-start gap-3 p-3 rounded-2xl border transition-all", item.isActive ? "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60" : "border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 opacity-60")}>
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover rounded-xl shrink-0 border border-slate-100 dark:border-slate-700" onError={e => (e.currentTarget.style.display = "none")} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{item.title}</p>
              {item.content && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{item.content}</p>}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Delay: {item.delayMs}ms · {item.showOnce ? "Hiện 1 lần/tab" : "Hiện mỗi lần"}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggle(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500">
                {item.isActive ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "logo", label: "Logo Website", icon: Image },
  { id: "banners", label: "Banner ngang", icon: Image },
  { id: "popup", label: "Popup", icon: Bell },
];

function LogoManager() {
  const [logoUrl, setLogoUrl] = useState("/api/uploads/logo.png");
  
  return (
    <div className="space-y-4">
      <div className="border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 bg-blue-50/50 dark:bg-blue-950/30 space-y-4">
        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Cập nhật Logo hệ thống</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Logo sẽ hiển thị ở thanh điều hướng (Navbar) và dưới chân trang (Footer). Nên dùng ảnh định dạng PNG có nền trong suốt (transparent).</p>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 shrink-0 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-2 relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" onError={e => { const target = e.currentTarget as HTMLImageElement; if (target.src.includes('/api/uploads/logo.png')) { target.src = '/logo.png'; } else { target.style.display = 'none'; } }} />
          </div>
          <div className="flex-1 space-y-2 min-w-0 w-full">
            <Field label="Tải lên hình ảnh mới">
              <input type="file" accept="image/png, image/jpeg, image/webp" className="input-base text-sm" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                const toastId = toast.loading("Đang tải lên...");
                try {
                  const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
                  if (res.ok) {
                    const data = await res.json();
                    setLogoUrl(data.url);
                    toast.success("Đã cập nhật Logo! Hãy F5 trang web để thấy thay đổi.", { id: toastId });
                  } else {
                    const data = await res.json();
                    toast.error(data.error || "Lỗi tải ảnh", { id: toastId });
                  }
                } catch {
                  toast.error("Lỗi mạng", { id: toastId });
                }
              }} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageAds() {
  const [tab, setTab] = useState<Tab>("banners");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0",
              tab === id ? "bg-indigo-600 dark:bg-indigo-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      {tab === "logo" && <LogoManager />}
      {tab === "banners" && <BannerManager />}
      {tab === "popup" && <PopupManager />}
    </div>
  );
}
