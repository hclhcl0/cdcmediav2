const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeBanners() {
  const dir = path.join(process.cwd(), 'uploads', 'ads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const files = [
    { name: '73b89939-9eb0-4ec8-b21d-e52dc4a4acf8.webp', title: 'TRUNG TÂM KIỂM SOÁT BỆNH TẬT TP. ĐÀ NẴNG', sub: 'Chung tay phòng chống dịch bệnh - Bảo vệ sức khỏe cộng đồng', bg: '#1D78B8' },
    { name: 'b246a28e-9e03-454b-9861-6bcd1098e29e.webp', title: 'TIÊM CHỦNG ĐẦY ĐỦ ĐÚNG LỊCH', sub: 'Lá chắn bảo vệ sức khỏe cho trẻ em và cả gia đình', bg: '#0284c7' },
    { name: 'd94748eb-9a30-4215-a21e-8b37742ad21b.webp', title: 'VỆ SINH MÔI TRƯỜNG &amp; DINH DƯỠNG HỢP LÝ', sub: 'Xây dựng nếp sống văn minh, an toàn, khỏe mạnh', bg: '#0d9488' }
  ];

  for (const f of files) {
    const svg = Buffer.from(
      `<svg width="1200" height="300" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${f.bg}" stop-opacity="1" />
            <stop offset="100%" stop-color="#0f172a" stop-opacity="1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="300" rx="16" fill="url(#grad)" />
        <circle cx="1100" cy="150" r="180" fill="white" fill-opacity="0.05" />
        <circle cx="100" cy="30" r="100" fill="white" fill-opacity="0.05" />
        <text x="600" y="130" font-family="sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">${f.title}</text>
        <text x="600" y="180" font-family="sans-serif" font-size="20" fill="#e2e8f0" text-anchor="middle">${f.sub}</text>
        <rect x="520" y="215" width="160" height="36" rx="18" fill="#f59e0b" />
        <text x="600" y="238" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">XEM CHI TIẾT</text>
      </svg>`
    );
    await sharp(svg).webp({ quality: 90 }).toFile(path.join(dir, f.name));
    console.log('Created banner:', f.name);
  }
}

makeBanners().catch(console.error);
