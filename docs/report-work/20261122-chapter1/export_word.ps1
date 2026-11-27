$ErrorActionPreference='Stop'
$inputPath=Join-Path $PSScriptRoot 'LUANVAN_updated.docx'
$outDir=Join-Path $PSScriptRoot 'qa'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$word=New-Object -ComObject Word.Application
$word.Visible=$false
$word.DisplayAlerts=0
$word.AutomationSecurity=3
$doc=$null
try {
  $doc=$word.Documents.Open($inputPath,$false,$true,$false)
  $doc.Repaginate()
  $doc.Bookmarks.ShowHidden=$true
  $pageMap=@{}
  foreach ($bm in $doc.Bookmarks) {
    if ($bm.Name -like 'nc_*' -or $bm.Name -like '_Toc*' -or $bm.Name -like '_w*') {
      $pageMap[$bm.Name]=$bm.Range.Information(3)
    }
  }
  $pageMap | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $outDir 'page-map.json') -Encoding UTF8
  $doc.ExportAsFixedFormat((Join-Path $outDir 'revised.pdf'),17)
  Write-Output ('Exported pages: '+$doc.ComputeStatistics(2))
} finally {
  if ($null -ne $doc) {try {$doc.Close(0)} catch {};[void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc)}
  try {$word.Quit(0)} catch {}
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}
