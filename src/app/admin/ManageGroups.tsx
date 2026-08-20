"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check, Save, Layers } from "lucide-react";
import toast from "react-hot-toast";

interface Group {
  id: string;
  name: string;
  icon: string;
}

const AVAILABLE_ICONS = [
  "Film", "Mic", "ImageIcon", "FileText", "Book", "Briefcase", "Video", "Music", "Folder", "PieChart", "Layout", "Monitor", "Smartphone"
];

export default function ManageGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Folder");

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch (err) {
      toast.error("Lỗi tải phân hệ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  async function saveGroupsToApi(newGroups: Group[]) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: newGroups })
      });
      if (res.ok) {
        toast.success("Đã lưu danh sách phân hệ");
        setGroups(newGroups);
      } else {
        toast.error("Lỗi khi lưu phân hệ");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsSaving(false);
    }
  }

  function openCreate() {
    setEditIndex(null);
    setId("");
    setName("");
    setIcon("Folder");
    setShowForm(true);
  }

  function openEdit(index: number) {
    const grp = groups[index];
    setEditIndex(index);
    setId(grp.id);
    setName(grp.name);
    setIcon(grp.icon);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!id.trim() || !name.trim()) {
      toast.error("ID và Tên phân hệ là bắt buộc");
      return;
    }
    
    if (editIndex === null && groups.some(g => g.id.toUpperCase() === id.toUpperCase())) {
      toast.error("Mã ID phân hệ đã tồn tại");
      return;
    }

    const newGroup = { id: id.toUpperCase().trim(), name: name.trim(), icon };
    const newGroups = [...groups];

    if (editIndex !== null) {
      newGroups[editIndex] = newGroup;
    } else {
      newGroups.push(newGroup);
    }

    setShowForm(false);
    saveGroupsToApi(newGroups);
  }

  function handleDelete(index: number) {
    if (!confirm(`Xóa phân hệ "${groups[index].name}"? Những chuyên mục thuộc phân hệ này sẽ không tự động chuyển đi đâu.`)) return;
    
    const newGroups = [...groups];
    newGroups.splice(index, 1);
    saveGroupsToApi(newGroups);
  }

  function moveGroup(index: number, direction: -1 | 1) {
    if (index + direction < 0 || index + direction >= groups.length) return;
    const newGroups = [...groups];
    const temp = newGroups[index];
    newGroups[index] = newGroups[index + direction];
    newGroups[index + direction] = temp;
    saveGroupsToApi(newGroups);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-700 dark:text-slate-200">Quản lý Phân hệ</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Các nhóm lớn trên thanh Menu ngang của trang chủ</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm py-2">
          <Plus className="w-4 h-4" /> Thêm Phân hệ
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/30 rounded-2xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{editIndex !== null ? "Sửa phân hệ" : "Thêm phân hệ mới"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mã ID (Không dấu viết liền)</p>
              <input value={id} onChange={(e) => setId(e.target.value)} placeholder="VD: VIDEO, SACH" className="input-base text-sm uppercase" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tên hiển thị</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Thư viện Video" className="input-base text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tên Icon (chuẩn Lucide)</p>
              <select value={icon} onChange={(e) => setIcon(e.target.value)} className="input-base text-sm cursor-pointer">
                {AVAILABLE_ICONS.map(ic => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={isSaving} className="btn-primary text-sm py-2 flex items-center gap-1">
              {isSaving ? <Check className="w-3.5 h-3.5 opacity-50" /> : <Save className="w-3.5 h-3.5" />} 
              {editIndex !== null ? "Cập nhật & Lưu" : "Thêm & Lưu"}
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
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Chưa có phân hệ nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((grp, idx) => (
            <div key={grp.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition">
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/40">
                  {grp.id.substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    {grp.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">ID: {grp.id} • Icon: {grp.icon}</p>
                </div>
              </div>
              
              <div className="flex gap-1 shrink-0 items-center">
                <button onClick={() => moveGroup(idx, -1)} disabled={idx === 0} className="px-2 py-1 text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30">
                  Lên
                </button>
                <button onClick={() => moveGroup(idx, 1)} disabled={idx === groups.length - 1} className="px-2 py-1 text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30">
                  Xuống
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
                <button onClick={() => openEdit(idx)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(idx)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition">
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
