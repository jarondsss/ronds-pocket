$ErrorActionPreference='Stop'
$file=Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$cli='C:/Program Files/FigCraft/figcraft-cli.exe'
function Read-Design{$z=[IO.Compression.ZipFile]::OpenRead($file);try{$r=[IO.StreamReader]::new($z.GetEntry('document.json').Open());try{return($r.ReadToEnd()|ConvertFrom-Json -Depth 100)}finally{$r.Dispose()}}finally{$z.Dispose()}}
function Id($name){return($script:doc.nodes.PSObject.Properties.Value|Where-Object name -eq $name|Select-Object -First 1).id}
function V($name){return($script:doc.variables.variables|Where-Object name -eq $name|Select-Object -First 1).id}
function Cmd($command,$params){$script:commands.Add(@{command=$command;params=$params})}
function Batch($name){
  $path=Join-Path $PSScriptRoot $name
  ConvertTo-Json -InputObject @($script:commands) -Depth 40|Set-Content -LiteralPath $path -Encoding utf8
  $out=& $cli run $path --in $file --out $file
  if($LASTEXITCODE -ne 0){throw($out -join "`n")}
  foreach($line in $out){try{$item=$line|ConvertFrom-Json}catch{continue};if($item.error -or $item.ok -eq $false){throw $line}}
  $script:doc=Read-Design;$script:commands=[Collections.Generic.List[object]]::new()
}
$doc=Read-Design;$commands=[Collections.Generic.List[object]]::new()
foreach($entry in @(@('Tema pilihan','Sistem'),@('Kantong pilihan','Keluarga'),@('Suasana','Suka'))){
  if(-not(V $entry[0])){Cmd 'variable.create' @{collection='Profil Prototype';name=$entry[0];type='string';value=$entry[1]}}
}
Batch 'profile-modal-polish-variables.json'
foreach($key in @('Sistem','Terang','Gelap')){
  $id=Id ('Modal Profil/Tema/'+$key)
  Cmd 'proto.interaction.clear' @{ids=@($id)}
  Cmd 'proto.interaction.add' @{id=$id;action=@{type='setVariable';variable=(V 'Tema pilihan');value=$key}}
  Cmd 'node.set' @{id=(Id ('Modal Profil/Tema/'+$key+'/State'));characters='○'}
}
foreach($key in @('Keluarga','Pribadi')){
  $id=Id ('Modal Profil/Kantong/'+$key)
  Cmd 'proto.interaction.clear' @{ids=@($id)}
  Cmd 'proto.interaction.add' @{id=$id;action=@{type='setVariable';variable=(V 'Kantong pilihan');value=$key}}
  Cmd 'node.set' @{id=(Id ('Modal Profil/Kantong/'+$key+'/State'));characters='○'}
}
foreach($pair in @(@('Tema','Tema pilihan'),@('Kantong','Kantong pilihan'))){
  Cmd 'variable.bind' @{ids=@((Id ('Modal Profil/'+$pair[0]+'/Catatan')));field='characters';variable=(V $pair[1])}
  Cmd 'proto.interaction.clear' @{ids=@((Id ('Modal Profil/'+$pair[0]+'/Simpan')))}
  Cmd 'proto.interaction.add' @{id=(Id ('Modal Profil/'+$pair[0]+'/Simpan'));actions=@(@{type='setVariable';variable=(V $pair[0]);expression=$pair[1]},@{type='swapOverlay';dest=(Id 'Modal Profil/Simpan sukses')})}
}
foreach($entry in @(@(976,'Avatar','Avatar brouillon','Avatar'),@(991,'Tema','Tema pilihan','Tema'),@(998,'Kantong','Kantong pilihan','Kantong'))){
  Cmd 'proto.interaction.clear' @{ids=@($entry[0])}
  Cmd 'proto.interaction.add' @{id=$entry[0];actions=@(@{type='setVariable';variable=(V $entry[2]);expression=$entry[3]},@{type='openOverlay';dest=(Id ('Modal Profil/'+$entry[1]));position='center';close_on_outside=$true;background='#24203466'})}
}
foreach($key in @('Suka','Lumayan','Masalah')){
  Cmd 'proto.interaction.add' @{id=(Id ('Modal Profil/Feedback/Suasana/'+$key));action=@{type='setVariable';variable=(V 'Suasana');value=$(if($key -eq 'Masalah'){'Ada masalah'}else{$key})}}
  Cmd 'variable.bind' @{ids=@((Id ('Modal Profil/Feedback/Suasana/'+$key)));field='fill';variable='Light/inset'}
}
Cmd 'variable.bind' @{ids=@((Id 'Modal Profil/Feedback/MoodLabel'));field='characters';variable=(V 'Suasana')}
Cmd 'node.set' @{id=(Id 'Modal Profil/Avatar/Pratinjau/Label');textAlign='center'}
foreach($tree in $doc.nodes.PSObject.Properties.Value|Where-Object {$_.name -like 'Modal Profil/Fitur/*/State'}){Cmd 'node.set' @{id=$tree.id;characters='›';fontSize=18;textAlign='right'}}
foreach($id in @(984,991,998,1005)){Cmd 'node.set' @{id=$id;height=44;sizingV='fixed'}}
# The remaining menu stays a navigation list; its recurring entry opens the existing feature hub.
Cmd 'node.set' @{id=(Id 'Modal Profil/Fitur/Transaksi berulang/Label');characters='Fitur lainnya'}
Cmd 'node.set' @{id=(Id 'Modal Profil/Feedback/Pesan/Input');mainAlign='min'}
Cmd 'node.set' @{id=(Id 'Modal Profil/Feedback/Pesan/Input/Value');fill='#696378'}
Cmd 'variable.bind' @{ids=@((Id 'Modal Profil/Feedback/Pesan/Input/Value'));field='fill';variable='Light/muted'}
Cmd 'node.set' @{id=(Id 'Modal Profil/Feedback/Kontak/Input/Value');fill='#696378'}
Cmd 'variable.bind' @{ids=@((Id 'Modal Profil/Feedback/Kontak/Input/Value'));field='fill';variable='Light/muted'}
Cmd 'page.select' @{id=97}
Batch 'profile-modal-polish.json'
foreach($key in @('Avatar','Feedback','Donasi','Hapus','Tema','Fitur','Nama','Kantong','Bantuan','Keluar')){
  & $cli export $file -o (Join-Path $PSScriptRoot ('modal-profil-'+$key.ToLower()+'.png')) --node (Id ('Modal Profil/'+$key)) --scale 2
  if($LASTEXITCODE -ne 0){throw ('Export gagal: '+$key)}
}
& $cli export $file -o (Join-Path $PSScriptRoot 'profil-dukungan.png') --node 960 --scale 2
