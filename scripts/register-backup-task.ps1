# register-backup-task.ps1 — Đăng ký Task Scheduler cho backup CDCMedia
# Chay voi quyen Administrator

$TaskName   = "CDCMedia_BackupDB"
$ScriptPath = (Resolve-Path "$PSScriptRoot\backup-db.ps1").Path
$LogPath    = "C:\cdcmedia-backups\task-output.log"

# Xoa task cu neu ton tai
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Output "Da xoa task cu: $TaskName"
}

# Action: chay PowerShell voi script backup
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" >> `"$LogPath`" 2>&1"

# Trigger: moi thu 7 luc 14:00
$Trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Saturday `
    -At "14:00"

# Chay voi quyen SYSTEM, bat ke co ai dang nhap hay khong
$Principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Settings
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable   # Chay bu neu may dang tat luc 14:00

# Dang ky
Register-ScheduledTask `
    -TaskName  $TaskName `
    -Action    $Action `
    -Trigger   $Trigger `
    -Principal $Principal `
    -Settings  $Settings `
    -Description "Backup SQLite DB CDCMedia moi thu 7 luc 14:00"

Write-Output ""
Write-Output "=== Da dang ky thanh cong ==="
Write-Output "Task name : $TaskName"
Write-Output "Script    : $ScriptPath"
Write-Output "Lich      : Moi Thu 7 luc 14:00"
Write-Output "Log output: $LogPath"
