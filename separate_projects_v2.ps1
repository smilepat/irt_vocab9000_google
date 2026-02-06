# Project Separation Script V2
# Creates backup using robocopy and separates projects

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Project Separation Script V2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create Backup using robocopy (more reliable)
Write-Host "[1/6] Creating backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "c:\irt_vocab9000_backup_$timestamp"

try {
    if (Test-Path $backupPath) {
        Remove-Item -Path $backupPath -Recurse -Force
    }

    Write-Host "  Copying to: $backupPath" -ForegroundColor Gray
    robocopy "c:\irt_vocab9000_google" $backupPath /E /NFL /NDL /NJH /NJS /XD ".git" "node_modules" | Out-Null

    if ($LASTEXITCODE -le 7) {  # robocopy success codes are 0-7
        Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
    } else {
        throw "Robocopy failed with exit code: $LASTEXITCODE"
    }
} catch {
    Write-Host "✗ Backup failed: $_" -ForegroundColor Red
    Write-Host "! Continuing without backup..." -ForegroundColor Yellow
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

$source = "c:\irt_vocab9000_google"
Write-Host "  Copying files (excluding ontology-vocab-app, node_modules)..." -ForegroundColor Gray

# Use robocopy with proper error handling
$result = robocopy $source $irtDir /E /XD "ontology-vocab-app" "node_modules" /NFL /NDL /NJH
if ($LASTEXITCODE -le 7) {
    Write-Host "✓ IRT Vocab 9000 copied to: $irtDir" -ForegroundColor Green
} else {
    Write-Host "✗ Copy failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Copy .git separately
if (Test-Path "$source\.git") {
    Write-Host "  Copying Git repository..." -ForegroundColor Gray
    robocopy "$source\.git" "$irtDir\.git" /E /NFL /NDL /NJH | Out-Null
    if ($LASTEXITCODE -le 7) {
        Write-Host "✓ Git repository copied" -ForegroundColor Green
    }
}

# Step 4: Copy Vocab Graph App
Write-Host ""
Write-Host "[4/6] Copying Vocab Graph App..." -ForegroundColor Yellow
$graphDir = "$parentDir\vocab-graph-app"

if (Test-Path $graphDir) {
    Write-Host "! Directory already exists, removing..." -ForegroundColor Yellow
    Remove-Item -Path $graphDir -Recurse -Force
}

$ontologySource = "$source\ontology-vocab-app"
if (Test-Path $ontologySource) {
    Write-Host "  Copying ontology-vocab-app contents..." -ForegroundColor Gray
    robocopy $ontologySource $graphDir /E /XD "node_modules" /NFL /NDL /NJH | Out-Null

    if ($LASTEXITCODE -le 7) {
        Write-Host "✓ Vocab Graph App copied to: $graphDir" -ForegroundColor Green

        # Initialize new git repository
        Write-Host "  Initializing Git repository..." -ForegroundColor Gray
        Push-Location $graphDir
        try {
            git init 2>&1 | Out-Null
            git add . 2>&1 | Out-Null
            git commit -m "feat: Initialize vocab-graph-app as independent project" 2>&1 | Out-Null
            Write-Host "✓ Git repository initialized" -ForegroundColor Green
        } catch {
            Write-Host "! Git initialization failed (might already exist)" -ForegroundColor Yellow
        }
        Pop-Location
    } else {
        Write-Host "✗ Copy failed" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Source not found: $ontologySource" -ForegroundColor Red
}

# Step 5: Handle CSV data file
Write-Host ""
Write-Host "[5/6] Setting up shared CSV data..." -ForegroundColor Yellow
$csvSource = "$irtDir\public\master_vocabulary_table9000.csv"

if (Test-Path $csvSource) {
    $csvDest = "$graphDir\data"

    if (-not (Test-Path $csvDest)) {
        New-Item -ItemType Directory -Path $csvDest -Force | Out-Null
    }

    $csvDestFile = "$csvDest\master_vocabulary_table9000.csv"

    # Try hard link first, fall back to copy
    try {
        if (Test-Path $csvDestFile) {
            Remove-Item $csvDestFile -Force
        }

        # Use cmd /c mklink for hard link
        $result = cmd /c mklink /H "`"$csvDestFile`"" "`"$csvSource`"" 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ CSV hard link created (files share same disk space)" -ForegroundColor Green
        } else {
            throw "Hard link failed"
        }
    } catch {
        # Fallback to copy
        Copy-Item $csvSource $csvDestFile -Force
        Write-Host "✓ CSV file copied (hard link not supported, using copy)" -ForegroundColor Yellow
    }

    $fileSize = (Get-Item $csvSource).Length / 1MB
    Write-Host "  File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "! CSV file not found at: $csvSource" -ForegroundColor Yellow
}

# Step 6: Summary and structure check
Write-Host ""
Write-Host "[6/6] Verifying structure..." -ForegroundColor Yellow

function Show-DirectoryTree {
    param($path, $prefix = "", $isLast = $true)

    $name = Split-Path $path -Leaf
    $connector = if ($isLast) { "└── " } else { "├── " }
    Write-Host "$prefix$connector$name" -ForegroundColor White

    $newPrefix = $prefix + $(if ($isLast) { "    " } else { "│   " })

    $items = Get-ChildItem $path -Directory | Where-Object {
        $_.Name -notin @('node_modules', '.git', 'dist', 'build')
    } | Select-Object -First 5

    for ($i = 0; $i -lt $items.Count; $i++) {
        $isLastItem = ($i -eq $items.Count - 1)
        Show-DirectoryTree $items[$i].FullName $newPrefix $isLastItem
    }
}

Write-Host ""
Write-Host "Directory Structure:" -ForegroundColor Cyan
Show-DirectoryTree "c:\vocab-projects"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Separation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Backup:       $backupPath" -ForegroundColor White
Write-Host "📁 IRT Vocab:    $irtDir" -ForegroundColor White
Write-Host "📁 Graph App:    $graphDir" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Test IRT Vocab 9000:" -ForegroundColor Cyan
Write-Host "   cd `"$irtDir`"" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Test Vocab Graph App:" -ForegroundColor Cyan
Write-Host "   cd `"$graphDir`"" -ForegroundColor Gray
Write-Host "   docker-compose up -d    # Start Neo4j" -ForegroundColor Gray
Write-Host "   npm install              # Install dependencies" -ForegroundColor Gray
Write-Host "   npm run dev              # Start both API and Web" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Set up remote repositories:" -ForegroundColor Cyan
Write-Host "   # IRT Vocab (keep existing repo)" -ForegroundColor Gray
Write-Host "   cd `"$irtDir`"" -ForegroundColor Gray
Write-Host "   git remote -v" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "   # Graph App (create new repo on GitHub first)" -ForegroundColor Gray
Write-Host "   cd `"$graphDir`"" -ForegroundColor Gray
Write-Host "   git remote add origin https://github.com/SmailePat/vocab-graph-app.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
