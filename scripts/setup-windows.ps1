<#
  LokalBan - prepara o ambiente de desenvolvimento no Windows
  - Instala o que faltar via winget: VS C++ Build Tools, Rust, Node LTS
  - Roda npm install

  Uso (na raiz do repositorio):
    powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
#>
$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "    OK: $msg" -ForegroundColor Green }
function Test-Command($name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }

function Update-SessionPath {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
        [Environment]::GetEnvironmentVariable("Path", "User") + ";" +
        (Join-Path $env:USERPROFILE ".cargo\bin")
}

function Install-WithWinget([string]$Id, [string[]]$Extra = @()) {
    if (-not (Test-Command "winget")) { throw "winget nao encontrado. Instale o 'App Installer' pela Microsoft Store." }
    & winget install --id $Id -e @Extra
    if (@(0, 3010) -notcontains $LASTEXITCODE) { throw "Falha ao instalar $Id ($LASTEXITCODE)" }
}

$root = Split-Path $PSScriptRoot -Parent
if ($root -match "OneDrive|Dropbox") {
    Write-Host "Aviso: o repositorio esta numa pasta sincronizada ($root). Isso costuma quebrar o build do Rust." -ForegroundColor Yellow
}

Write-Step "Verificando pre-requisitos"

$vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
$hasVc = (Test-Path $vswhere) -and [bool](& $vswhere -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath)
if ($hasVc) { Write-Ok "C++ Build Tools" } else {
    Write-Step "Instalando Visual Studio 2022 C++ Build Tools"
    Install-WithWinget "Microsoft.VisualStudio.2022.BuildTools" @("--override", "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended")
}

Update-SessionPath
if (Test-Command "cargo") { Write-Ok "Rust ($(& rustc -V))" } else {
    Write-Step "Instalando Rust"
    Install-WithWinget "Rustlang.Rustup"
    Update-SessionPath
}

if (Test-Command "node") { Write-Ok "Node ($(& node -v))" } else {
    Write-Step "Instalando Node.js LTS"
    Install-WithWinget "OpenJS.NodeJS.LTS"
    Update-SessionPath
}

foreach ($cmd in "cargo", "node") {
    if (-not (Test-Command $cmd)) { throw "$cmd ainda nao esta no PATH. Abra um novo terminal e rode o script de novo." }
}

Write-Step "Instalando dependencias do frontend"
Push-Location $root
try {
    # npm.cmd evita o shim npm.ps1 (bloqueado por ExecutionPolicy em algumas maquinas)
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }
} finally { Pop-Location }

Write-Host "`nPronto! Para abrir o app:  npm run tauri dev" -ForegroundColor Green
