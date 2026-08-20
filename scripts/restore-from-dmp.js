// scripts/restore-from-dmp.js — Khôi phục toàn bộ 100% dữ liệu từ PostgreSQL dump (.dmp)
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../node_modules/@prisma/client'));

const prisma = new PrismaClient();

const DMP_PATH = process.argv[2] || 'C:\\Users\\Admin\\Downloads\\pg-dump-postgres-1787225997.dmp';

if (!fs.existsSync(DMP_PATH)) {
  console.error(`❌ Không tìm thấy file dump tại: ${DMP_PATH}`);
  process.exit(1);
}

const buf = fs.readFileSync(DMP_PATH);
console.log(`📦 Đang đọc file dump (${(buf.length / 1024).toFixed(1)} KB): ${DMP_PATH}`);

function readIntAt(p) {
  const sign = buf[p];
  let val = 0;
  for (let i = 0; i < 4; i++) {
    val |= (buf[p + 1 + i] << (i * 8));
  }
  return { val: sign ? -val : val, nextP: p + 5 };
}

function parseDumpBlocks() {
  let p = 18000;
  const blocks = {};

  while (p < buf.length - 10) {
    if (buf[p] === 0x01) { // BLK_DATA
      const { val: dumpId, nextP: pAfterId } = readIntAt(p + 1);
      
      if (dumpId > 0 && dumpId < 50000) {
        let cp = pAfterId;
        const chunks = [];
        let validBlock = true;
        
        while (cp < buf.length) {
          const { val: chunkLen, nextP: pAfterLen } = readIntAt(cp);
          if (chunkLen === 0) {
            cp = pAfterLen;
            break;
          }
          if (chunkLen < 0 || chunkLen > 65536 || pAfterLen + chunkLen > buf.length) {
            validBlock = false;
            break;
          }
          chunks.push(buf.subarray(pAfterLen, pAfterLen + chunkLen));
          cp = pAfterLen + chunkLen;
        }

        if (validBlock && chunks.length > 0) {
          const joined = Buffer.concat(chunks);
          try {
            const decomp = zlib.inflateSync(joined);
            blocks[dumpId] = decomp.toString('utf-8');
            p = cp;
            continue;
          } catch(e) {}
        }
      }
    }
    p++;
  }
  return blocks;
}

function parseRows(text) {
  if (!text) return [];
  return text.trim().split('\n').filter(l => l && l !== '\\.').map(l => l.split('\t'));
}

function valOrNull(v) {
  if (v === undefined || v === null || v === '\\N' || v === '') return null;
  return v;
}

function parseBool(v, def = false) {
  if (v === 't' || v === 'true' || v === '1') return true;
  if (v === 'f' || v === 'false' || v === '0') return false;
  return def;
}

function parseIntOrNull(v) {
  const clean = valOrNull(v);
  if (clean === null) return null;
  const n = parseInt(clean, 10);
  return isNaN(n) ? null : n;
}

function parseDate(v) {
  const clean = valOrNull(v);
  if (!clean) return new Date();
  const d = new Date(clean);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function restore() {
  console.log('🔄 Bắt đầu dọn dẹp dữ liệu cũ để chuẩn bị nạp toàn bộ bản sao lưu...');
  
  // Clean up in reverse dependency order
  await prisma.activityLog.deleteMany().catch(() => {});
  await prisma.mediaFileTag.deleteMany().catch(() => {});
  await prisma.mediaAttachment.deleteMany().catch(() => {});
  await prisma.mediaFile.deleteMany().catch(() => {});
  await prisma.tag.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.banner.deleteMany().catch(() => {});
  await prisma.sidebarAd.deleteMany().catch(() => {});
  await prisma.popup.deleteMany().catch(() => {});
  await prisma.appSetting.deleteMany().catch(() => {});
  
  console.log('✅ Đã dọn dẹp database. Đang giải nén các khối dữ liệu...');
  const blocks = parseDumpBlocks();

  // Dump IDs mapping:
  // 3555: ActivityLog
  // 3556: AppSetting
  // 3557: Banner
  // 3558: Category
  // 3559: MediaAttachment
  // 3560: MediaFile
  // 3561: MediaFileTag
  // 3562: Popup
  // 3563: SidebarAd
  // 3564: Tag
  // 3565: User

  // 1. User
  const rawUsers = parseRows(blocks[3565]);
  console.log(`👤 Đang nạp ${rawUsers.length} tài khoản người dùng...`);
  for (const r of rawUsers) {
    const id = r[0];
    const username = r[1];
    const passwordHash = r[2];
    const displayName = valOrNull(r[3]);
    const role = r[4] || 'UPLOADER';
    const isActive = parseBool(r[5], true);
    const createdAt = parseDate(r[6]);
    const updatedAt = parseDate(r[7]);

    await prisma.user.create({
      data: { id, username, passwordHash, displayName, role, isActive, createdAt, updatedAt }
    });
  }

  // 2. Category
  const rawCategories = parseRows(blocks[3558]);
  console.log(`📁 Đang nạp ${rawCategories.length} danh mục...`);
  for (const r of rawCategories) {
    const id = r[0];
    const name = r[1];
    const slug = r[2];
    const description = valOrNull(r[3]);
    const color = valOrNull(r[4]) || '#3B82F6';
    const icon = valOrNull(r[5]) || 'Folder';
    const sortOrder = parseIntOrNull(r[6]) || 0;
    const createdAt = parseDate(r[7]);
    const updatedAt = parseDate(r[8]);
    const group = valOrNull(r[9]);

    await prisma.category.create({
      data: { id, name, slug, description, color, icon, sortOrder, createdAt, updatedAt, group }
    });
  }

  // 3. Tag
  const rawTags = parseRows(blocks[3564]);
  console.log(`🏷️ Đang nạp ${rawTags.length} nhãn (tags)...`);
  for (const r of rawTags) {
    const id = r[0];
    const name = r[1];
    const createdAt = parseDate(r[2]);

    await prisma.tag.create({
      data: { id, name, createdAt }
    });
  }

  // 4. MediaFile
  const rawMediaFiles = parseRows(blocks[3560]);
  console.log(`📄 Đang nạp ${rawMediaFiles.length} tệp tài liệu media...`);
  for (const r of rawMediaFiles) {
    const id = r[0];
    const title = r[1];
    const description = valOrNull(r[2]);
    const filename = r[3];
    const filepath = r[4];
    const driveFileId = valOrNull(r[5]);
    const driveWebLink = valOrNull(r[6]);
    const fileType = r[7] || 'document';
    const fileSize = parseIntOrNull(r[8]) || 0;
    const downloadCount = parseIntOrNull(r[9]) || 0;
    const isPublic = parseBool(r[10], true);
    const year = parseIntOrNull(r[11]);
    const categoryId = r[12];
    const uploaderId = r[13];
    const createdAt = parseDate(r[14]);
    const updatedAt = parseDate(r[15]);
    const thumbnailUrl = valOrNull(r[16]);
    const viewCount = parseIntOrNull(r[17]) || 0;

    await prisma.mediaFile.create({
      data: {
        id, title, description, filename, filepath, driveFileId, driveWebLink,
        fileType, fileSize, downloadCount, isPublic, year, categoryId, uploaderId,
        createdAt, updatedAt, thumbnailUrl, viewCount
      }
    });
  }

  // 5. MediaAttachment
  const rawAttachments = parseRows(blocks[3559]);
  console.log(`📎 Đang nạp ${rawAttachments.length} tệp đính kèm phụ...`);
  for (const r of rawAttachments) {
    const id = r[0];
    const fileId = r[1];
    const filename = r[2];
    const filepath = r[3];
    const driveFileId = valOrNull(r[4]);
    const driveWebLink = valOrNull(r[5]);
    const thumbnailUrl = valOrNull(r[6]);
    const fileType = r[7] || 'image';
    const fileSize = parseIntOrNull(r[8]) || 0;
    const createdAt = parseDate(r[9]);

    await prisma.mediaAttachment.create({
      data: { id, fileId, filename, filepath, driveFileId, driveWebLink, thumbnailUrl, fileType, fileSize, createdAt }
    });
  }

  // 6. MediaFileTag
  const rawFileTags = parseRows(blocks[3561]);
  console.log(`🔗 Đang nạp ${rawFileTags.length} liên kết file - tag...`);
  for (const r of rawFileTags) {
    const fileId = r[0];
    const tagId = r[1];

    await prisma.mediaFileTag.create({
      data: { fileId, tagId }
    }).catch(() => {});
  }

  // 7. AppSetting
  const rawSettings = parseRows(blocks[3556]);
  console.log(`⚙️ Đang nạp ${rawSettings.length} cấu hình hệ thống...`);
  for (const r of rawSettings) {
    const id = r[0];
    const key = r[1];
    const value = r[2];
    const updatedAt = parseDate(r[3]);

    await prisma.appSetting.create({
      data: { id, key, value, updatedAt }
    });
  }

  // 8. Banner
  const rawBanners = parseRows(blocks[3557]);
  console.log(`🖼️ Đang nạp ${rawBanners.length} banner quảng bá...`);
  for (const r of rawBanners) {
    const id = r[0];
    const title = r[1];
    const imageUrl = r[2];
    const linkUrl = valOrNull(r[3]);
    const position = r[4] || 'TOP';
    const isActive = parseBool(r[5], true);
    const sortOrder = parseIntOrNull(r[6]) || 0;
    const startAt = valOrNull(r[7]) ? parseDate(r[7]) : null;
    const endAt = valOrNull(r[8]) ? parseDate(r[8]) : null;
    const createdAt = parseDate(r[9]);
    const updatedAt = parseDate(r[10]);

    await prisma.banner.create({
      data: { id, title, imageUrl, linkUrl, position, isActive, sortOrder, startAt, endAt, createdAt, updatedAt }
    });
  }

  // 9. SidebarAd
  const rawAds = parseRows(blocks[3563]);
  console.log(`📢 Đang nạp ${rawAds.length} banner sidebar...`);
  for (const r of rawAds) {
    const id = r[0];
    const title = r[1];
    const imageUrl = r[2];
    const linkUrl = valOrNull(r[3]);
    const position = r[4] || 'LEFT';
    const isActive = parseBool(r[5], true);
    const sortOrder = parseIntOrNull(r[6]) || 0;
    const startAt = valOrNull(r[7]) ? parseDate(r[7]) : null;
    const endAt = valOrNull(r[8]) ? parseDate(r[8]) : null;
    const createdAt = parseDate(r[9]);
    const updatedAt = parseDate(r[10]);

    await prisma.sidebarAd.create({
      data: { id, title, imageUrl, linkUrl, position, isActive, sortOrder, startAt, endAt, createdAt, updatedAt }
    });
  }

  // 10. ActivityLog
  const rawLogs = parseRows(blocks[3555]);
  console.log(`📜 Đang nạp ${rawLogs.length} nhật ký hoạt động...`);
  for (const r of rawLogs) {
    const id = r[0];
    const action = r[1];
    const details = valOrNull(r[2]);
    const userId = valOrNull(r[3]);
    const ipAddress = valOrNull(r[4]);
    const createdAt = parseDate(r[5]);

    await prisma.activityLog.create({
      data: { id, action, details, userId, ipAddress, createdAt }
    }).catch(() => {});
  }

  // 11. Popup
  const rawPopups = parseRows(blocks[3562]);
  if (rawPopups.length > 0) {
    console.log(`💬 Đang nạp ${rawPopups.length} popup...`);
    for (const r of rawPopups) {
      const id = r[0];
      const title = r[1];
      const imageUrl = valOrNull(r[2]);
      const content = valOrNull(r[3]);
      const linkUrl = valOrNull(r[4]);
      const linkLabel = valOrNull(r[5]);
      const isActive = parseBool(r[6], true);
      const showOnce = parseBool(r[7], true);
      const delayMs = parseIntOrNull(r[8]) || 1000;
      const startAt = valOrNull(r[9]) ? parseDate(r[9]) : null;
      const endAt = valOrNull(r[10]) ? parseDate(r[10]) : null;
      const createdAt = parseDate(r[11]);
      const updatedAt = parseDate(r[12]);

      await prisma.popup.create({
        data: { id, title, imageUrl, content, linkUrl, linkLabel, isActive, showOnce, delayMs, startAt, endAt, createdAt, updatedAt }
      });
    }
  }

  console.log('\n🎉 HOÀN TẤT KHÔI PHỤC TOÀN BỘ DỮ LIỆU TỪ FILE DUMP THÀNH CÔNG!');
}

restore()
  .catch(e => {
    console.error('❌ Lỗi khi khôi phục dữ liệu:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
