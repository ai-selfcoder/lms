# Local playwasm build via Go 1.24.4: native tests -> wasm -> copy wasm_exec.js
# -> measure size. No Docker. Paths relative to this script's location.
$ErrorActionPreference = "Stop"
$env:GOTOOLCHAIN = "local"

$go = (Get-Command go -ErrorAction SilentlyContinue).Source
if (-not $go) {
  $go = (Get-ChildItem "$env:USERPROFILE\sdk\go*\bin\go.exe" -ErrorAction SilentlyContinue |
         Sort-Object FullName -Descending | Select-Object -First 1).FullName
}
if (-not $go) { throw "Go toolchain not found (PATH or ~/sdk)" }
"go: $go"

$here = $PSScriptRoot
Push-Location $here
try {
  & $go mod tidy
  if ($LASTEXITCODE -ne 0) { throw "go mod tidy failed" }

  & $go test ./runner/...
  if ($LASTEXITCODE -ne 0) { throw "native tests failed" }

  $out = Join-Path $here "..\web\public\play"
  New-Item -ItemType Directory -Force -Path $out | Out-Null

  $env:GOOS = "js"; $env:GOARCH = "wasm"
  & $go build -trimpath -ldflags "-s -w" -o (Join-Path $out "play.wasm") .
  $build = $LASTEXITCODE
  Remove-Item Env:GOOS, Env:GOARCH -ErrorAction SilentlyContinue
  if ($build -ne 0) { throw "wasm build failed" }

  $root = & $go env GOROOT
  Copy-Item (Join-Path $root "lib\wasm\wasm_exec.js") (Join-Path $out "wasm_exec.js") -Force

  $wasm = Join-Path $out "play.wasm"
  $raw = (Get-Item $wasm).Length
  $ms = New-Object System.IO.MemoryStream
  $fs = [System.IO.File]::OpenRead($wasm)
  # leaveOpen=$true so closing the GzipStream flushes its trailer without
  # disposing $ms — otherwise $ms.Length reads as 0.
  $gz = New-Object System.IO.Compression.GzipStream($ms, [System.IO.Compression.CompressionLevel]::Optimal, $true)
  $fs.CopyTo($gz); $gz.Close(); $fs.Close()
  $gzip = $ms.Length
  "play.wasm raw : {0:N0} bytes ({1:N2} MB)" -f $raw, ($raw/1MB)
  "play.wasm gzip: {0:N0} bytes ({1:N2} MB)" -f $gzip, ($gzip/1MB)
} finally {
  Pop-Location
}
