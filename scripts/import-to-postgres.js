const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function importData() {
  const jsonPath = path.join(__dirname, "sqlite_data.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ Không tìm thấy file sqlite_data.json");
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  console.log("🚀 Bắt đầu nạp dữ liệu vào PostgreSQL...");

  // 1. Users
  console.log(`👤 Đang nạp ${data.users.length} Users...`);
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        username: u.username,
        passwordHash: u.passwordHash,
        displayName: u.displayName,
        role: u.role,
        isActive: u.isActive,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }
  console.log("   ✅ Users xong");

  // 2. Categories
  console.log(`📂 Đang nạp ${data.categories.length} Categories...`);
  for (const c of data.categories) {
    await prisma.category.upsert({
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
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
  }
  console.log("   ✅ Categories xong");

  // 3. Tags
  console.log(`🏷️ Đang nạp ${data.tags.length} Tags...`);
  for (const t of data.tags) {
    await prisma.tag.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        createdAt: new Date(t.createdAt),
      },
    });
  }
  console.log("   ✅ Tags xong");

  // 4. MediaFiles
  console.log(`📄 Đang nạp ${data.files.length} MediaFiles...`);
  let count = 0;
  for (const f of data.files) {
    await prisma.mediaFile.upsert({
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
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      },
    });
    count++;
    if (count % 50 === 0) process.stdout.write(`   ... đã nạp ${count}/${data.files.length}\r`);
  }
  console.log(`   ✅ ${data.files.length} MediaFiles xong`);

  // 5. MediaAttachments
  console.log(`📎 Đang nạp ${data.attachments.length} Attachments...`);
  for (const a of data.attachments) {
    await prisma.mediaAttachment.upsert({
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
        createdAt: new Date(a.createdAt),
      },
    });
  }
  console.log("   ✅ Attachments xong");

  // 6. MediaFileTags
  console.log(`🔗 Đang nạp ${data.fileTags.length} File-Tag relations...`);
  for (const ft of data.fileTags) {
    await prisma.mediaFileTag.upsert({
      where: { fileId_tagId: { fileId: ft.fileId, tagId: ft.tagId } },
      update: {},
      create: {
        fileId: ft.fileId,
        tagId: ft.tagId,
      },
    });
  }
  console.log("   ✅ FileTags xong");

  // 7. AppSettings
  console.log(`⚙️ Đang nạp ${data.settings.length} AppSettings...`);
  for (const s of data.settings) {
    await prisma.appSetting.upsert({
      where: { id: s.id },
      update: { value: s.value, updatedAt: new Date(s.updatedAt) },
      create: {
        id: s.id,
        key: s.key,
        value: s.value,
        updatedAt: new Date(s.updatedAt),
      },
    });
  }
  console.log("   ✅ AppSettings xong");

  // 8. ActivityLogs
  console.log(`📜 Đang nạp ${data.logs.length} ActivityLogs...`);
  let logCount = 0;
  for (const l of data.logs) {
    await prisma.activityLog.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        action: l.action,
        details: l.details,
        userId: l.userId,
        ipAddress: l.ipAddress,
        createdAt: new Date(l.createdAt),
      },
    });
    logCount++;
    if (logCount % 100 === 0) process.stdout.write(`   ... đã nạp ${logCount}/${data.logs.length}\r`);
  }
  console.log(`   ✅ ${data.logs.length} ActivityLogs xong`);

  // 9. Banners
  console.log(`🖼️ Đang nạp ${data.banners.length} Banners...`);
  for (const b of data.banners) {
    await prisma.banner.upsert({
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
        startAt: b.startAt ? new Date(b.startAt) : null,
        endAt: b.endAt ? new Date(b.endAt) : null,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      },
    });
  }
  console.log("   ✅ Banners xong");

  // 10. SidebarAds
  console.log(`📢 Đang nạp ${data.sidebarAds.length} SidebarAds...`);
  for (const s of data.sidebarAds) {
    await prisma.sidebarAd.upsert({
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
        startAt: s.startAt ? new Date(s.startAt) : null,
        endAt: s.endAt ? new Date(s.endAt) : null,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
  }
  console.log("   ✅ SidebarAds xong");

  // 11. Popups
  if (data.popups.length > 0) {
    console.log(`💬 Đang nạp ${data.popups.length} Popups...`);
    for (const p of data.popups) {
      await prisma.popup.upsert({
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
          startAt: p.startAt ? new Date(p.startAt) : null,
          endAt: p.endAt ? new Date(p.endAt) : null,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        },
      });
    }
    console.log("   ✅ Popups xong");
  }

  console.log("\n🎉 Chúc mừng! Đã chuyển đổi và nạp toàn bộ dữ liệu vào PostgreSQL thành công!");
  await prisma.$disconnect();
}

importData().catch((err) => {
  console.error("\n❌ Lỗi nạp dữ liệu:", err);
  process.exit(1);
});
