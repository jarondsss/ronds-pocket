$ErrorActionPreference = 'Stop'
$rondsFile = Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$rondsBackup = Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2-before-alignment.figcraft'
$rondsCli = 'C:/Program Files/FigCraft/figcraft-cli.exe'
if (-not (Test-Path -LiteralPath $rondsBackup)) { Copy-Item -LiteralPath $rondsFile -Destination $rondsBackup }

function Read-Design {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($rondsFile)
  try {
    $reader = [System.IO.StreamReader]::new($zip.GetEntry('document.json').Open())
    try { return ($reader.ReadToEnd() | ConvertFrom-Json -Depth 100) }
    finally { $reader.Dispose() }
  } finally { $zip.Dispose() }
}
function Get-Layer($doc, $id) { return $doc.nodes.PSObject.Properties[[string]$id].Value }
function Add-Command($list, $command, $params) { $list.Add(@{command=$command;params=$params}) }
function Run-Batch($commands, $name) {
  $path = Join-Path $PSScriptRoot $name
  ConvertTo-Json -InputObject @($commands) -Depth 30 | Set-Content -LiteralPath $path -Encoding utf8
  $output = & $rondsCli run $path --in $rondsFile --out $rondsFile
  if ($LASTEXITCODE -ne 0) { throw ($output -join "`n") }
  foreach ($line in $output) {
    try { $item = $line | ConvertFrom-Json } catch { continue }
    if ($item.error -or $item.ok -eq $false) { throw $line }
  }
}

$doc = Read-Design
$commands = [System.Collections.Generic.List[object]]::new()
foreach ($gridId in @(159,261)) {
  foreach ($pillId in (Get-Layer $doc $gridId).children) {
    $pill = Get-Layer $doc $pillId
    Add-Command $commands 'node.set' @{id=$pillId;layout='horizontal';crossAlign='center';mainAlign='center';gap=6;padding=10;width=108;height=48;sizingH='fixed';sizingV='fixed'}
    foreach ($childId in $pill.children) {
      $child = Get-Layer $doc $childId
      if ($child.type -eq 'text') {
        Add-Command $commands 'node.set' @{id=$childId;fontFamily='Plus Jakarta Sans';fontStyle='SemiBold';fontSize=10;lineHeight='145%';textAutoResize='widthAndHeight'}
      }
      if ($child.type -eq 'vector' -and $child.name.StartsWith('Ikon/')) {
        Add-Command $commands 'node.create' @{type='frame';parent=$pillId;index=0;name='Slot ikon · 16px';width=16;height=16;select=$false;props=@{layout='horizontal';crossAlign='center';mainAlign='center';padding=0;gap=0;fill='transparent';sizingH='fixed';sizingV='fixed'}}
      }
    }
  }
}
Run-Batch $commands 'shortcut-alignment-phase1.json'

$doc = Read-Design
$commands = [System.Collections.Generic.List[object]]::new()
foreach ($gridId in @(159,261)) {
  foreach ($pillId in (Get-Layer $doc $gridId).children) {
    $children = @((Get-Layer $doc $pillId).children | ForEach-Object { Get-Layer $doc $_ })
    $slot = $children | Where-Object name -eq 'Slot ikon · 16px' | Select-Object -First 1
    $vector = $children | Where-Object { $_.type -eq 'vector' -and $_.name.StartsWith('Ikon/') } | Select-Object -First 1
    if ($slot -and $vector) {
      Add-Command $commands 'node.reparent' @{ids=@($vector.id);parent=$slot.id}
      Add-Command $commands 'node.set' @{id=$vector.id;width=12;height=12;strokeWeight=1.15}
    }
  }
}
Run-Batch $commands 'shortcut-alignment-phase2.json'

$doc = Read-Design
function Get-VectorIds($document, $id) {
  $layer = Get-Layer $document $id
  if ($layer.type -eq 'vector') { return $id }
  foreach ($childId in $layer.children) { Get-VectorIds $document $childId }
}
$commands = [System.Collections.Generic.List[object]]::new()
foreach ($gridId in @(159,261)) {
  foreach ($vectorId in (Get-VectorIds $doc $gridId)) {
    Add-Command $commands 'node.set' @{id=$vectorId;strokeWeight=1.4;strokeCap='round';strokeJoin='round'}
  }
}
Run-Batch $commands 'shortcut-alignment-phase3.json'

$doc = Read-Design
$alignmentResults = foreach ($gridId in @(159,261)) {
  foreach ($pillId in (Get-Layer $doc $gridId).children) {
    $pill = Get-Layer $doc $pillId
    [pscustomobject]@{id=$pillId;name=$pill.name;vertical=$pill.layout.cross_align;horizontal=$pill.layout.main_align;gap=$pill.layout.gap;size=@($pill.width,$pill.height)}
  }
}
$alignmentResults | ConvertTo-Json -Depth 5
