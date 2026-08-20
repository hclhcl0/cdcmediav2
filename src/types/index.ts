// src/types/index.ts — shared types
export type Role = "ADMIN" | "UPLOADER" | "VIEWER";

export type FileWithRelations = {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  filepath: string;
  driveFileId: string | null;
  driveWebLink: string | null;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  viewCount: number;
  thumbnailUrl: string | null;
  isPublic: boolean;
  year: number | null;
  categoryId: string;
  category: { id: string; name: string; color: string | null; icon: string | null };
  uploaderId: string;
  uploader: { id: string; username: string; displayName: string | null };
  tags: { tag: { id: string; name: string } }[];
  attachments?: { id: string; filename: string; fileType: string; fileSize: number }[];
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  group: string | null;
  icon: string | null;
  sortOrder: number;
  _count: { files: number };
};
