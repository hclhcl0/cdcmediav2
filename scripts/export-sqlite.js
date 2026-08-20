const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function exportData() {
  console.log("📦 Đang trích xuất toàn bộ dữ liệu từ SQLite...");
  const data = {
    users: await prisma.user.findMany(),
    categories: await prisma.category.findMany(),
    tags: await prisma.tag.findMany(),
    files: await prisma.mediaFile.findMany(),
    attachments: await prisma.mediaAttachment.findMany(),
    fileTags: await prisma.mediaFileTag.findMany(),
    settings: await prisma.appSetting.findMany(),
    logs: await prisma.activityLog.findMany(),
    banners: await prisma.banner.findMany(),
    sidebarAds: await prisma.sidebarAd.findMany(),
    popups: await prisma.popup.findMany(),
  };

  const outputPath = path.join(__dirname, "sqlite_data.json");
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log("✅ Trích xuất thành công:");
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Categories: ${data.categories.length}`);
  console.log(`- Files: ${data.files.length}`);
  console.log(`- Tags: ${data.tags.length}`);
  console.log(`- FileTags: ${data.fileTags.length}`);
  console.log(`- Attachments: ${data.attachments.length}`);
  console.log(`- Settings: ${data.settings.length}`);
  console.log(`- Logs: ${data.logs.length}`);
  console.log(`- Banners: ${data.banners.length}`);
  console.log(`- SidebarAds: ${data.sidebarAds.length}`);
  console.log(`- Popups: ${data.popups.length}`);
  console.log(`📁 File lưu tại: ${outputPath}`);

  await prisma.$disconnect();
}

exportData().catch((err) => {
  console.error("❌ Lỗi trích xuất:", err);
  process.exit(1);
});
