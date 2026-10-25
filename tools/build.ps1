[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$QolSource,
    [Parameter(Mandatory=$true)][string]$CsdkPath,
    [Parameter(Mandatory=$true)][string]$Out,
    [string]$Profile
)
$ErrorActionPreference = 'Stop'
$Project = Split-Path $PSScriptRoot -Parent
if (-not $Profile) { $Profile = Join-Path $Project 'profiles\default.json' }
$QolSource = (Resolve-Path -LiteralPath $QolSource).Path
$CsdkPath = (Resolve-Path -LiteralPath $CsdkPath).Path
$Profile = (Resolve-Path -LiteralPath $Profile).Path
$Out = [System.IO.Path]::GetFullPath($Out)
if (Test-Path -LiteralPath $Out) { throw 'Out must be a new directory. Existing files are never overwritten.' }
$Compiler = Join-Path $CsdkPath 'game\bin_cs2\win64\resourcecompiler.exe'
$Packer = Join-Path $CsdkPath 'game\bin\win64\CSDKCfgVPK.exe'
if (-not (Test-Path -LiteralPath $Compiler) -or -not (Test-Path -LiteralPath $Packer)) {
    throw 'CSDK compiler/packer not found. Pass the actual CSDK root (not its parent folder).'
}
foreach ($File in @('build_mod.ps1','build_mod_helpers.ps1')) {
    if (-not (Test-Path -LiteralPath (Join-Path $QolSource ('build_mod\'+$File)))) { throw "Missing QoL builder: $File" }
}
$null = Get-Command node -ErrorAction Stop
$Source = Join-Path $Out 'source'
& node (Join-Path $PSScriptRoot 'stage.cjs') --qol $QolSource --out $Source --profile $Profile
if ($LASTEXITCODE -ne 0) { throw 'Source staging failed.' }
# Use isolated copies: do not modify the upstream builder config or game addons.
$BuilderRoot = Join-Path $Out 'build_tools'
$null = New-Item -ItemType Directory -Path (Join-Path $BuilderRoot 'data')
foreach ($File in @('build_mod.ps1','build_mod_helpers.ps1')) {
    Copy-Item -LiteralPath (Join-Path $QolSource ('build_mod\'+$File)) -Destination (Join-Path $BuilderRoot $File)
}
@{CsdkPath=$CsdkPath} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $BuilderRoot 'data\config.json') -Encoding UTF8
$Vpk = Join-Path $Out 'qol_rank_advisor.vpk'
& (Join-Path $BuilderRoot 'build_mod.ps1') -Batch -ModFolderName 'qol_rank_advisor' -SourcePath $Source -OutputPath $Vpk
Write-Host 'Build command finished. Inspect the builder result above and the generated VPK bundle in:'
Write-Host $Out
Write-Host 'Install this integrated bundle instead of the original QoL. Game installation is not modified by this wrapper.'
