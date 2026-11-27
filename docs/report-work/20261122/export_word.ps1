$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$config = Get-Content -LiteralPath (Join-Path $taskRoot 'preservation-check.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$qaDir = Join-Path $taskRoot 'qa'
New-Item -ItemType Directory -Path $qaDir -Force | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.AutomationSecurity = 3
$results = @()
try {
  foreach ($item in @(@{ input=$config.output; name='revised' })) {
    $doc = $null
    try {
      $doc = $word.Documents.Open($item.input, $false, $true, $false)
      $doc.Repaginate()
      $pdf = Join-Path $qaDir ($item.name + '.pdf')
      $doc.ExportAsFixedFormat($pdf, 17)
      $results += @{ name=$item.name; pages=$doc.ComputeStatistics(2); pdf=$pdf }
      Write-Output ($item.name + ' exported')
    } finally {
      if ($null -ne $doc) { try { $doc.Close(0) } catch { Write-Output $_.Exception.Message }; [void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc) }
    }
  }
} finally {
  try { $word.Quit(0) } catch { Write-Output $_.Exception.Message }
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}
$results | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $qaDir 'word-render.json') -Encoding UTF8
