$ErrorActionPreference = 'Stop'
$rondsFile = Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$rondsCli = 'C:/Program Files/FigCraft/figcraft-cli.exe'
function Read-Design {
  $z=[IO.Compression.ZipFile]::OpenRead($rondsFile)
  try {$r=[IO.StreamReader]::new($z.GetEntry('document.json').Open()); try{return($r.ReadToEnd()|ConvertFrom-Json -Depth 100)} finally{$r.Dispose()}} finally{$z.Dispose()}
}
function Find($name) { return ($script:doc.nodes.PSObject.Properties.Value | Where-Object name -eq $name | Select-Object -First 1).id }
function Cmd($command,$params) {$script:commands.Add(@{command=$command;params=$params})}
function Batch($name) {
  $path=Join-Path $PSScriptRoot $name
  ConvertTo-Json -InputObject @($script:commands) -Depth 40|Set-Content -LiteralPath $path -Encoding utf8
  $out=& $rondsCli run $path --in $rondsFile --out $rondsFile
  if($LASTEXITCODE -ne 0){throw($out -join "`n")}
  foreach($line in $out){try{$item=$line|ConvertFrom-Json}catch{continue};if($item.error -or $item.ok -eq $false){throw $line}}
  $script:doc=Read-Design
  $script:commands=[Collections.Generic.List[object]]::new()
}
function Txt($parent,$name,$text,$width,$size,$weight,$role) {
  Cmd 'node.create' @{type='text';parent=$parent;name=$name;text=$text;width=$width;height=20;select=$false;props=@{fontFamily='Plus Jakarta Sans';fontStyle=$weight;fontSize=$size;lineHeight='145%';textAutoResize='height';fill=$role;sizingV='hug'}}
}
$doc=Read-Design
if(Find 'Profil · Dukungan'){throw 'Menu dukungan sudah ada; edit layer yang tersedia.'}
$commands=[Collections.Generic.List[object]]::new()
Cmd 'node.create' @{type='frame';parent=960;index=0;name='Viewport · profil';width=390;height=720;select=$false;props=@{layout='vertical';padding=0;gap=0;fill='transparent';clip=$true;overflow='vertical';sizingV='fixed'}}
Txt 961 'Profil · Judul dukungan' 'Dukungan' 342 14 'Bold' '#242034'
$card=$doc.nodes.PSObject.Properties['983'].Value
Cmd 'node.create' @{type='frame';parent=961;name='Profil · Dukungan';width=342;height=153;select=$false;props=@{layout='vertical';gap=0;padding=@(8,20,8,20);fill='#FFFFFF';cornerRadius=24;sizingV='hug';effects=$card.effects}}
Batch 'profile-support-phase1.json'
Cmd 'node.reparent' @{ids=@(961);parent=(Find 'Viewport · profil');index=0}
Cmd 'node.set' @{id=961;sizingV='hug';paddingBottom=32}
Cmd 'node.reorder' @{id=(Find 'Profil · Judul dukungan');index=5}
Cmd 'node.reorder' @{id=(Find 'Profil · Dukungan');index=6}
Cmd 'variable.bind' @{ids=@((Find 'Profil · Dukungan'));field='fill';variable='Light/surface'}
Cmd 'variable.bind' @{ids=@((Find 'Profil · Judul dukungan'));field='fill';variable='Light/text'}
foreach($label in @('Feedback','Donasi')) {
  Cmd 'node.create' @{type='frame';parent=(Find 'Profil · Dukungan');name=('Profil · '+$label);width=302;height=64;select=$false;props=@{layout='horizontal';padding=0;gap=12;crossAlign='center';sizingV='fixed';fill='transparent'}}
  if($label -eq 'Feedback'){Cmd 'node.create' @{type='rectangle';parent=(Find 'Profil · Dukungan');name='Profil · Pemisah dukungan';width=302;height=1;select=$false;props=@{fill='#DFDCEB'}}}
}
Batch 'profile-support-phase2.json'
foreach($label in @('Feedback','Donasi')) {
  $parent=Find ('Profil · '+$label)
  $path=if($label -eq 'Feedback'){'M3 3 H21 V17 H10 L5 21 V17 H3 Z M7 7 H17 M7 11 H14'}else{'M12 21 L3.8 13 C-2 6 6 -1 12 6 C18 -1 26 6 20.2 13 Z'}
  Cmd 'node.create' @{type='vector';parent=$parent;name=('Profil · Ikon '+$label);path=$path;width=20;height=20;select=$false;props=@{fill='transparent';stroke='#6251D9';strokeWeight=1.6;strokeCap='round';strokeJoin='round';sizingH='fixed';sizingV='fixed'}}
  Cmd 'node.create' @{type='frame';parent=$parent;name=('Profil · Salinan '+$label);width=242;height=42;select=$false;props=@{layout='vertical';padding=0;gap=3;fill='transparent';sizingV='hug'}}
  Cmd 'node.create' @{type='vector';parent=$parent;name=('Profil · Panah '+$label);path='M6 3 L12 9 L6 15';width=16;height=16;select=$false;props=@{fill='transparent';stroke='#696378';strokeWeight=1.6;strokeCap='round';strokeJoin='round'}}
}
Batch 'profile-support-phase3.json'
foreach($label in @('Feedback','Donasi')) {
  $parent=Find ('Profil · Salinan '+$label)
  $title=if($label -eq 'Feedback'){'Kirim masukan'}else{'Donasi'}
  $description=if($label -eq 'Feedback'){'Bantu kami memperbaiki Ronds Pocket'}else{'Dukung pengembangan lewat QRIS'}
  Txt $parent ('Profil · Label '+$label) $title 242 13 'SemiBold' '#242034'
  Txt $parent ('Profil · Deskripsi '+$label) $description 242 10 'Regular' '#696378'
  Cmd 'variable.bind' @{ids=@((Find ('Profil · Ikon '+$label)));field='stroke';variable='Light/primary'}
  Cmd 'variable.bind' @{ids=@((Find ('Profil · Panah '+$label)));field='stroke';variable='Light/muted'}
}
Cmd 'variable.bind' @{ids=@((Find 'Profil · Pemisah dukungan'));field='fill';variable='Light/border'}
Batch 'profile-support-phase4.json'
foreach($label in @('Feedback','Donasi')) {
  Cmd 'variable.bind' @{ids=@((Find ('Profil · Label '+$label)));field='fill';variable='Light/text'}
  Cmd 'variable.bind' @{ids=@((Find ('Profil · Deskripsi '+$label)));field='fill';variable='Light/muted'}
}
Cmd 'page.select' @{id=97}
Batch 'profile-support-phase5.json'
& $rondsCli export $rondsFile -o (Join-Path $PSScriptRoot 'profil-dukungan.png') --node 960 --scale 2
if($LASTEXITCODE -ne 0){throw 'Export gagal'}
