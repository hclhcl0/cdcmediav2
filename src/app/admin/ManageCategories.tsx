// src/app/admin/ManageCategories.tsx
"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  color: string | null; icon: string | null; group: string | null; sortOrder: number;
  _count: { files: number };
}

interface Group {
  id: string;
  name: string;
  icon: string;
}

const COLORS = ["#3B82F6","#6366F1","#8B5CF6","#EC4899","#EF4444","#F97316","#EAB308","#22C55E","#14B8A6","#06B6D4","#64748B"];

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [group, setGroup] = useState("DOCUMENTS");
  const [sortOrder, setSortOrder] = useState("0");

  async function fetchCategoriesAndGroups() {
    setLoading(true);
    try {
      const [resCat, resGrp] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/groups")
      ]);
      const dataCat = await resCat.json();
      const dataGrp = await resGrp.json();
      setCategories(dataCat.categories ?? []);
      setGroups(dataGrp.groups ?? []);
    } catch (err) {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCategoriesAndGroups(); }, []);

  function openCreate() {
    setEditId(null); setName(""); setDescription(""); setColor(COLORS[0]); setGroup("DOCUMENTS"); setSortOrder("0");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditId(cat.id); setName(cat.name); setDescription(cat.description ?? "");
    setColor(cat.color ?? COLORS[0]); setGroup(cat.group ?? "DOCUMENTS"); setSortOrder(String(cat.sortOrder));
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!name.trim()) { toast.error("Tên chuyên mục là bắt buộc"); return; }
    const body = { name: name.trim(), description, color, group, sortOrder: parseInt(sortOrder) };
    const url = editId ? `/api/categories/${editId}` : "/api/categories";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      toast.success(editId ? "Đã cập nhật chuyên mục" : "Đã tạo chuyên mục");
      setShowForm(false);
      fetchCategoriesAndGroups();
    } else {
      toast.error(data.error ?? "Lỗi");
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Xóa chuyên mục "${cat.name}"? Sẽ xóa ${cat._count.files} tài liệu liên quan.`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa chuyên mục"); fetchCategoriesAndGroups(); }
    else { const d = await res.json(); toast.error(d.error ?? "Lỗi xóa"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700 dark:text-slate-200">Quản lý chuyên mục</h3>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm py-2">
          <Plus className="w-4 h-4" /> Thêm chuyên mục
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/30 rounded-2xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{editId ? "Sửa chuyên mục" : "Tạo chuyên mục mới"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên chuyên mục *" className="input-base text-sm" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" className="input-base text-sm" />
            <select value={group} onChange={(e) => setGroup(e.target.value)} className="input-base text-sm cursor-pointer">
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Màu sắc</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: color === c ? (document.documentElement.classList.contains('dark') ? "#ffffff" : "#1e293b") : "transparent" }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Thứ tự</p>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                className="input-base text-sm w-20" min="0" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary text-sm py-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {editId ? "Cập nhật" : "Tạo mới"}
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
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Chưa có chuyên mục nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition">
              <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color ?? "#3B82F6" }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  {cat.name} 
                  {cat.group && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold border border-slate-200/50 dark:border-slate-700/50">
                      {groups.find(g => g.id === cat.group)?.name || cat.group}
                    </span>
                  )}
                </p>
                {cat.description && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{cat.description}</p>}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{cat._count.files} file</span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
