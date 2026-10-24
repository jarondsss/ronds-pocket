$ErrorActionPreference='Stop'
$file=Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$cli='C:/Program Files/FigCraft/figcraft-cli.exe'
function Read-Design{$z=[IO.Compression.ZipFile]::OpenRead($file);try{$r=[IO.StreamReader]::new($z.GetEntry('document.json').Open());try{return($r.ReadToEnd()|ConvertFrom-Json -Depth 100)}finally{$r.Dispose()}}finally{$z.Dispose()}}
function Id($name){return($script:doc.nodes.PSObject.Properties.Value|Where-Object name -eq $name|Select-Object -First 1).id}
function V($name){return($script:doc.variables.variables|Where-Object name -eq $name|Select-Object -First 1).id}
function Cmd($command,$params){$script:commands.Add(@{command=$command;params=$params})}
function Batch($name){
  $path=Join-Path $PSScriptRoot $name
  ConvertTo-Json -InputObject @($script:commands) -Depth 50|Set-Content -LiteralPath $path -Encoding utf8
  $out=& $cli run $path --in $file --out $file
  if($LASTEXITCODE -ne 0){throw($out -join "`n")}
  foreach($line in $out){try{$item=$line|ConvertFrom-Json}catch{continue};if($item.error -or $item.ok -eq $false){throw $line}}
  $script:doc=Read-Design;$script:commands=[Collections.Generic.List[object]]::new()
}
$doc=Read-Design;$commands=[Collections.Generic.List[object]]::new()
Cmd 'variable.create' @{collection='Profil Prototype';name='Pribadi tersedia';type='boolean';value=$true}
Cmd 'variable.create' @{collection='Profil Prototype';name='Peran kantong';type='string';value='Pemilik'}
Batch 'pocket-management-polish-variables.json'
Cmd 'variable.bind' @{ids=@((Id 'Modal Profil/Kantong/Pribadi'));field='visible';variable=(V 'Pribadi tersedia')}
Cmd 'node.set' @{id=(Id 'Kantong/Hapus sukses/Deskripsi');characters='Semua catatan di dalamnya juga sudah terhapus. Kantong yang tersisa sekarang aktif.'}
Cmd 'node.set' @{id=(Id 'Kantong/Satu kantong/Deskripsi');characters='Satu-satunya kantong yang tersisa.'}
Cmd 'node.create' @{type='text';parent=(Id 'Kantong/Satu kantong');index=2;name='Kantong/Satu kantong/Nama';text='Pribadi';width=294;height=24;select=$false;props=@{fontFamily='Plus Jakarta Sans';fontStyle='Bold';fontSize=16;lineHeight='145%';textAutoResize='height';fill='#242034'}}
Cmd 'node.set' @{id=(Id 'Kantong/Kelola Pribadi/Deskripsi');characters='Pribadi · kantong pribadi'}
Cmd 'node.set' @{id=(Id 'Kantong/Kelola Keluarga/Anggota/Rani/Penanda');characters=''}
foreach($member in @('Dimas','Sinta')){
  Cmd 'node.set' @{id=(Id ('Kantong/Kelola Keluarga/Anggota/'+$member+'/Keluarkan'));width=64}
  Cmd 'node.set' @{id=(Id ('Kantong/Kelola Keluarga/Anggota/'+$member+'/Keluarkan/Label'));characters='Keluarkan';width=64;fontSize=10}
}
foreach($key in @('Keluarga','Pribadi')){
  $trigger=Id ('Kantong/Kelola '+$key+' trigger')
  Cmd 'proto.interaction.clear' @{ids=@($trigger)}
  $ownerAction=@{type='conditional';blocks=@(@{expression='Jumlah kantong == 1';actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Satu kantong')})},@{actions=@(@{type='swapOverlay';dest=(Id ('Kantong/Kelola '+$key))})})}
  $roleAction=if($key -eq 'Keluarga'){@{type='conditional';blocks=@(@{expression='Peran kantong == "Pemilik"';actions=@($ownerAction)},@{actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Anggota')})})}}else{$ownerAction}
  Cmd 'proto.interaction.add' @{id=$trigger;actions=@(@{type='setVariable';variable=(V 'Kantong kelola');value=$key},$roleAction)}
}
$deleteFamily=@(@{type='setVariable';variable=(V 'Keluarga tersedia');value=$false},@{type='setVariable';variable=(V 'Kantong');value='Pribadi'},@{type='setVariable';variable=(V 'Kantong pilihan');value='Pribadi'})
$deletePrivate=@(@{type='setVariable';variable=(V 'Pribadi tersedia');value=$false},@{type='setVariable';variable=(V 'Kantong');value='Keluarga'},@{type='setVariable';variable=(V 'Kantong pilihan');value='Keluarga'})
Cmd 'proto.interaction.clear' @{ids=@((Id 'Kantong/Hapus/Konfirmasi'))}
Cmd 'proto.interaction.add' @{id=(Id 'Kantong/Hapus/Konfirmasi');action=@{type='conditional';blocks=@(
  @{expression='Jumlah kantong == 1';actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Hapus terkunci')})},
  @{actions=@(@{type='setVariable';variable=(V 'Jumlah kantong');value=1},@{type='conditional';blocks=@(@{expression='Kantong kelola == "Keluarga"';actions=$deleteFamily},@{actions=$deletePrivate})},@{type='swapOverlay';dest=(Id 'Kantong/Hapus sukses')})}
)}}
Batch 'pocket-management-polish.json'
Cmd 'variable.bind' @{ids=@((Id 'Kantong/Satu kantong/Nama'));field='characters';variable=(V 'Kantong kelola')}
Cmd 'variable.bind' @{ids=@((Id 'Kantong/Satu kantong/Nama'));field='fill';variable='Light/text'}
Cmd 'proto.flow.add' @{start=(Id 'Kantong/Anggota');name='Kantong bersama · tampilan anggota'}
Cmd 'proto.flow.add' @{start=(Id 'Kantong/Satu kantong');name='Kantong terakhir · hapus terkunci'}
Batch 'pocket-management-flow-states.json'
foreach($key in @('Kelola Keluarga','Hapus','Satu kantong','Anggota','Keluarkan anggota','Edit nama')){
  & $cli export $file -o (Join-Path $PSScriptRoot ('kantong-'+$key.ToLower().Replace(' ','-')+'.png')) --node (Id ('Kantong/'+$key)) --scale 2
}
