/**
 * migrate-to-postgres.js
 * Đọc toàn bộ dữ liệu từ SQLite và ghi vào PostgreSQL
 *
 * Cách dùng:
 *   1. Đặt PG_DATABASE_URL vào biến môi trường hoặc truyền trực tiếp vào script
 *   2. node scripts/migrate-to-postgres.js
 */

const { PrismaClient: SQLiteClient } = require("@prisma/client");

// ── Đổi connection string PostgreSQL ở đây ──────────────────────────────────
const PG_URL = process.env.PG_DATABASE_URL || "postgresql://USER:PASSWORD@HOST:5432/DBNAME";
// ─────────────────────────────────────────────────────────────────────────────

if (PG_URL.includes("USER:PASSWORD")) {
  console.error("❌ Bạn chưa cung cấp PostgreSQL connection string!");
  console.error("   Chạy: PG_DATABASE_URL=postgresql://... node scripts/migrate-to-postgres.js");
  process.exit(1);
}

// Import Prisma động để dùng 2 datasource khác nhau
const { PrismaClient } = require("@prisma/client");

const sqlite = new SQLiteClient(); // đọc từ .env (SQLite)
const pg = new PrismaClient({       // ghi vào PostgreSQL
  datasources: { db: { url: PG_URL } },
});

async function migrate() {
  console.log("🔄 Bắt đầu migration SQLite → PostgreSQL...\n");

  try {
    // ── 1. Users ──────────────────────────────────────────────────────────────
    const users = await sqlite.user.findMany();
    console.log(`📦 Users: ${users.length}`);
    for (const u of users) {
      await pg.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          username: u.username,
          passwordHash: u.passwordHash,
          displayName: u.displayName,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${users.length} users`);

    // ── 2. Categories ─────────────────────────────────────────────────────────
    const categories = await sqlite.category.findMany();
    console.log(`📦 Categories: ${categories.length}`);
    for (const c of categories) {
      await pg.category.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          color: c.color,
          icon: c.icon,
          group: c.group,
          sortOrder: c.sortOrder,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${categories.length} categories`);

    // ── 3. Tags ───────────────────────────────────────────────────────────────
    const tags = await sqlite.tag.findMany();
    console.log(`📦 Tags: ${tags.length}`);
    for (const t of tags) {
      await pg.tag.upsert({
        where: { id: t.id },
        update: {},
        create: {
          id: t.id,
          name: t.name,
          createdAt: t.createdAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${tags.length} tags`);

    // ── 4. MediaFiles ─────────────────────────────────────────────────────────
    const files = await sqlite.mediaFile.findMany();
    console.log(`📦 MediaFiles: ${files.length}`);
    let fileCount = 0;
    for (const f of files) {
      await pg.mediaFile.upsert({
        where: { id: f.id },
        update: {},
        create: {
          id: f.id,
          title: f.title,
          description: f.description,
          filename: f.filename,
          filepath: f.filepath,
          driveFileId: f.driveFileId,
          driveWebLink: f.driveWebLink,
          thumbnailUrl: f.thumbnailUrl,
          fileType: f.fileType,
          fileSize: f.fileSize,
          downloadCount: f.downloadCount,
          viewCount: f.viewCount,
          isPublic: f.isPublic,
          year: f.year,
          categoryId: f.categoryId,
          uploaderId: f.uploaderId,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        },
      });
      fileCount++;
      if (fileCount % 50 === 0) process.stdout.write(`   ... ${fileCount}/${files.length}\r`);
    }
    console.log(`   ✅ Đã migrate ${files.length} files           `);

    // ── 5. MediaAttachments ───────────────────────────────────────────────────
    const attachments = await sqlite.mediaAttachment.findMany();
    console.log(`📦 Attachments: ${attachments.length}`);
    for (const a of attachments) {
      await pg.mediaAttachment.upsert({
        where: { id: a.id },
        update: {},
        create: {
          id: a.id,
          fileId: a.fileId,
          filename: a.filename,
          filepath: a.filepath,
          driveFileId: a.driveFileId,
          driveWebLink: a.driveWebLink,
          thumbnailUrl: a.thumbnailUrl,
          fileType: a.fileType,
          fileSize: a.fileSize,
          createdAt: a.createdAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${attachments.length} attachments`);

    // ── 6. MediaFileTags (junction table) ─────────────────────────────────────
    const fileTags = await sqlite.mediaFileTag.findMany();
    console.log(`📦 FileTags: ${fileTags.length}`);
    for (const ft of fileTags) {
      await pg.mediaFileTag.upsert({
        where: { fileId_tagId: { fileId: ft.fileId, tagId: ft.tagId } },
        update: {},
        create: { fileId: ft.fileId, tagId: ft.tagId },
      });
    }
    console.log(`   ✅ Đã migrate ${fileTags.length} file-tag relations`);

    // ── 7. AppSettings ────────────────────────────────────────────────────────
    const settings = await sqlite.appSetting.findMany();
    console.log(`📦 AppSettings: ${settings.length}`);
    for (const s of settings) {
      await pg.appSetting.upsert({
        where: { id: s.id },
        update: { value: s.value, updatedAt: s.updatedAt },
        create: {
          id: s.id,
          key: s.key,
          value: s.value,
          updatedAt: s.updatedAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${settings.length} settings`);

    // ── 8. ActivityLogs ───────────────────────────────────────────────────────
    const logs = await sqlite.activityLog.findMany({ orderBy: { createdAt: "asc" } });
    console.log(`📦 ActivityLogs: ${logs.length}`);
    let logCount = 0;
    for (const l of logs) {
      await pg.activityLog.upsert({
        where: { id: l.id },
        update: {},
        create: {
          id: l.id,
          action: l.action,
          details: l.details,
          userId: l.userId,
          ipAddress: l.ipAddress,
          createdAt: l.createdAt,
        },
      });
      logCount++;
      if (logCount % 100 === 0) process.stdout.write(`   ... ${logCount}/${logs.length}\r`);
    }
    console.log(`   ✅ Đã migrate ${logs.length} logs           `);

    // ── 9. Banners ────────────────────────────────────────────────────────────
    const banners = await sqlite.banner.findMany();
    console.log(`📦 Banners: ${banners.length}`);
    for (const b of banners) {
      await pg.banner.upsert({
        where: { id: b.id },
        update: {},
        create: {
          id: b.id,
          title: b.title,
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl,
          position: b.position,
          isActive: b.isActive,
          sortOrder: b.sortOrder,
          startAt: b.startAt,
          endAt: b.endAt,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${banners.length} banners`);

    // ── 10. SidebarAds ────────────────────────────────────────────────────────
    const sidebarAds = await sqlite.sidebarAd.findMany();
    console.log(`📦 SidebarAds: ${sidebarAds.length}`);
    for (const s of sidebarAds) {
      await pg.sidebarAd.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          title: s.title,
          imageUrl: s.imageUrl,
          linkUrl: s.linkUrl,
          position: s.position,
          isActive: s.isActive,
          sortOrder: s.sortOrder,
          startAt: s.startAt,
          endAt: s.endAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${sidebarAds.length} sidebar ads`);

    // ── 11. Popups ────────────────────────────────────────────────────────────
    const popups = await sqlite.popup.findMany();
    console.log(`📦 Popups: ${popups.length}`);
    for (const p of popups) {
      await pg.popup.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          title: p.title,
          imageUrl: p.imageUrl,
          content: p.content,
          linkUrl: p.linkUrl,
          linkLabel: p.linkLabel,
          isActive: p.isActive,
          showOnce: p.showOnce,
          delayMs: p.delayMs,
          startAt: p.startAt,
          endAt: p.endAt,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
      });
    }
    console.log(`   ✅ Đã migrate ${popups.length} popups`);

    console.log("\n🎉 Migration hoàn tất! Kiểm tra tại PostgreSQL.");
  } catch (err) {
    console.error("\n❌ Lỗi migration:", err.message);
    console.error(err);
  } finally {
    await sqlite.$disconnect();
    await pg.$disconnect();
  }
}

migrate();
