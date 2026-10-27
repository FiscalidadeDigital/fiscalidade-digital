param(
  [switch]$Reactivate
)

$ErrorActionPreference = 'Stop'

function Set-RecoveryEnvironmentVariable {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [AllowNull()]
    [string]$Value
  )

  if ($null -eq $Value) {
    Remove-Item -Path "Env:$Name" -ErrorAction SilentlyContinue
  } else {
    Set-Item -Path "Env:$Name" -Value $Value
  }
}

$environmentNames = @(
  'ADMIN_RECOVERY_EMAIL',
  'ADMIN_RECOVERY_PASSWORD',
  'ADMIN_RECOVERY_CONFIRMATION',
  'ADMIN_RECOVERY_REACTIVATE'
)
$previousEnvironment = @{}
foreach ($name in $environmentNames) {
  $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

$securePassword = $null
$plainPassword = $null

try {
  $email = Read-Host 'Email da conta administrativa existente'
  $securePassword = Read-Host 'Nova palavra-passe temporaria' -AsSecureString
  $confirmation = Read-Host 'Digite RESET_PLATFORM_ADMIN_PASSWORD para confirmar'

  $credential = [System.Management.Automation.PSCredential]::new(
    'local-recovery',
    $securePassword
  )
  $plainPassword = $credential.GetNetworkCredential().Password

  Set-RecoveryEnvironmentVariable -Name 'ADMIN_RECOVERY_EMAIL' -Value $email
  Set-RecoveryEnvironmentVariable -Name 'ADMIN_RECOVERY_PASSWORD' -Value $plainPassword
  Set-RecoveryEnvironmentVariable -Name 'ADMIN_RECOVERY_CONFIRMATION' -Value $confirmation
  Set-RecoveryEnvironmentVariable -Name 'ADMIN_RECOVERY_REACTIVATE' -Value ($Reactivate.IsPresent.ToString().ToLowerInvariant())

  Push-Location $PSScriptRoot\..
  try {
    npm.cmd run admin:recover
  } finally {
    Pop-Location
  }
} finally {
  $plainPassword = $null
  if ($securePassword) {
    $securePassword.Dispose()
  }

  foreach ($name in $environmentNames) {
    Set-RecoveryEnvironmentVariable -Name $name -Value $previousEnvironment[$name]
  }
}
