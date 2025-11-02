# find-google-drive.ps1
# Automatically finds your Google Drive installation path

Write-Host "🔍 Searching for Google Drive installation..." -ForegroundColor Cyan

$possiblePaths = @(
    "G:\My Drive",
    "G:\",
    "$env:UserProfile\Google Drive\My Drive",
    "$env:UserProfile\Google Drive",
    "C:\Users\$env:USERNAME\Google Drive\My Drive",
    "C:\Users\$env:USERNAME\Google Drive"
)

$foundPath = $null

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        Write-Host "✅ Found Google Drive at: $path" -ForegroundColor Green
        $foundPath = $path
        break
    }
}

if ($foundPath) {
    Write-Host "`n📋 Use this path in your scripts:" -ForegroundColor Yellow
    Write-Host $foundPath -ForegroundColor White
    
    # Create the Claude folder if it doesn't exist
    $claudeFolder = Join-Path $foundPath "Claude"
    if (-not (Test-Path $claudeFolder)) {
        Write-Host "`n📁 Creating Claude folder..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $claudeFolder -Force | Out-Null
        Write-Host "✅ Created: $claudeFolder" -ForegroundColor Green
    }
    
    # Show the full path to use
    $snapshotPath = Join-Path $claudeFolder "Pimbot-v2-Current"
    Write-Host "`n🎯 Your SnapshotPath should be:" -ForegroundColor Yellow
    Write-Host $snapshotPath -ForegroundColor White
    
} else {
    Write-Host "❌ Google Drive not found!" -ForegroundColor Red
    Write-Host "`n💡 Install Google Drive for Desktop:" -ForegroundColor Yellow
    Write-Host "   https://www.google.com/drive/download/" -ForegroundColor Cyan
}

Read-Host "`nPress Enter to exit"