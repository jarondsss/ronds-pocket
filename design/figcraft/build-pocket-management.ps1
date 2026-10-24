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
function T($key,$text,$size=12,$role='muted',$weight='Regular',$width=294){return @{key=$key;type='text';text=$text;width=$width;height=20;role=$role;props=@{fontFamily='Plus Jakarta Sans';fontStyle=$weight;fontSize=$size;lineHeight='145%';textAutoResize='height';sizingV='hug'}}}
function F($key,$kids,$props=@{},$width=294,$height=48,$role=$null){
  $base=@{layout='vertical';gap=8;padding=0;fill='transparent';sizingV='hug'}
  foreach($k in $props.Keys){$base[$k]=$props[$k]}
  return @{key=$key;type='frame';kids=@($kids);props=$base;width=$width;height=$height;role=$role}
}
function Btn($key,$label,$role='primary',$width=294){
  $text=T 'Label' $label 13 $(if($role -eq 'primary'){'onPrimary'}elseif($role -eq 'expense'){'surface'}else{'text'}) 'SemiBold' $width
  $text.props.textAlign='center'
  return(F $key @($text) @{layout='horizontal';mainAlign='center';crossAlign='center';cornerRadius=16;sizingV='fixed';padding=0} $width 48 $role)
}
function Modal($key,$title,$desc,$kids){
  $head=F 'Header' @((T 'Judul' $title 20 'text' 'Bold' 238),(Btn 'Tutup' '×' 'inset' 44)) @{layout='horizontal';gap=12;crossAlign='center'}
  return(F $key (@($head,(T 'Deskripsi' $desc))+@($kids)) @{padding=24;gap=14;cornerRadius=28} 342 400 'surface')
}
function Person($name,$emoji,$role,$ownerControls=$true){
  $icon=T 'Emoji' $emoji 22 'text' 'Regular' 36;$icon.props.fontFamily='Segoe UI Emoji';$icon.props.textAlign='center'
  $kids=@($icon,(F 'Identitas' @((T 'Nama' $name 13 'text' 'SemiBold' 170),(T 'Peran' $role 10 'muted' 'Regular' 170)) @{} 170))
  if($ownerControls -and $role -ne 'Pemilik'){$kids+=Btn 'Keluarkan' '×' 'inset' 44}else{$kids+=T 'Penanda' $(if($role -eq 'Pemilik'){'Pemilik'}else{''}) 9 'primary' 'SemiBold' 44}
  return(F $name $kids @{layout='horizontal';gap=10;crossAlign='center';sizingV='fixed'} 294 56)
}
$doc=Read-Design
if(Id 'Kantong/Kelola Keluarga'){throw 'Desain kelola kantong sudah ada; edit layer yang tersedia.'}
$commands=[Collections.Generic.List[object]]::new()
$trees=@()
$trees+=Modal 'Kelola Keluarga' 'Kelola kantong' 'Keluarga · kantong bersama' @(
  (Btn 'Edit' 'Edit nama kantong' 'inset'),
  (F 'Anggota' @((T 'Jumlah' '3 anggota' 14 'text' 'Bold'),(Person 'Rani' '🦊' 'Pemilik'),(Person 'Dimas' '🐼' 'Anggota'),(Person 'Sinta' '🐰' 'Anggota')) @{gap=8}),
  (T 'Aturan' 'Hanya pemilik yang bisa mengeluarkan anggota.' 11),
  (Btn 'Hapus' 'Hapus kantong' 'expense'),(Btn 'Kembali' 'Kembali ke daftar kantong' 'inset')
)
$trees+=Modal 'Kelola Pribadi' 'Kelola kantong' 'Pribadi · hanya lu yang punya akses' @(
  (Btn 'Edit' 'Edit nama kantong' 'inset'),
  (T 'Pemilik' 'Pemilik: Rani' 12 'text' 'SemiBold'),
  (T 'Privasi' 'Catatan di kantong ini hanya bisa dilihat pemiliknya.'),
  (Btn 'Hapus' 'Hapus kantong' 'expense'),(Btn 'Kembali' 'Kembali ke daftar kantong' 'inset')
)
$trees+=Modal 'Satu kantong' 'Kelola kantong' 'Pribadi · satu-satunya kantong' @(
  (Btn 'Edit' 'Edit nama kantong' 'inset'),(T 'Pemilik' 'Pemilik: Rani' 12 'text' 'SemiBold'),
  (F 'Lock' @((T 'Judul' 'Hapus kantong terkunci' 13 'muted' 'SemiBold' 262),(T 'Alasan' 'Minimal satu kantong harus tetap ada.' 12 'muted' 'Regular' 262)) @{padding=16;cornerRadius=14} 294 80 'inset'),
  (Btn 'Kembali' 'Kembali ke daftar kantong' 'inset')
)
$trees+=Modal 'Anggota' 'Anggota kantong' 'Keluarga · kantong bersama' @(
  (Person 'Rani' '🦊' 'Pemilik' $false),(Person 'Dimas' '🐼' 'Anggota' $false),(Person 'Sinta' '🐰' 'Anggota' $false),
  (T 'Izin' 'Hanya pemilik yang bisa mengubah nama, menghapus kantong, atau mengeluarkan anggota.'),
  (Btn 'Kembali' 'Kembali ke daftar kantong' 'inset')
)
$trees+=Modal 'Edit nama' 'Edit nama kantong' 'Nama baru juga terlihat oleh anggota kantong.' @(
  (T 'Label' 'Nama kantong' 11 'text' 'SemiBold'),
  (F 'Input' @((T 'Nama' 'Keluarga' 13 'text' 'Regular' 262)) @{padding=16;cornerRadius=14;mainAlign='center';sizingV='fixed'} 294 48 'inset'),
  (Btn 'Simpan' 'Simpan nama'),(Btn 'Batal' 'Batal' 'inset')
)
$trees+=Modal 'Hapus' 'Hapus kantong ini?' 'Periksa nama kantong sebelum melanjutkan.' @(
  (T 'Target' 'Keluarga' 16 'text' 'Bold'),
  (F 'Peringatan' @((T 'Utama' 'Semua catatan di kantong ini akan ikut terhapus.' 14 'expense' 'Bold' 262),(T 'Permanen' 'Catatan yang sudah dihapus tidak bisa dikembalikan.' 12 'text' 'Regular' 262)) @{padding=16;gap=8;cornerRadius=14} 294 110 'inset'),
  (T 'Bersama' 'Pada kantong bersama, seluruh anggota juga kehilangan akses ke kantong dan catatannya.' 12),
  (Btn 'Batal' 'Batal, pertahankan kantong' 'inset'),(Btn 'Konfirmasi' 'Hapus kantong & semua catatan' 'expense')
)
$trees+=Modal 'Hapus terkunci' 'Kantong tidak bisa dihapus' 'Ini satu-satunya kantong yang tersisa.' @(
  (F 'Alasan' @((T 'Teks' 'Minimal satu kantong harus tetap ada. Buat kantong lain terlebih dahulu jika ingin menghapus kantong ini.' 12 'text' 'Regular' 262)) @{padding=16;cornerRadius=14} 294 90 'inset'),
  (Btn 'Kembali' 'Mengerti')
)
$trees+=Modal 'Keluarkan anggota' 'Keluarkan anggota?' 'Anggota berikut akan kehilangan akses ke kantong Keluarga.' @(
  (T 'Target' 'Dimas' 16 'text' 'Bold'),
  (T 'Dampak' 'Catatan yang sudah dibuat tetap tersimpan di kantong ini. Yang dihapus hanya akses anggotanya.'),
  (Btn 'Batal' 'Batal' 'inset'),(Btn 'Konfirmasi' 'Keluarkan anggota' 'expense')
)
$trees+=Modal 'Hapus sukses' 'Kantong sudah dihapus' 'Semua catatan di dalamnya juga sudah terhapus. Kantong Pribadi sekarang aktif.' @((Btn 'Kembali' 'Kembali ke daftar kantong'))
$trees+=Modal 'Anggota dikeluarkan' 'Akses anggota dihapus' 'Anggota tersebut tidak lagi bisa membuka kantong Keluarga. Catatannya tetap tersimpan.' @((Btn 'Kembali' 'Kembali ke kelola kantong'))
$trees+=Modal 'Nama disimpan' 'Nama kantong disimpan' 'Nama baru akan terlihat oleh seluruh anggota kantong.' @((Btn 'Kembali' 'Kembali ke kelola kantong'))
$pending=[Collections.Generic.List[object]]::new();$i=0
foreach($tree in $trees){$tree.name='Kantong/'+$tree.key;$tree.parent=97;$tree.x=3100+($i%4)*420;$tree.y=7100+[math]::Floor($i/4)*850;$pending.Add($tree);$i++}
$level=0
while($pending.Count -gt 0){
  foreach($node in $pending){
    $parent=if($node.ContainsKey('parent')){$node.parent}else{Id $node.parentName}
    if(-not $parent){throw('Parent tidak ditemukan: '+$node.parentName)}
    $params=@{type=$node.type;parent=$parent;name=$node.name;width=$node.width;height=$node.height;props=$node.props;select=$false}
    if($node.type -eq 'text'){$params.text=$node.text}
    if($node.ContainsKey('x')){$params.x=$node.x;$params.y=$node.y}
    Cmd 'node.create' $params
  }
  Batch ('pocket-management-level-'+$level+'.json')
  $next=[Collections.Generic.List[object]]::new()
  foreach($node in $pending){
    if($node.role){Cmd 'variable.bind' @{ids=@((Id $node.name));field='fill';variable=('Light/'+$node.role)}}
    foreach($kid in $node.kids){$kid.name=$node.name+'/'+$kid.key;$kid.parentName=$node.name;$next.Add($kid)}
  }
  if($commands.Count){Batch ('pocket-management-bind-'+$level+'.json')}
  $pending=$next;$level++
}
foreach($entry in @(@('Kantong kelola','Keluarga'),@('Anggota target','Dimas'),@('Anggota ringkasan','3 anggota'))){Cmd 'variable.create' @{collection='Profil Prototype';name=$entry[0];type='string';value=$entry[1]}}
foreach($entry in @(@('Jumlah kantong',2),@('Jumlah anggota',3))){Cmd 'variable.create' @{collection='Profil Prototype';name=$entry[0];type='number';value=$entry[1]}}
foreach($entry in @(@('Keluarga tersedia',$true),@('Dimas tersedia',$true),@('Sinta tersedia',$true))){Cmd 'variable.create' @{collection='Profil Prototype';name=$entry[0];type='boolean';value=$entry[1]}}
foreach($key in @('Keluarga','Pribadi')){
  $row=Id ('Modal Profil/Kantong/'+$key)
  Cmd 'node.set' @{id=$row;height=64;padding=10;gap=6}
  Cmd 'node.set' @{id=(Id ('Modal Profil/Kantong/'+$key+'/Label'));width=198}
  Cmd 'node.set' @{id=(Id ('Modal Profil/Kantong/'+$key+'/State'));width=20;textAlign='center'}
  Cmd 'node.create' @{type='frame';parent=$row;name=('Kantong/Kelola '+$key+' trigger');width=44;height=44;select=$false;props=@{layout='horizontal';mainAlign='center';crossAlign='center';padding=0;gap=0;cornerRadius=12;fill='#FFFFFF';sizingV='fixed';sizingH='fixed'}}
}
Batch 'pocket-management-variables.json'
function Swap($source,$target){Cmd 'proto.interaction.add' @{id=$source;action=@{type='swapOverlay';dest=(Id $target)}}}
foreach($key in @('Keluarga','Pribadi')){
  $trigger=Id ('Kantong/Kelola '+$key+' trigger')
  Cmd 'node.create' @{type='text';parent=$trigger;name=('Kantong/Kelola '+$key+' menu');text='⋯';width=30;height=24;select=$false;props=@{fontFamily='Plus Jakarta Sans';fontStyle='Bold';fontSize=20;textAlign='center';textAutoResize='height';fill='#6251D9'}}
  $action=if($key -eq 'Keluarga'){@{type='swapOverlay';dest=(Id 'Kantong/Kelola Keluarga')}}else{@{type='conditional';blocks=@(@{expression='Jumlah kantong == 1';actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Satu kantong')})},@{actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Kelola Pribadi')})})}}
  Cmd 'proto.interaction.add' @{id=$trigger;actions=@(@{type='setVariable';variable=(V 'Kantong kelola');value=$key},$action)}
}
foreach($id in @(109,211)){
  Cmd 'proto.interaction.clear' @{ids=@($id)}
  Cmd 'proto.interaction.add' @{id=$id;actions=@(@{type='setVariable';variable=(V 'Kantong pilihan');expression='Kantong'},@{type='openOverlay';dest=(Id 'Modal Profil/Kantong');position='center';close_on_outside=$true;background='#24203466'})}
}
foreach($tree in $trees){Cmd 'proto.interaction.add' @{id=(Id ($tree.name+'/Header/Tutup'));action=@{type='closeOverlay'}}}
foreach($key in @('Kelola Keluarga','Kelola Pribadi','Satu kantong','Anggota','Hapus sukses','Hapus terkunci')){Swap (Id ('Kantong/'+$key+'/Kembali')) 'Modal Profil/Kantong'}
foreach($key in @('Kelola Keluarga','Kelola Pribadi','Satu kantong')){Swap (Id ('Kantong/'+$key+'/Edit')) 'Kantong/Edit nama'}
foreach($key in @('Hapus','Edit nama')){
  Cmd 'proto.interaction.add' @{id=(Id ('Kantong/'+$key+'/Batal'));action=@{type='conditional';blocks=@(@{expression='Kantong kelola == "Keluarga"';actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Kelola Keluarga')})},@{actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Kelola Pribadi')})})}}
}
foreach($key in @('Kelola Keluarga','Kelola Pribadi')){
  Cmd 'proto.interaction.add' @{id=(Id ('Kantong/'+$key+'/Hapus'));action=@{type='conditional';blocks=@(@{expression='Jumlah kantong == 1';actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Hapus terkunci')})},@{actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Hapus')})})}}
}
foreach($member in @('Dimas','Sinta')){
  Cmd 'proto.interaction.add' @{id=(Id ('Kantong/Kelola Keluarga/Anggota/'+$member+'/Keluarkan'));actions=@(@{type='setVariable';variable=(V 'Anggota target');value=$member},@{type='swapOverlay';dest=(Id 'Kantong/Keluarkan anggota')})}
  Cmd 'variable.bind' @{ids=@((Id ('Kantong/Kelola Keluarga/Anggota/'+$member)));field='visible';variable=(V ($member+' tersedia'))}
}
Cmd 'variable.bind' @{ids=@((Id 'Kantong/Keluarkan anggota/Target'));field='characters';variable=(V 'Anggota target')}
Cmd 'variable.bind' @{ids=@((Id 'Kantong/Hapus/Target'),(Id 'Kantong/Edit nama/Input/Nama'));field='characters';variable=(V 'Kantong kelola')}
Cmd 'variable.bind' @{ids=@((Id 'Kantong/Kelola Keluarga/Anggota/Jumlah'));field='characters';variable=(V 'Anggota ringkasan')}
Cmd 'variable.bind' @{ids=@((Id 'Modal Profil/Kantong/Keluarga'));field='visible';variable=(V 'Keluarga tersedia')}
Cmd 'variable.bind' @{ids=@(108,210);field='characters';variable=(V 'Kantong')}
Swap (Id 'Kantong/Keluarkan anggota/Batal') 'Kantong/Kelola Keluarga'
Swap (Id 'Kantong/Anggota dikeluarkan/Kembali') 'Kantong/Kelola Keluarga'
Cmd 'proto.interaction.add' @{id=(Id 'Kantong/Keluarkan anggota/Konfirmasi');actions=@(
  @{type='conditional';blocks=@(@{expression='Anggota target == "Dimas"';actions=@(@{type='setVariable';variable=(V 'Dimas tersedia');value=$false})},@{actions=@(@{type='setVariable';variable=(V 'Sinta tersedia');value=$false})})},
  @{type='setVariable';variable=(V 'Jumlah anggota');expression='Jumlah anggota - 1'},
  @{type='conditional';blocks=@(@{expression='Jumlah anggota == 2';actions=@(@{type='setVariable';variable=(V 'Anggota ringkasan');value='2 anggota'})},@{actions=@(@{type='setVariable';variable=(V 'Anggota ringkasan');value='1 anggota'})})},
  @{type='swapOverlay';dest=(Id 'Kantong/Anggota dikeluarkan')}
)}
Cmd 'proto.interaction.add' @{id=(Id 'Kantong/Hapus/Konfirmasi');actions=@(
  @{type='conditional';blocks=@(@{expression='Jumlah kantong == 1';actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Hapus terkunci')})},@{actions=@(@{type='setVariable';variable=(V 'Jumlah kantong');value=1},@{type='setVariable';variable=(V 'Keluarga tersedia');value=$false},@{type='setVariable';variable=(V 'Kantong');value='Pribadi'},@{type='setVariable';variable=(V 'Kantong pilihan');value='Pribadi'},@{type='swapOverlay';dest=(Id 'Kantong/Hapus sukses')})})}
)}
Swap (Id 'Kantong/Edit nama/Simpan') 'Kantong/Nama disimpan'
Cmd 'proto.interaction.add' @{id=(Id 'Kantong/Nama disimpan/Kembali');action=@{type='conditional';blocks=@(@{expression='Kantong kelola == "Keluarga"';actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Kelola Keluarga')})},@{actions=@(@{type='swapOverlay';dest=(Id 'Kantong/Kelola Pribadi')})})}}
Cmd 'page.select' @{id=97}
Batch 'pocket-management-interactions.json'
foreach($key in @('Kelola Keluarga','Hapus','Satu kantong','Anggota','Keluarkan anggota','Edit nama')){
  & $cli export $file -o (Join-Path $PSScriptRoot ('kantong-'+$key.ToLower().Replace(' ','-')+'.png')) --node (Id ('Kantong/'+$key)) --scale 2
  if($LASTEXITCODE -ne 0){throw('Export gagal '+$key)}
}
& $cli export $file -o (Join-Path $PSScriptRoot 'modal-profil-kantong.png') --node (Id 'Modal Profil/Kantong') --scale 2
