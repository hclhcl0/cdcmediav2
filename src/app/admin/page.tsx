// src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-2.5">
      <AdminShell />
    </div>
  );
}

