# backup-db.ps1 — Tự động backup SQLite DB cho CDCMedia
# Chạy mỗi thứ 7 lúc 14:00 qua Windows Task Scheduler

$AppDir     = (Resolve-Path "$PSScriptRoot\..").Path
$DbSource   = "$AppDir\prisma\cdc-media.db"
$BackupRoot = "C:\cdcmedia-backups"
$KeepWeeks  = 8   # Giữ tối đa 8 bản (2 tháng)

# --- Tạo thư mục backup nếu chưa có ---
if (-not (Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot | Out-Null
}

# --- Tên file theo ngày giờ ---
$Timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupFile = "$BackupRoot\cdc-media_$Timestamp.db"

# --- Copy DB (SQLite cho phép copy khi đang chạy ở WAL mode) ---
try {
    Copy-Item -Path $DbSource -Destination $BackupFile -ErrorAction Stop
    $SizeMB = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)
    Write-Output "[OK] Backup thanh cong: $BackupFile ($SizeMB MB)"
} catch {
    Write-Error "[LOI] Backup that bai: $_"
    exit 1
}

# --- Xoa ban cu qua $KeepWeeks tuan ---
$OldFiles = Get-ChildItem -Path $BackupRoot -Filter "cdc-media_*.db" |
            Sort-Object LastWriteTime -Descending |
            Select-Object -Skip $KeepWeeks

foreach ($f in $OldFiles) {
    Remove-Item $f.FullName -Force
    Write-Output "[DEL] Da xoa ban cu: $($f.Name)"
}

# --- Ghi log ---
$LogFile = "$BackupRoot\backup.log"
$LogLine = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | Backup: $BackupFile | Size: $SizeMB MB"
Add-Content -Path $LogFile -Value $LogLine

Write-Output "Hoan thanh. Log: $LogFile"
