const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
Promise.all([
  p.user.count(),
  p.category.count(),
  p.mediaFile.count(),
  p.tag.count(),
  p.mediaFileTag.count(),
  p.appSetting.count(),
  p.activityLog.count(),
  p.banner.count(),
  p.sidebarAd.count(),
  p.popup.count(),
  p.mediaAttachment.count(),
]).then(([u, c, m, t, mt, a, l, b, s, po, ma]) => {
  console.log("Users:", u, "Categories:", c, "Files:", m, "Tags:", t, "FileTags:", mt, "Settings:", a, "Logs:", l, "Banners:", b, "SidebarAds:", s, "Popups:", po, "Attachments:", ma);
}).catch(e => {
  console.error(e.message);
}).finally(() => p.$disconnect());
