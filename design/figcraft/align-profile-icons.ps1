$ErrorActionPreference='Stop'
$rondsFile=Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$rondsCli='C:/Program Files/FigCraft/figcraft-cli.exe'
function Read-Design {
  $z=[IO.Compression.ZipFile]::OpenRead($rondsFile)
  try{$r=[IO.StreamReader]::new($z.GetEntry('document.json').Open());try{return($r.ReadToEnd()|ConvertFrom-Json -Depth 100)}finally{$r.Dispose()}}finally{$z.Dispose()}
}
function Batch($commands,$name){
  $path=Join-Path $PSScriptRoot $name
  ConvertTo-Json -InputObject @($commands) -Depth 20|Set-Content -LiteralPath $path -Encoding utf8
  $out=& $rondsCli run $path --in $rondsFile --out $rondsFile
  if($LASTEXITCODE -ne 0){throw($out -join "`n")}
  foreach($line in $out){try{$item=$line|ConvertFrom-Json}catch{continue};if($item.error -or $item.ok -eq $false){throw $line}}
}
$doc=Read-Design
$commands=[Collections.Generic.List[object]]::new()
foreach($label in @('Feedback','Donasi')){
  $row=$doc.nodes.PSObject.Properties.Value|Where-Object name -eq ('Profil · '+$label)|Select-Object -First 1
  $existing=$doc.nodes.PSObject.Properties.Value|Where-Object name -eq ('Profil · Slot ikon '+$label)|Select-Object -First 1
  if(-not $existing){$commands.Add(@{command='node.create';params=@{type='frame';parent=$row.id;index=0;name=('Profil · Slot ikon '+$label);width=20;height=20;select=$false;props=@{layout='horizontal';mainAlign='center';crossAlign='center';padding=0;gap=0;fill='transparent';sizingH='fixed';sizingV='fixed'}}})}
}
if($commands.Count){Batch $commands 'profile-icons-phase1.json'}
$doc=Read-Design
$commands=[Collections.Generic.List[object]]::new()
foreach($label in @('Feedback','Donasi')){
  $slot=$doc.nodes.PSObject.Properties.Value|Where-Object name -eq ('Profil · Slot ikon '+$label)|Select-Object -First 1
  $icon=$doc.nodes.PSObject.Properties.Value|Where-Object name -eq ('Profil · Ikon '+$label)|Select-Object -First 1
  $commands.Add(@{command='node.reparent';params=@{ids=@($icon.id);parent=$slot.id;index=0}})
  $commands.Add(@{command='node.set';params=@{id=$icon.id;width=16;height=16;strokeWeight=1.7;strokeCap='round';strokeJoin='round';sizingH='fixed';sizingV='fixed'}})
}
Batch $commands 'profile-icons-phase2.json'
& $rondsCli export $rondsFile -o (Join-Path $PSScriptRoot 'profil-dukungan.png') --node 960 --scale 2
if($LASTEXITCODE -ne 0){throw 'Export gagal'}
