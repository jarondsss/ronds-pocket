$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'polish-profile-modals.ps1')
foreach($group in @(@('Tema',@('Sistem','Terang','Gelap')),@('Kantong',@('Keluarga','Pribadi')))){
  foreach($key in $group[1]){
    Cmd 'variable.create' @{collection='Profil Prototype';name=('Tanda '+$group[0]+' '+$key);type='string';value=$(if($key -in @('Sistem','Keluarga')){'●'}else{'○'})}
  }
}
Batch 'profile-modal-indicator-variables.json'
foreach($group in @(@('Tema',@('Sistem','Terang','Gelap')),@('Kantong',@('Keluarga','Pribadi')))){
  foreach($key in $group[1]){
    $id=Id ('Modal Profil/'+$group[0]+'/'+$key)
    Cmd 'proto.interaction.clear' @{ids=@($id)}
    $actions=@(@{type='setVariable';variable=(V ($group[0]+' pilihan'));value=$key})
    foreach($other in $group[1]){$actions+=@{type='setVariable';variable=(V ('Tanda '+$group[0]+' '+$other));value=$(if($key -eq $other){'●'}else{'○'})}}
    Cmd 'proto.interaction.add' @{id=$id;actions=$actions}
    Cmd 'variable.bind' @{ids=@((Id ('Modal Profil/'+$group[0]+'/'+$key+'/State')));field='characters';variable=(V ('Tanda '+$group[0]+' '+$key))}
    Cmd 'variable.bind' @{ids=@($id);field='fill';variable='Light/inset'}
  }
}
Cmd 'variable.set' @{variable=(V 'Suasana');value='Pengalamanmu: Suka'}
foreach($key in @('Suka','Lumayan','Masalah')){
  $id=Id ('Modal Profil/Feedback/Suasana/'+$key)
  Cmd 'proto.interaction.clear' @{ids=@($id)}
  Cmd 'proto.interaction.add' @{id=$id;action=@{type='setVariable';variable=(V 'Suasana');value=('Pengalamanmu: '+$(if($key -eq 'Masalah'){'Ada masalah'}else{$key}))}}
}
Cmd 'node.create' @{type='text';parent=978;name='Profil · Ubah avatar';text='Ganti avatar';width=230;height=16;select=$false;props=@{fontFamily='Plus Jakarta Sans';fontStyle='SemiBold';fontSize=10;lineHeight='145%';textAutoResize='height';fill='#6251D9'}}
Batch 'profile-modal-selected-states.json'
Cmd 'variable.bind' @{ids=@((Id 'Profil · Ubah avatar'));field='fill';variable='Light/primary'}
Cmd 'proto.interaction.add' @{id=(Id 'Profil · Ubah avatar');actions=@(@{type='setVariable';variable=(V 'Avatar brouillon');expression='Avatar'},@{type='openOverlay';dest=(Id 'Modal Profil/Avatar');position='center';close_on_outside=$true;background='#24203466'})}
Batch 'profile-modal-avatar-affordance.json'
foreach($key in @('Avatar','Feedback','Tema','Kantong')){
  & $cli export $file -o (Join-Path $PSScriptRoot ('modal-profil-'+$key.ToLower()+'.png')) --node (Id ('Modal Profil/'+$key)) --scale 2
}
& $cli export $file -o (Join-Path $PSScriptRoot 'profil-dukungan.png') --node 960 --scale 2
