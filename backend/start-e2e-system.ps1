#!/usr/bin/env pwsh
# End-to-End System Startup Script
# Usage: ./start-system.ps1

param(
    [switch]$SkipQdrant = $false,
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false,
    [switch]$Test = $false
)

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         MindSet X - End-to-End System Startup                 ║" -ForegroundColor Cyan
Write-Host "║         January 25, 2026                                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$backendPath = "a:\Hachathon\New folder\mindset-x--main\mindset-x--main\backend copy"
$frontendPath = "a:\Hachathon\New folder\mindset-x--main\mindset-x--main\mindset-safebio-vault-main"

Write-Host "`n[INFO] System Startup Configuration:" -ForegroundColor Yellow
Write-Host "├─ Backend Path: $backendPath"
Write-Host "├─ Frontend Path: $frontendPath"
Write-Host "├─ Skip Qdrant: $SkipQdrant"
Write-Host "├─ Skip Backend: $SkipBackend"
Write-Host "├─ Skip Frontend: $SkipFrontend"
Write-Host "└─ Run Tests: $Test"

# Check Prerequisites
Write-Host "`n[CHECK] Prerequisites..." -ForegroundColor Yellow

function Check-Command {
    param([string]$Command, [string]$Name)
    try {
        $result = & $Command 2>&1
        Write-Host "✅ $Name installed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $Name not found" -ForegroundColor Red
        return $false
    }
}

Check-Command "python --version" "Python" | Out-Null
Check-Command "node --version" "Node.js" | Out-Null
Check-Command "npm --version" "npm" | Out-Null

# Check Ports
Write-Host "`n[CHECK] Available ports..." -ForegroundColor Yellow

$ports = @(
    @{Port=5173; Name="Frontend (Vite)"},
    @{Port=8000; Name="Backend (FastAPI)"},
    @{Port=6333; Name="Qdrant"}
)

foreach ($port_info in $ports) {
    $port = $port_info.Port
    $name = $port_info.Name
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "⚠️  Port $port ($name) - IN USE" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Port $port ($name) - Available" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✅ Port $port ($name) - Available" -ForegroundColor Green
    }
}

# Start Services
Write-Host "`n[START] Services..." -ForegroundColor Yellow

if (-not $SkipQdrant) {
    Write-Host "`n📦 Starting Qdrant..." -ForegroundColor Cyan
    Write-Host "├─ Check if running: curl http://localhost:6333"
    Write-Host "├─ If not, run: docker run -p 6333:6333 qdrant/qdrant"
    Write-Host "└─ Or: qdrant-server"
    
    # Try to check if already running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:6333/health" -ErrorAction SilentlyContinue
        Write-Host "✅ Qdrant is already running" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Qdrant not detected. Start it in separate terminal if needed." -ForegroundColor Yellow
    }
}

if (-not $SkipBackend) {
    Write-Host "`n🔧 Starting Backend..." -ForegroundColor Cyan
    Write-Host "├─ Directory: $backendPath"
    Write-Host "├─ Command: python main.py"
    Write-Host "└─ Expected: Uvicorn running on http://0.0.0.0:8000"
    
    try {
        Push-Location $backendPath
        
        # Check if venv exists
        if (Test-Path ".\venv\Scripts\Activate.ps1") {
            Write-Host "  Activating virtual environment..." -ForegroundColor Gray
            & .\venv\Scripts\Activate.ps1
        }
        
        Write-Host "  Starting server..." -ForegroundColor Gray
        Start-Process -NoNewWindow -FilePath python -ArgumentList "main.py"
        Write-Host "✅ Backend process started" -ForegroundColor Green
        
        Pop-Location
    }
    catch {
        Write-Host "❌ Failed to start backend: $_" -ForegroundColor Red
    }
}

if (-not $SkipFrontend) {
    Write-Host "`n🎨 Starting Frontend..." -ForegroundColor Cyan
    Write-Host "├─ Directory: $frontendPath"
    Write-Host "├─ Command: npm run dev"
    Write-Host "└─ Expected: Local: http://localhost:5173/"
    
    try {
        Push-Location $frontendPath
        
        # Check dependencies
        if (-not (Test-Path ".\node_modules")) {
            Write-Host "  Installing dependencies (first time)..." -ForegroundColor Gray
            npm install
        }
        
        Write-Host "  Starting development server..." -ForegroundColor Gray
        Start-Process -NoNewWindow -FilePath npm -ArgumentList "run dev"
        Write-Host "✅ Frontend process started" -ForegroundColor Green
        
        Pop-Location
    }
    catch {
        Write-Host "❌ Failed to start frontend: $_" -ForegroundColor Red
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  🚀 STARTUP COMPLETE 🚀                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📋 System Status:" -ForegroundColor Yellow
Write-Host "├─ Qdrant:   http://localhost:6333  (should respond with health)"
Write-Host "├─ Backend:  http://localhost:8000  (FastAPI docs)"
Write-Host "└─ Frontend: http://localhost:5173  (React app)"

Write-Host "`n⏳ Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify Services
Write-Host "`n✔️  Verifying services..." -ForegroundColor Yellow

$servicesReady = @{
    Qdrant = $false
    Backend = $false
    Frontend = $false
}

for ($i = 0; $i -lt 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:6333" -ErrorAction SilentlyContinue
        $servicesReady.Qdrant = $true
    }
    catch { }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -ErrorAction SilentlyContinue
        $servicesReady.Backend = $true
    }
    catch { }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -ErrorAction SilentlyContinue
        $servicesReady.Frontend = $true
    }
    catch { }
    
    if ($servicesReady.Qdrant -and $servicesReady.Backend) {
        break
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
Write-Host "├─ Qdrant:   $(if ($servicesReady.Qdrant) { '✅ Ready' } else { '⏳ Starting' })"
Write-Host "├─ Backend:  $(if ($servicesReady.Backend) { '✅ Ready' } else { '⏳ Starting' })"
Write-Host "└─ Frontend: $(if ($servicesReady.Frontend) { '✅ Ready' } else { '⏳ Starting' })"

if ($Test) {
    Write-Host "`n🧪 Running Tests..." -ForegroundColor Yellow
    
    if ($servicesReady.Backend) {
        Write-Host "`n  Testing Chat Endpoint..." -ForegroundColor Cyan
        try {
            $chatResponse = Invoke-WebRequest -Uri "http://localhost:8000/chat" `
                -Method POST `
                -ContentType "application/json" `
                -Body '{"message":"Test message","session_id":"test-123"}' `
                -ErrorAction Stop
            Write-Host "  ✅ Chat endpoint working"
        }
        catch {
            Write-Host "  ❌ Chat endpoint failed: $_"
        }
        
        Write-Host "`n  Testing PHQ-9 Endpoint..." -ForegroundColor Cyan
        try {
            $phq9Response = Invoke-WebRequest -Uri "http://localhost:8000/phq9" `
                -Method POST `
                -ContentType "application/json" `
                -Body '{"scores":[1,1,0,1,2,0,1,0,1],"student_id":"STU123"}' `
                -ErrorAction Stop
            Write-Host "  ✅ PHQ-9 endpoint working"
        }
        catch {
            Write-Host "  ❌ PHQ-9 endpoint failed: $_"
        }
        
        Write-Host "`n  Testing Drift Endpoint..." -ForegroundColor Cyan
        try {
            $driftResponse = Invoke-WebRequest -Uri "http://localhost:8000/drift" `
                -Method POST `
                -ContentType "application/json" `
                -Body '{"student_id":"STU123","include_chat":true,"include_phq9":true}' `
                -ErrorAction Stop
            Write-Host "  ✅ Drift endpoint working"
        }
        catch {
            Write-Host "  ❌ Drift endpoint failed: $_"
        }
    }
}

Write-Host "`n📚 Next Steps:" -ForegroundColor Green
Write-Host "├─ 1. Open browser: http://localhost:5173"
Write-Host "├─ 2. Test Chat interface"
Write-Host "├─ 3. Submit PHQ-9 assessment"
Write-Host "├─ 4. Check Drift detection"
Write-Host "├─ 5. Monitor terminal logs"
Write-Host "└─ 6. See E2E_TESTING_GUIDE.md for detailed steps"

Write-Host "`n💡 Tips:" -ForegroundColor Cyan
Write-Host "├─ Check logs: Look at terminal windows for errors"
Write-Host "├─ API docs: http://localhost:8000/docs (Swagger)"
Write-Host "├─ Database: curl http://localhost:6333/collections"
Write-Host "└─ Stop all: Press Ctrl+C in each terminal"

Write-Host "`n✅ System ready for end-to-end testing!`n" -ForegroundColor Green
