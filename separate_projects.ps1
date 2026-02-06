# Project Separation Script
# Creates backup and separates IRT Vocab 9000 and Vocab Graph App

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Project Separation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create Backup
Write-Host "[1/6] Creating backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "c:\irt_vocab9000_backup_$timestamp.zip"

try {
    Compress-Archive -Path "c:\irt_vocab9000_google" -DestinationPath $backupPath -Force
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "✗ Backup failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create parent directory
Write-Host ""
Write-Host "[2/6] Creating parent directory..." -ForegroundColor Yellow
$parentDir = "c:\vocab-projects"

if (-not (Test-Path $parentDir)) {
    New-Item -ItemType Directory -Path $parentDir | Out-Null
    Write-Host "✓ Created: $parentDir" -ForegroundColor Green
} else {
    Write-Host "✓ Already exists: $parentDir" -ForegroundColor Green
}

# Step 3: Copy IRT Vocab 9000 (excluding ontology-vocab-app)
Write-Host ""
Write-Host "[3/6] Copying IRT Vocab 9000..." -ForegroundColor Yellow
$irtDir = "$parentDir\irt-vocab9000"

if (Test-Path $irtDir) {
    Write-Host "! Directory already exists, removing..." -ForegroundColor Yellow
    Remove-Item -Path $irtDir -Recurse -Force
}

# Copy with robocopy (excludes specified directories)
$source = "c:\irt_vocab9000_google"
$exclude = @("ontology-vocab-app", "node_modules", ".git")
$excludeArgs = $exclude | ForEach-Object { "/XD `"$_`"" }

Write-Host "  Copying files (this may take a moment)..." -ForegroundColor Gray
robocopy $source $irtDir /E /XD "ontology-vocab-app" "node_modules" /NFL /NDL /NJH /NJS | Out-Null

# Copy .git separately
if (Test-Path "$source\.git") {
    Write-Host "  Copying Git repository..." -ForegroundColor Gray
    robocopy "$source\.git" "$irtDir\.git" /E /NFL /NDL /NJH /NJS | Out-Null
}

Write-Host "✓ IRT Vocab 9000 copied" -ForegroundColor Green

# Step 4: Copy Vocab Graph App
Write-Host ""
Write-Host "[4/6] Copying Vocab Graph App..." -ForegroundColor Yellow
$graphDir = "$parentDir\vocab-graph-app"

if (Test-Path $graphDir) {
    Write-Host "! Directory already exists, removing..." -ForegroundColor Yellow
    Remove-Item -Path $graphDir -Recurse -Force
}

# Copy ontology-vocab-app contents
$ontologySource = "$source\ontology-vocab-app"
if (Test-Path $ontologySource) {
    robocopy $ontologySource $graphDir /E /XD "node_modules" /NFL /NDL /NJH /NJS | Out-Null
    Write-Host "✓ Vocab Graph App copied" -ForegroundColor Green

    # Initialize new git repository
    Push-Location $graphDir
    git init | Out-Null
    git add . | Out-Null
    git commit -m "feat: Initialize vocab-graph-app as independent project" | Out-Null
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
    Pop-Location
} else {
    Write-Host "✗ Source not found: $ontologySource" -ForegroundColor Red
}

# Step 5: Handle CSV data file
Write-Host ""
Write-Host "[5/6] Setting up shared CSV data..." -ForegroundColor Yellow
$csvSource = "$irtDir\public\master_vocabulary_table9000.csv"
$csvDest = "$graphDir\data"

if (Test-Path $csvSource) {
    if (-not (Test-Path $csvDest)) {
        New-Item -ItemType Directory -Path $csvDest -Force | Out-Null
    }

    # Create hard link (shares same file)
    $csvDestFile = "$csvDest\master_vocabulary_table9000.csv"
    if (Test-Path $csvDestFile) {
        Remove-Item $csvDestFile -Force
    }

    try {
        New-Item -ItemType HardLink -Path $csvDestFile -Target $csvSource -Force | Out-Null
        Write-Host "✓ CSV hard link created (shared file)" -ForegroundColor Green
    } catch {
        # Fallback to copy if hard link fails
        Copy-Item $csvSource $csvDestFile -Force
        Write-Host "✓ CSV file copied (hard link failed, using copy)" -ForegroundColor Yellow
    }
} else {
    Write-Host "! CSV file not found: $csvSource" -ForegroundColor Yellow
}

# Step 6: Summary
Write-Host ""
Write-Host "[6/6] Separation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Backup:       $backupPath" -ForegroundColor White
Write-Host "📁 IRT Vocab:    $irtDir" -ForegroundColor White
Write-Host "📁 Graph App:    $graphDir" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test IRT Vocab 9000:" -ForegroundColor White
Write-Host "   cd $irtDir" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test Vocab Graph App:" -ForegroundColor White
Write-Host "   cd $graphDir" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
