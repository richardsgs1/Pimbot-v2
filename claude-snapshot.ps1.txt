# claude-snapshot.ps1
# Creates a current snapshot of your project in Google Drive
# Claude can then read this to understand your full codebase

param(
    [string]$ProjectPath = "C:\Users\richa\OneDrive\Documents\Projects\Pimbot-v2",
    [string]$SnapshotPath = "G:\My Drive\Claude\Pimbot-v2-Current"
)

Write-Host "📸 Creating Claude-accessible snapshot..." -ForegroundColor Cyan

# Remove old snapshot
if (Test-Path $SnapshotPath) {
    Remove-Item $SnapshotPath -Recurse -Force
}

# Create fresh snapshot
New-Item -ItemType Directory -Path $SnapshotPath -Force | Out-Null

# Copy key files (no node_modules, no .git)
$include = @("api", "components", "lib", "src", "public", "*.json", "*.ts", "*.md", "vercel.json")

foreach ($pattern in $include) {
    $items = Get-ChildItem -Path $ProjectPath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        if ($item.Name -ne "node_modules" -and $item.Name -ne ".git") {
            Write-Host "  📄 $($item.Name)" -ForegroundColor Gray
            Copy-Item -Path $item.FullName -Destination $SnapshotPath -Recurse -Force
        }
    }
}

# Create a README for Claude
$readmeContent = @"
# Pimbot-v2 Current State
Last updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Project Structure
- Vite + React + TypeScript frontend
- Vercel serverless functions (api/)
- Supabase database
- Stripe payments
- Mailgun emails
- Google Gemini AI

## Key Files
- api/send-trial-email.ts - Mailgun email endpoint
- lib/TrialEmailService.ts - Email service
- lib/TrialManager.ts - Trial logic
- components/TrialBanner.tsx - Trial UI

## Status
Project snapshot for Claude Code Assistant

## To Access in Claude
Say: "Search my Google Drive for Pimbot-v2-Current"
"@

Set-Content -Path "$SnapshotPath\README-FOR-CLAUDE.md" -Value $readmeContent

Write-Host "✅ Snapshot created at: $SnapshotPath" -ForegroundColor Green
Write-Host "💡 In Claude, say: 'Search my Drive for Pimbot-v2-Current'" -ForegroundColor Cyan