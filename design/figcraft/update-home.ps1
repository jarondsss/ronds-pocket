$ErrorActionPreference = 'Stop'
$rondsCli = 'C:/Program Files/FigCraft/figcraft-cli.exe'
$rondsRoot = $PSScriptRoot
$rondsSource = Join-Path $rondsRoot 'Ronds Pocket - Mobile Refactor.figcraft'
$rondsOutput = Join-Path $rondsRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$rondsCommandFile = Join-Path $rondsRoot 'home-update-commands.json'
$script:rondsCurrent = $rondsSource

function Read-RondsDocument {
  $archive = [System.IO.Compression.ZipFile]::OpenRead($script:rondsCurrent)
  try {
    $reader = [System.IO.StreamReader]::new($archive.GetEntry('document.json').Open())
    try { return ($reader.ReadToEnd() | ConvertFrom-Json -Depth 100) }
    finally { $reader.Dispose() }
  } finally { $archive.Dispose() }
}

function Invoke-RondsBatch($commands) {
  ConvertTo-Json -InputObject @($commands) -Depth 40 | Set-Content -LiteralPath $rondsCommandFile -Encoding utf8
  $result = & $rondsCli run $rondsCommandFile --in $script:rondsCurrent --out $rondsOutput
  if ($LASTEXITCODE -ne 0) { throw "Figcraft command failed: $result" }
  foreach ($line in $result) {
    try { $entry = $line | ConvertFrom-Json } catch { continue }
    if ($entry.error -or $entry.ok -eq $false) { throw "Figcraft rejected a command: $line" }
  }
  $script:rondsCurrent = $rondsOutput
  return $result
}

function Command($id, $params) { return @{ command = $id; params = $params } }
function Frame($parent, $name, $width, $height, $direction, $gap, $padding, $fill, $radius = 16) {
  return (Command 'node.create' @{type='frame';parent=$parent;name=$name;width=$width;height=$height;select=$false;props=@{layout=$direction;gap=$gap;padding=$padding;fill=$fill;cornerRadius=$radius;sizingH='fixed';sizingV='hug';crossAlign='center'}})
}
function Text($parent, $name, $text, $width, $size, $color, $weight='Regular') {
  return (Command 'node.create' @{type='text';parent=$parent;name=$name;text=$text;width=$width;select=$false;props=@{fontFamily='Plus Jakarta Sans';fontStyle=$weight;fontSize=$size;lineHeight='145%';fill=$color;textAutoResize='height'}})
}
function Node($document, $id) { return $document.nodes.PSObject.Properties[[string]$id].Value }
function Child($document, $parent, $name) {
  foreach ($id in (Node $document $parent).children) {
    $node = Node $document $id
    if ($node.name -eq $name) { return $node }
  }
  throw "Child '$name' not found under $parent"
}

$themes = @(
  @{Root=98;Body=99;Summary=112;Day=115;DayText=116;Calendar=117;Features=159;Title=137;Income=124;Expense=127;Theme='Light';Surface='#FFFFFF';Inset='#ECEAF5';Text='#242034';Muted='#696378';Primary='#6251D9';ExpenseColor='#B1404F'},
  @{Root=200;Body=201;Summary=214;Day=217;DayText=218;Calendar=219;Features=261;Title=239;Income=226;Expense=229;Theme='Dark';Surface='#242233';Inset='#2F2C40';Text='#F6F4FF';Muted='#BAB4CD';Primary='#B5A8FF';ExpenseColor='#FF9FAB'}
)

$document = Read-RondsDocument
$commands = [System.Collections.Generic.List[object]]::new()
foreach ($theme in $themes) {
  $commands.Add((Command 'page.select' @{id=97}))
  $commands.Add((Frame $theme.Root 'Viewport · beranda harian' 390 720 'vertical' 0 0 'transparent' 0))
  $commands.Add((Command 'node.set' @{id=$theme.Day;name='Pemilih hari';height=44;gap=8;sizingV='fixed'}))
  $commands.Add((Command 'node.set' @{id=$theme.Calendar;visible=$false}))
  $commands.Add((Command 'node.set' @{id=$theme.DayText;name='Tanggal dipilih';characters='Hari ini · 24 Okt 2026';width=198;fontSize=12;textAlign='center'}))
  $commands.Add((Frame $theme.Day 'Hari sebelumnya' 44 44 'horizontal' 0 10 $theme.Inset))
  $commands.Add((Frame $theme.Day 'Hari berikutnya · nonaktif hari ini' 44 44 'horizontal' 0 10 $theme.Inset))
  $commands.Add((Command 'node.set' @{id=$theme.Income;characters='Rp0'}))
  $commands.Add((Command 'node.set' @{id=$theme.Expense;characters='Rp63.000'}))
  foreach ($pair in @(@('Pemasukan','Masuk hari ini'),@('Pengeluaran','Keluar hari ini'))) {
    $group = Child $document $theme.Summary 'Arus uang bulan ini'
    $stat = Child $document $group.id $pair[0]
    $label = Child $document $stat.id $pair[0]
    $commands.Add((Command 'node.set' @{id=$label.id;characters=$pair[1]}))
    $commands.Add((Command 'node.set' @{id=$group.id;name='Arus uang hari dipilih'}))
  }
  $title = Child $document $theme.Title 'Catatan terbaru'
  $commands.Add((Command 'node.set' @{id=$title.id;characters='Transaksi hari ini';name='Judul transaksi harian'}))
  $commands.Add((Command 'node.set' @{id=$theme.Features;wrap=$true;gap=8;crossGap=8;sizingV='hug'}))
  $commands.Add((Command 'node.reorder' @{id=$theme.Features;index=3}))
  foreach ($id in (Node $document $theme.Features).children) {
    $commands.Add((Command 'node.set' @{id=$id;width=108.6667;height=48;sizingV='fixed';gap=6;padding=10;mainAlign='center'}))
  }
  foreach ($label in @('Tabungan','Berulang','Rekap')) {
    $commands.Add((Frame $theme.Features ('Pintasan/'+$label) 108.6667 48 'horizontal' 6 10 $theme.Surface))
  }
  $commands.Add((Frame $theme.Body 'Transaksi berulang · ringkasan' 342 180 'vertical' 12 20 $theme.Surface 24))
}
Invoke-RondsBatch $commands | Set-Content -LiteralPath (Join-Path $rondsRoot 'home-update-phase1.jsonl') -Encoding utf8

$document = Read-RondsDocument
$commands = [System.Collections.Generic.List[object]]::new()
foreach ($theme in $themes) {
  $viewport = Child $document $theme.Root 'Viewport · beranda harian'
  $previous = Child $document $theme.Day 'Hari sebelumnya'
  $next = Child $document $theme.Day 'Hari berikutnya · nonaktif hari ini'
  $recurring = Child $document $theme.Body 'Transaksi berulang · ringkasan'
  $commands.Add((Command 'node.set' @{id=$viewport.id;height=720;sizingV='fixed';clip=$true;overflow='vertical'}))
  $commands.Add((Command 'node.reparent' @{ids=@($theme.Body);parent=$viewport.id;index=0}))
  $commands.Add((Command 'node.reorder' @{id=$viewport.id;index=0}))
  $commands.Add((Command 'node.set' @{id=$theme.Body;sizingV='hug';paddingBottom=32}))
  $commands.Add((Command 'node.set' @{id=$previous.id;height=44;sizingV='fixed';mainAlign='center'}))
  $commands.Add((Command 'node.set' @{id=$next.id;height=44;sizingV='fixed';mainAlign='center';opacity=0.45}))
  $commands.Add((Command 'node.reorder' @{id=$previous.id;index=0}))
  $commands.Add((Text $previous.id 'Ikon sebelumnya' '‹' 24 28 $theme.Primary 'Medium'))
  $commands.Add((Text $next.id 'Ikon berikutnya' '›' 24 28 $theme.Muted 'Medium'))
  foreach ($label in @('Tabungan','Berulang','Rekap')) {
    $pill = Child $document $theme.Features ('Pintasan/'+$label)
    $commands.Add((Command 'node.set' @{id=$pill.id;height=48;sizingV='fixed';mainAlign='center'}))
    $commands.Add((Command 'variable.bind' @{ids=@($pill.id);field='fill';variable=($theme.Theme+'/surface')}))
    $commands.Add((Text $pill.id ('Label/'+$label) $label 76 11 $theme.Text 'SemiBold'))
    $commands.Add((Command 'proto.interaction.clear' @{ids=@($pill.id)}))
    if ($label -eq 'Tabungan') { $commands.Add((Command 'proto.interaction.add' @{id=$pill.id;dest=664})) }
    if ($label -eq 'Rekap') { $commands.Add((Command 'proto.interaction.add' @{id=$pill.id;dest=729})) }
    if ($label -eq 'Berulang') { $commands.Add((Command 'proto.interaction.add' @{id=$pill.id;action=@{type='scrollTo';dest=$recurring.id}})) }
  }
  $commands.Add((Command 'node.set' @{id=$recurring.id;crossAlign='min';sizingV='hug'}))
  $commands.Add((Command 'variable.bind' @{ids=@($recurring.id);field='fill';variable=($theme.Theme+'/surface')}))
  $commands.Add((Text $recurring.id 'Judul berulang' 'Transaksi berulang' 302 17 $theme.Text 'Bold'))
  $commands.Add((Text $recurring.id 'Jumlah jadwal' '2 jadwal aktif · berjalan otomatis' 302 11 $theme.Muted))
  $commands.Add((Text $recurring.id 'Jadwal listrik' 'Listrik rumah · Rp280.000' 302 13 $theme.Text 'SemiBold'))
  $commands.Add((Text $recurring.id 'Periode listrik' 'Bulanan · berikutnya 28 Oktober' 302 11 $theme.Muted))
  $commands.Add((Text $recurring.id 'Jadwal gaji' 'Gaji · Rp8.500.000' 302 13 $theme.Text 'SemiBold'))
  $commands.Add((Text $recurring.id 'Periode gaji' 'Bulanan · berikutnya 25 Oktober' 302 11 $theme.Muted))
}
Invoke-RondsBatch $commands | Set-Content -LiteralPath (Join-Path $rondsRoot 'home-update-phase2.jsonl') -Encoding utf8

$document = Read-RondsDocument
$commands = [System.Collections.Generic.List[object]]::new()
foreach ($theme in $themes) {
  $commands.Add((Command 'node.set' @{id=$theme.Body;fill=$(if ($theme.Theme -eq 'Light') {'#F4F3FA'} else {'#181724'})}))
  $commands.Add((Command 'variable.bind' @{ids=@($theme.Body);field='fill';variable=($theme.Theme+'/background')}))
  foreach ($id in (Node $document $theme.Features).children) {
    $commands.Add((Command 'node.set' @{id=$id;width=108}))
  }
  $partner = Child $document $theme.Features 'Partner'
  $tabungan = Child $document $theme.Features 'Pintasan/Tabungan'
  $berulang = Child $document $theme.Features 'Pintasan/Berulang'
  $rekap = Child $document $theme.Features 'Pintasan/Rekap'
  $commands.Add((Command 'node.reorder' @{id=$tabungan.id;index=2}))
  $commands.Add((Command 'node.reorder' @{id=$berulang.id;index=3}))
  $commands.Add((Command 'node.reorder' @{id=$rekap.id;index=4}))
  $commands.Add((Command 'node.reorder' @{id=$partner.id;index=5}))
  foreach ($item in @(
    @('Tabungan','M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v11H5a3 3 0 0 1-3-3V6 M21 12h-5v5h5'),
    @('Berulang','M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3'),
    @('Rekap','M4 3v18h17 M8 16v-5 M13 16V7 M18 16V8')
  )) {
    $pill = Child $document $theme.Features ('Pintasan/'+$item[0])
    $text = Child $document $pill.id ('Label/'+$item[0])
    $commands.Add((Command 'node.set' @{id=$text.id;width=60;fontSize=10}))
    $commands.Add((Command 'node.create' @{type='vector';parent=$pill.id;index=0;name=('Ikon/'+$item[0]);width=16;height=16;path=$item[1];select=$false;props=@{fill='transparent';stroke=$theme.Primary;strokeWeight=1.5;strokeCap='round';strokeJoin='round'}}))
  }
}
Invoke-RondsBatch $commands | Set-Content -LiteralPath (Join-Path $rondsRoot 'home-update-phase3.jsonl') -Encoding utf8

$document = Read-RondsDocument
$result = foreach ($theme in $themes) {
  $body = Node $document $theme.Body
  $features = Node $document $theme.Features
  [pscustomobject]@{Theme=$theme.Theme;Root=$theme.Root;Content=$theme.Body;FeatureCount=$features.children.Count;ContentHeight=$body.height;Viewport=(Child $document $theme.Root 'Viewport · beranda harian').id}
}
$result | ConvertTo-Json -Depth 6
