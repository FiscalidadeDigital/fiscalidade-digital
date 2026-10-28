param(
  [switch]$Reactivate
)

$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot\..
try {
  if ($Reactivate.IsPresent) {
    npm.cmd run admin:recover -- --reactivate
  } else {
    npm.cmd run admin:recover
  }
} finally {
  Pop-Location
}
