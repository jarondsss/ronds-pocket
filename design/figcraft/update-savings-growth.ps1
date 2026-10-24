$ErrorActionPreference = 'Stop'
$rondsFile = Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$rondsCli = 'C:/Program Files/FigCraft/figcraft-cli.exe'
function Read-Design {
  $zip = [IO.Compression.ZipFile]::OpenRead($rondsFile)
  try { $r = [IO.StreamReader]::new($zip.GetEntry('document.json').Open()); try { return ($r.ReadToEnd() | ConvertFrom-Json -Depth 100) } finally { $r.Dispose() } } finally { $zip.Dispose() }
}
function Batch($commands, $name) {
  $path = Join-Path $PSScriptRoot $name
  ConvertTo-Json -InputObject @($commands) -Depth 30 | Set-Content -LiteralPath $path -Encoding utf8
  $result = & $rondsCli run $path --in $rondsFile --out $rondsFile
  if ($LASTEXITCODE -ne 0) { throw ($result -join "`n") }
  foreach ($line in $result) { try { $item = $line | ConvertFrom-Json } catch { continue }; if ($item.error -or $item.ok -eq $false) { throw $line } }
}
$commands = [Collections.Generic.List[object]]::new()
function Cmd($command, $params) { $commands.Add(@{command=$command;params=$params}) }
function Text($parent,$name,$value,$size,$role,$weight='Regular') {
  Cmd 'node.create' @{type='text';parent=$parent;name=$name;text=$value;width=302;height=20;select=$false;props=@{fontFamily='Plus Jakarta Sans';fontStyle=$weight;fontSize=$size;lineHeight='145%';textAutoResize='height';fill=$role;sizingV='hug'}}
}
$doc = Read-Design
if (@($doc.nodes.PSObject.Properties.Value | Where-Object name -eq 'Viewport · tabungan').Count -gt 0) { throw 'Revisi pertumbuhan sudah dibuat; edit layer yang ada.' }
Cmd 'node.create' @{type='frame';parent=664;index=0;name='Viewport · tabungan';width=390;height=720;select=$false;props=@{layout='vertical';gap=0;padding=0;fill='transparent';clip=$true;overflow='vertical';sizingH='fixed';sizingV='fixed'}}
Cmd 'node.set' @{id=678;gap=8;sizingV='hug'}
Cmd 'node.set' @{id=681;characters='Potensi bunga setahun';fontSize=12}
Text 678 'Potensi bunga · tahunan' '+Rp337.500 / tahun' 18 '#147557' 'Bold'
Text 678 'Proyeksi saldo · total' 'Estimasi setahun lagi Rp12.637.500' 12 '#696378'
foreach ($id in @(685,694)) { Cmd 'node.set' @{id=$id;gap=10;sizingV='hug'} }
Cmd 'node.set' @{id=693;characters='Setoran rutin bulanan';fontSize=12}
Text 685 'Bunga tahunan · reksa dana' '4,5% / tahun · estimasi' 13 '#147557' 'SemiBold'
Text 685 'Pertambahan · reksa dana' '+Rp337.500 dalam setahun' 12 '#696378'
Text 685 'Proyeksi · reksa dana' 'Setahun lagi Rp7.837.500' 12 '#242034' 'SemiBold'
Cmd 'node.set' @{id=702;characters='Catatan nilai aset';fontSize=12}
Text 694 'Bunga tahunan · emas' '0% / tahun · tanpa bunga' 13 '#696378' 'SemiBold'
Text 694 'Proyeksi · emas' 'Setahun lagi Rp4.800.000' 12 '#242034' 'SemiBold'
Cmd 'node.set' @{id=703;characters='Proyeksi memakai saldo saat ini dan persentase tahunan yang kamu isi, tanpa setoran atau penarikan baru.'}
Batch $commands 'savings-growth-phase1.json'
$doc = Read-Design
$viewport = $doc.nodes.PSObject.Properties.Value | Where-Object name -eq 'Viewport · tabungan' | Select-Object -First 1
$commands = [Collections.Generic.List[object]]::new()
Cmd 'node.reparent' @{ids=@(665);parent=$viewport.id;index=0}
Cmd 'node.set' @{id=665;sizingV='hug';paddingBottom=32}
$roles = @{'Potensi bunga · tahunan'='income';'Proyeksi saldo · total'='muted';'Bunga tahunan · reksa dana'='income';'Pertambahan · reksa dana'='muted';'Proyeksi · reksa dana'='text';'Bunga tahunan · emas'='muted';'Proyeksi · emas'='text'}
foreach ($node in $doc.nodes.PSObject.Properties.Value) {
  if ($roles.ContainsKey($node.name)) { Cmd 'variable.bind' @{ids=@($node.id);field='fill';variable=('Light/'+$roles[$node.name])} }
}
Cmd 'page.select' @{id=97}
Batch $commands 'savings-growth-phase2.json'
& $rondsCli export $rondsFile -o (Join-Path $PSScriptRoot 'tabungan-bertumbuh.png') --node 664 --scale 2
& $rondsCli export $rondsFile -o (Join-Path $PSScriptRoot 'tabungan-bertumbuh-konten.png') --node 665 --scale 2
if ($LASTEXITCODE -ne 0) { throw 'Export gagal.' }
