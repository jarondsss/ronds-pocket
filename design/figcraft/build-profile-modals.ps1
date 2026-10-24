$ErrorActionPreference='Stop'
$file=Join-Path $PSScriptRoot 'Ronds Pocket - Mobile Refactor v2.figcraft'
$cli='C:/Program Files/FigCraft/figcraft-cli.exe'
function Read-Design {
  $z=[IO.Compression.ZipFile]::OpenRead($file)
  try{$r=[IO.StreamReader]::new($z.GetEntry('document.json').Open());try{return($r.ReadToEnd()|ConvertFrom-Json -Depth 100)}finally{$r.Dispose()}}finally{$z.Dispose()}
}
function Id($name){return ($script:doc.nodes.PSObject.Properties.Value|Where-Object name -eq $name|Select-Object -First 1).id}
function Cmd($command,$params){$script:commands.Add(@{command=$command;params=$params})}
function Batch($name){
  $path=Join-Path $PSScriptRoot $name
  ConvertTo-Json -InputObject @($script:commands) -Depth 60|Set-Content -LiteralPath $path -Encoding utf8
  $out=& $cli run $path --in $file --out $file
  if($LASTEXITCODE -ne 0){throw($out -join "`n")}
  foreach($line in $out){try{$item=$line|ConvertFrom-Json}catch{continue};if($item.error -or $item.ok -eq $false){throw $line}}
  $script:doc=Read-Design;$script:commands=[Collections.Generic.List[object]]::new()
}
function T($key,$text,$size=12,$role='muted',$weight='Regular',$width=294){
  return @{key=$key;type='text';text=$text;width=$width;height=20;role=$role;props=@{fontFamily='Plus Jakarta Sans';fontStyle=$weight;fontSize=$size;lineHeight='145%';textAutoResize='height';sizingV='hug'}}
}
function F($key,$kids,$props=@{},$width=294,$height=48,$role=$null){
  $base=@{layout='vertical';gap=8;padding=0;fill='transparent';sizingV='hug'}
  foreach($k in $props.Keys){$base[$k]=$props[$k]}
  return @{key=$key;type='frame';kids=@($kids);props=$base;width=$width;height=$height;role=$role}
}
function Btn($key,$label,$role='primary',$width=294){
  $txt=T 'Label' $label 13 $(if($role -eq 'primary'){'onPrimary'}elseif($role -eq 'expense'){'surface'}else{'text'}) 'SemiBold' $width
  $txt.props.textAlign='center'
  return (F $key @($txt) @{layout='horizontal';mainAlign='center';crossAlign='center';sizingV='fixed';cornerRadius=16;padding=0} $width 48 $role)
}
function Field($key,$label,$value,$height=48){
  return (F $key @((T 'Label' $label 11 'text' 'SemiBold'),(F 'Input' @((T 'Value' $value 13 'text' 'Regular' 262)) @{padding=16;cornerRadius=14;sizingV='fixed';mainAlign='center'} 294 $height 'inset')))
}
function Choice($key,$label,$selected=$false){
  $kids=@((T 'Label' $label 13 'text' 'SemiBold' 230),(T 'State' $(if($selected){'Dipilih'}else{'Pilih'}) 10 'primary' 'SemiBold' 40))
  return (F $key $kids @{layout='horizontal';gap=0;padding=12;cornerRadius=14;crossAlign='center';sizingV='fixed'} 294 48 $(if($selected){'softPrimary'}else{'inset'}))
}
function Modal($key,$title,$desc,$kids){
  $close=Btn 'Tutup' '×' 'inset' 44
  $head=F 'Header' @((T 'Judul' $title 20 'text' 'Bold' 238),$close) @{layout='horizontal';gap=12;crossAlign='center'}
  return (F $key (@($head,(T 'Deskripsi' $desc))+@($kids)) @{padding=24;gap=14;cornerRadius=28;sizingV='hug'} 342 400 'surface')
}
$doc=Read-Design
if(Id 'Modal Profil/Avatar'){throw 'Modal Profil sudah tersedia; edit node yang ada.'}
$commands=[Collections.Generic.List[object]]::new()
$trees=[Collections.Generic.List[object]]::new()
$trees.Add((Modal 'Nama' 'Nama tampilan' 'Nama ini muncul saat kamu mencatat bareng.' @(
  (Field 'Nama' 'Nama tampilan' 'Rani'),(T 'Batas' 'Maksimal 24 karakter.' 11),
  (Btn 'Simpan' 'Simpan nama'),(Btn 'Batal' 'Batal' 'inset')
)))
$trees.Add((Modal 'Tema' 'Pilih tampilan' 'Sesuaikan dengan kenyamananmu.' @(
  (Choice 'Sistem' 'Ikuti perangkat' $true),(Choice 'Terang' 'Terang'),(Choice 'Gelap' 'Gelap'),
  (T 'Catatan' 'Pilihan sekarang: Ikuti perangkat' 11), (Btn 'Simpan' 'Simpan tampilan')
)))
$trees.Add((Modal 'Kantong' 'Ganti kantong' 'Catatan baru akan masuk ke kantong yang dipilih.' @(
  (Choice 'Keluarga' 'Keluarga' $true),(Choice 'Pribadi' 'Pribadi'),
  (T 'Catatan' 'Kantong sekarang: Keluarga' 11),(Btn 'Simpan' 'Gunakan kantong')
)))
$trees.Add((Modal 'Bantuan' 'Bantuan' 'Panduan singkat untuk catatan sehari-hari.' @(
  (T 'Q1' 'Bagaimana cara mencatat uang?' 13 'text' 'SemiBold'),
  (T 'A1' 'Ketuk Catat, isi nominal, lalu pilih kategori dan dompet. Periksa tanggal sebelum menyimpan.'),
  (T 'Q2' 'Apa bedanya dompet dan kantong?' 13 'text' 'SemiBold'),
  (T 'A2' 'Dompet menyimpan saldo. Kantong mengelompokkan catatan pribadi atau catatan bersama.'),
  (T 'Q3' 'Ada hitungan yang terasa keliru?' 13 'text' 'SemiBold'),
  (T 'A3' 'Periksa tanggal, jenis transaksi, dan dompet yang dipakai. Kirim masukan jika masih ada masalah.'),
  (Btn 'Feedback' 'Kirim masukan'),(Btn 'Selesai' 'Mengerti' 'inset')
)))
$moods=F 'Suasana' @((Btn 'Suka' 'Suka' 'softPrimary' 90),(Btn 'Lumayan' 'Lumayan' 'inset' 90),(Btn 'Masalah' 'Ada masalah' 'inset' 90)) @{layout='horizontal';gap=12}
$trees.Add((Modal 'Feedback' 'Masukan untuk kami' 'Ceritakan yang sudah enak dipakai atau yang perlu diperbaiki.' @(
  (T 'MoodLabel' 'Pengalamanmu sejauh ini?' 11 'text' 'SemiBold'),$moods,
  (Field 'Pesan' 'Masukan kamu' 'Tulis ceritamu di sini…' 100),
  (T 'Hitungan' '0 / 2.000 karakter' 10),
  (Field 'Kontak' 'Kontak (opsional)' 'Email atau nomor WhatsApp'),
  (T 'Privasi' 'Isi kontak kalau kamu ingin mendapat balasan.' 11),
  (Btn 'Kirim' 'Kirim masukan'),(Btn 'Batal' 'Nanti saja' 'inset')
)))
$trees.Add((Modal 'Donasi' 'Dukung Ronds Pocket' 'Donasi sukarela untuk membantu pengembangan aplikasi.' @(
  (F 'QRIS' @() @{layout='horizontal';mainAlign='center';crossAlign='center';sizingV='fixed';padding=8;cornerRadius=16} 294 220 'surface'),
  (T 'Merchant' 'RONDS POCKET, DIGITAL & KREATIF' 11 'text' 'SemiBold'),
  (T 'Cara' 'Pindai QRIS lewat aplikasi bank atau e-wallet. Nominalnya kamu tentukan sendiri.'),
  (Btn 'Simpan QRIS' 'Simpan QRIS' 'inset'),(Btn 'Terima kasih' 'Sudah donasi'),
  (T 'Catatan' 'Tombol ini adalah ucapan terima kasih, bukan verifikasi pembayaran.' 10)
)))
$trees.Add((Modal 'Keluar' 'Keluar dari akun?' 'Catatanmu tetap tersimpan. Masuk kembali untuk melanjutkan.' @(
  (Btn 'Konfirmasi' 'Keluar dari akun'),(Btn 'Batal' 'Tetap di sini' 'inset')
)))
$trees.Add((Modal 'Hapus' 'Hapus akun permanen?' 'Semua kantong, transaksi, dompet, anggaran, tujuan, tabungan, dan riwayatmu akan dihapus.' @(
  (F 'Peringatan' @((T 'Teks' 'Data yang dihapus tidak bisa dikembalikan.' 12 'expense' 'SemiBold' 262)) @{padding=16;cornerRadius=14} 294 64 'inset'),
  (Btn 'Batal' 'Batal, simpan akun saya' 'inset'),(Btn 'Konfirmasi' 'Hapus akun permanen' 'expense')
)))
$featureRows=@()
foreach($feature in @('Anggaran','Tujuan','Tabungan','Transaksi berulang','Rekap','Partner','Kekayaan bersih','Riwayat perubahan')){
  $featureRows+=Choice $feature $feature
}
$trees.Add((Modal 'Fitur' 'Semua fitur' 'Pilih yang ingin kamu buka.' $featureRows))
$animals=@(@('🦊','Rubah'),@('🐼','Panda'),@('🐨','Koala'),@('🐯','Macan'),@('🦁','Singa'),@('🐸','Katak'),@('🐙','Gurita'),@('🦉','Burung hantu'),@('🐧','Penguin'),@('🐢','Kura-kura'),@('🐝','Lebah'),@('🐰','Kelinci'),@('🐷','Babi'),@('🐵','Monyet'),@('🐳','Paus'),@('🦕','Dino'))
$avatarRows=@()
for($row=0;$row -lt 4;$row++){
  $tiles=@()
  for($col=0;$col -lt 4;$col++){
    $animal=$animals[$row*4+$col]
    $emoji=T 'Emoji' $animal[0] 28 'text' 'Regular' 64
    $emoji.props.fontFamily='Segoe UI Emoji';$emoji.props.textAlign='center'
    $tiles+=F $animal[1] @($emoji) @{mainAlign='center';crossAlign='center';cornerRadius=16;sizingV='fixed'} 64 56 'inset'
  }
  $avatarRows+=F ('Baris'+$row) $tiles @{layout='horizontal';gap=12}
}
$preview=T 'Emoji' '🦊' 36 'text' 'Regular' 294
$preview.props.fontFamily='Segoe UI Emoji';$preview.props.textAlign='center'
$trees.Add((Modal 'Avatar' 'Pilih maskot kamu' 'Pilih satu hewan untuk avatar di kantong bersama.' (@(
  (F 'Pratinjau' @($preview,(T 'Label' 'Pilihanmu' 11 'muted' 'Regular' 294)) @{crossAlign='center';gap=4}),
  (F 'Pilihan' $avatarRows @{gap=10}),
  (Btn 'Simpan' 'Simpan avatar'),(Btn 'Inisial' 'Pakai inisial nama' 'inset')
))))
$trees.Add((Modal 'Feedback sukses' 'Masukan terkirim' 'Terima kasih sudah membantu kami memperbaiki Ronds Pocket.' @((Btn 'Selesai' 'Selesai'))))
$trees.Add((Modal 'Donasi sukses' 'Terima kasih!' 'Dukunganmu membantu Ronds Pocket terus berkembang.' @((Btn 'Selesai' 'Kembali ke profil'))))
$trees.Add((Modal 'Simpan sukses' 'Perubahan disimpan' 'Profilmu sudah diperbarui.' @((Btn 'Selesai' 'Kembali ke profil'))))

$pending=[Collections.Generic.List[object]]::new()
$i=0
foreach($tree in $trees){
  $tree.name='Modal Profil/'+$tree.key;$tree.parent=97
  $tree.x=3100+($i%4)*420;$tree.y=3500+[math]::Floor($i/4)*850
  $pending.Add($tree);$i++
}
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
  Batch ('profile-modal-level-'+$level+'.json')
  $next=[Collections.Generic.List[object]]::new()
  foreach($node in $pending){
    if($node.role){Cmd 'variable.bind' @{ids=@((Id $node.name));field='fill';variable=('Light/'+$node.role)}}
    foreach($kid in $node.kids){$kid.name=$node.name+'/'+$kid.key;$kid.parentName=$node.name;$next.Add($kid)}
  }
  if($commands.Count){Batch ('profile-modal-bind-'+$level+'.json')}
  $pending=$next;$level++
}

Cmd 'variable.createCollection' @{name='Profil Prototype';modes=@('Default')}
Batch 'profile-modal-variable-collection.json'
foreach($entry in @(@('Avatar','🦊'),@('Avatar brouillon','🦊'),@('Tema','Sistem'),@('Kantong','Keluarga'))){
  Cmd 'variable.create' @{collection='Profil Prototype';name=$entry[0];type='string';value=$entry[1]}
}
Batch 'profile-modal-variables.json'

function Interaction($id,$action){Cmd 'proto.interaction.add' @{id=$id;action=$action;transition=@{type='dissolve'};durationMs=180;easing='easeOut'}}
function Open($source,$target){
  Cmd 'proto.interaction.clear' @{ids=@($source)}
  Interaction $source @{type='openOverlay';dest=(Id ('Modal Profil/'+$target));position='center';close_on_outside=$true;background='#24203466'}
}
foreach($pair in @(@(984,'Nama'),@(991,'Tema'),@(998,'Kantong'),@(1005,'Bantuan'),@(1011,'Keluar'),@(1013,'Hapus'),@(1014,'Fitur'),@(976,'Avatar'))){Open $pair[0] $pair[1]}
Open (Id 'Profil · Feedback') 'Feedback'
Open (Id 'Profil · Donasi') 'Donasi'
foreach($tree in $trees){
  Interaction (Id ($tree.name+'/Header/Tutup')) @{type='closeOverlay'}
  foreach($button in @('Batal','Selesai')){
    $buttonId=Id ($tree.name+'/'+$button)
    if($buttonId){Interaction $buttonId @{type='closeOverlay'}}
  }
}
foreach($key in @('Nama','Tema','Kantong')){Interaction (Id ('Modal Profil/'+$key+'/Simpan')) @{type='swapOverlay';dest=(Id 'Modal Profil/Simpan sukses')}}
Interaction (Id 'Modal Profil/Bantuan/Feedback') @{type='swapOverlay';dest=(Id 'Modal Profil/Feedback')}
Interaction (Id 'Modal Profil/Feedback/Kirim') @{type='swapOverlay';dest=(Id 'Modal Profil/Feedback sukses')}
Interaction (Id 'Modal Profil/Donasi/Terima kasih') @{type='swapOverlay';dest=(Id 'Modal Profil/Donasi sukses')}
foreach($key in @('Keluar','Hapus')){
  Cmd 'proto.interaction.add' @{id=(Id ('Modal Profil/'+$key+'/Konfirmasi'));actions=@(@{type='closeOverlay'},@{type='navigate';dest=1793})}
}
foreach($pair in @(@('Anggaran',526),@('Tujuan',598),@('Tabungan',664),@('Transaksi berulang',1199),@('Rekap',729),@('Partner',898),@('Kekayaan bersih',822),@('Riwayat perubahan',1041))){
  Cmd 'proto.interaction.add' @{id=(Id ('Modal Profil/Fitur/'+$pair[0]));actions=@(@{type='closeOverlay'},@{type='navigate';dest=$pair[1]})}
}
foreach($key in @('Sistem','Terang','Gelap')){
  Interaction (Id ('Modal Profil/Tema/'+$key)) @{type='setVariable';variable='Profil Prototype/Tema';value=$key}
}
Cmd 'variable.bind' @{ids=@(996);field='characters';variable='Profil Prototype/Tema'}
foreach($key in @('Keluarga','Pribadi')){
  Interaction (Id ('Modal Profil/Kantong/'+$key)) @{type='setVariable';variable='Profil Prototype/Kantong';value=$key}
}
Cmd 'variable.bind' @{ids=@(1003);field='characters';variable='Profil Prototype/Kantong'}
Cmd 'node.set' @{id=977;characters='🦊';fontFamily='Segoe UI Emoji';fontStyle='Regular';fontSize=28;textAutoResize='widthAndHeight'}
Cmd 'node.set' @{id=976;layout='horizontal';mainAlign='center';crossAlign='center';padding=0}
Cmd 'variable.bind' @{ids=@(977);field='characters';variable='Profil Prototype/Avatar'}
Cmd 'variable.bind' @{ids=@((Id 'Modal Profil/Avatar/Pratinjau/Emoji'));field='characters';variable='Profil Prototype/Avatar brouillon'}
for($row=0;$row -lt 4;$row++){
  for($col=0;$col -lt 4;$col++){
    $animal=$animals[$row*4+$col]
    Interaction (Id ('Modal Profil/Avatar/Pilihan/Baris'+$row+'/'+$animal[1])) @{type='setVariable';variable='Profil Prototype/Avatar brouillon';value=$animal[0]}
  }
}
Interaction (Id 'Modal Profil/Avatar/Inisial') @{type='setVariable';variable='Profil Prototype/Avatar brouillon';value='R'}
Cmd 'proto.interaction.add' @{id=(Id 'Modal Profil/Avatar/Simpan');actions=@(@{type='setVariable';variable='Profil Prototype/Avatar';expression='[Profil Prototype/Avatar brouillon]'},@{type='closeOverlay'})}
Cmd 'image.place' @{path=(Join-Path (Split-Path (Split-Path $PSScriptRoot)) 'public/qris-ronds-pocket.png');parent=(Id 'Modal Profil/Donasi/QRIS');width=204;height=204;mode='fit'}
Cmd 'page.select' @{id=97}
Batch 'profile-modal-interactions.json'
foreach($key in @('Avatar','Feedback','Donasi','Hapus','Tema','Fitur')){
  & $cli export $file -o (Join-Path $PSScriptRoot ('modal-profil-'+$key.ToLower()+'.png')) --node (Id ('Modal Profil/'+$key)) --scale 2
  if($LASTEXITCODE -ne 0){throw ('Export gagal: '+$key)}
}
& $cli export $file -o (Join-Path $PSScriptRoot 'profil-dukungan.png') --node 960 --scale 2
