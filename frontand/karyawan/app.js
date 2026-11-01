const C={hadir:'var(--lime)',terlambat:'var(--sun)',izin:'var(--sky)',sakit:'var(--pink)'};
const L={hadir:'Hadir',terlambat:'Telat',izin:'Izin',sakit:'Sakit'};
C.absen='#FF9F43';C.belum='var(--lil)';L.absen='Absen';L.belum='Belum';
const S={ym:{y:2026,m:9},py:2026,tab:'home',now:'07:55',today:null,nick:'Andi',step:'live',hist:[
{d:'05/10/2026',h:'Sen',i:'07:55',o:'17:02',st:'hadir'},{d:'02/10/2026',h:'Jum',i:'08:15',o:'17:00',st:'terlambat'},
{d:'01/10/2026',h:'Kam',i:'07:49',o:'17:05',st:'hadir'},{d:'30/09/2026',h:'Rab',st:'izin',note:'Urus KTP'},
{d:'29/09/2026',h:'Sel',i:'07:52',o:'17:01',st:'hadir'},{d:'28/09/2026',h:'Sen',i:'07:58',o:'17:00',st:'hadir'}]};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
function toast(m){const t=$('toast');t.textContent=m;t.className='show';setTimeout(()=>t.className='',2200)}
function sheet(h){$('sheet').innerHTML=h;$('sheetBg').classList.add('open')}
function close_(){$('sheetBg').classList.remove('open')}
$('sheetBg').onclick=e=>{if(e.target.id==='sheetBg'&&!window._cam)close_()};
function go(t){S.tab=t;render()}

function home(){const t=S.today;
 let bg='var(--lil)',big='Belum masuk',sm='Jam masuk paling lambat 08:00';
 if(t&&!t.o){bg=C[t.st];big=t.st==='hadir'?'Udah masuk':'Masuk, tapi telat';sm='Jam masuk '+t.i+(t.st==='hadir'?'. Tepat waktu, mantap!':'. Besok lebih pagi ya.')}
 if(t&&t.o){bg='var(--sky)';big='Udah pulang';sm='Pulang '+t.o+'. Sampai ketemu besok 👋'}
 const wk=[...S.hist.slice(0,5).reverse().map(x=>[x.h,x.st]),['Sel',t?t.st:'']];
 return `<h1>Halo, ${esc(S.nick)} 👋</h1><p class="sub">Selasa, 6 Oktober 2026</p>
 <div class="bx" style="background:${bg};padding:18px;margin-top:18px"><p style="font-weight:600">Status hari ini</p><div class="big" style="font-size:36px;margin-top:6px">${big}</div><p style="margin-top:8px;font-weight:600">${sm}</p></div>
 <div class="act"><button class="bx btn" ${t?'disabled':''} onclick="cam('masuk')">${t?'Udah masuk ✓':'📸 Masuk'}</button>
 <button class="bx btn alt" style="background:var(--sky);color:var(--on)" ${!t||t.o?'disabled':''} onclick="cam('pulang')">${t&&t.o?'Udah pulang ✓':'🏃 Pulang'}</button></div>
 <h2>Minggu ini</h2><div class="bx card" style="padding:14px"><div class="wk">${wk.map(([h,s])=>`<div>${h}<i style="background:${s?C[s]:'var(--card)'}"></i></div>`).join('')}</div></div>
 <h2>Demo jam</h2><div class="chips" style="margin-top:0">${['07:55','08:20','17:02'].map(x=>`<button class="chip ${S.now===x?'on':''}" onclick="S.now='${x}';render()">${x}</button>`).join('')}</div>
 <p class="sub" style="font-size:13px">Cuma buat preview desain: ngatur jam saat presensi.</p>`}

function cam(j){window._j=j;window._cam=1;S.step='live';camView()}
function camView(){const j=window._j,l=S.step==='live';
 sheet(`<h1 style="font-size:26px;margin-bottom:14px">Selfie ${j==='masuk'?'masuk':'pulang'}</h1>
 <div class="vf"><div class="ov"></div><div class="em">${l?'🙂':'😎'}</div><p>${l?'Posisikan wajah di dalam lingkaran':'Cek dulu fotonya'}</p></div>
 ${l?`<button class="shutter" aria-label="Ambil foto" onclick="S.step='prev';camView()"></button><button class="btn alt bx" style="margin-top:16px" onclick="window._cam=0;close_()">Batal</button>`
 :`<div class="seg2" style="margin:16px 0 0"><button class="bx" onclick="S.step='live';camView()">Ambil ulang</button><button class="bx" style="background:var(--lime);color:var(--on)" onclick="usePhoto()">Gunakan foto</button></div>`}`)}
function usePhoto(){window._cam=0;const j=window._j,n=S.now;
 if(j==='masuk')S.today={i:n,o:'',st:n>'08:00'?'terlambat':'hadir'};else S.today.o=n;
 close_();toast(`Presensi ${j} berhasil, jam ${n}`);render()}

const MN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],HR=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const JOIN={y:2025,m:10},NOW={y:2026,m:9,d:6};
const k2=(y,m,d)=>String(d).padStart(2,'0')+'/'+String(m+1).padStart(2,'0')+'/'+y;
function rec(y,m,d){
 if(y===NOW.y&&m===NOW.m&&d===NOW.d)return S.today?{...S.today}:{st:'belum'};
 const w=new Date(y,m,d).getDay();if(w===0||w===6)return{st:'libur'};
 const e=S.hist.find(x=>x.d===k2(y,m,d));if(e)return e;
 const r=(Math.imul(y*400+m*31+d,2654435761)>>>0)%100,p=n=>String(n).padStart(2,'0'),o='17:'+p(r%10);
 if(r<66)return{st:'hadir',i:'07:'+p(40+r%19),o};
 if(r<78)return{st:'terlambat',i:'08:'+p(5+r%35),o};
 if(r<86)return{st:'izin',note:['Urus KTP','Acara keluarga','Keperluan pribadi'][r%3]};
 if(r<92)return{st:'sakit',note:['Demam','Flu','Sakit kepala'][r%3]};
 return{st:'absen'}}
function mv(n){let{y,m}=S.ym;m+=n;if(m<0){m=11;y--}if(m>11){m=0;y++}S.ym={y,m};render()}
function riwayat(){const{y,m}=S.ym,last=(y===NOW.y&&m===NOW.m)?NOW.d:new Date(y,m+1,0).getDate(),days=[];
 for(let d=last;d>=1;d--)days.push({d,r:rec(y,m,d)});
 const c={hadir:0,terlambat:0,izin:0,sakit:0,absen:0};days.forEach(x=>{if(x.r.st in c)c[x.r.st]++});
 const pv=!(y===JOIN.y&&m===JOIN.m),nx=!(y===NOW.y&&m===NOW.m);
 return `<h1>Riwayat</h1>
 <div class="mp"><button class="bx" aria-label="Bulan sebelumnya" ${pv?'':'disabled'} onclick="mv(-1)">‹</button><button class="bx grow" onclick="pickM()">${MN[m]} ${y} ▾</button><button class="bx" aria-label="Bulan berikutnya" ${nx?'':'disabled'} onclick="mv(1)">›</button></div>
 <div class="chips" style="margin-top:8px">${Object.keys(c).map(s=>`<span class="pill" style="background:${C[s]};padding:8px 14px">${L[s]} ${c[s]}</span>`).join('')}</div>
 ${days.map(({d,r})=>{const w=HR[new Date(y,m,d).getDay()],t=`${w}, ${d} ${MN[m].slice(0,3)}`;
 if(r.st==='libur')return `<div class="row" style="opacity:.5;padding:4px 12px;margin-bottom:8px"><span class="sub" style="margin:0">${t} · Libur</span></div>`;
 return `<button class="bx card row" onclick="det(${d})"><div class="av" style="background:${C[r.st]};border-radius:14px">${d}</div><div class="grow"><b>${t}</b><span>${r.i?`Masuk ${r.i}${r.o?' · Pulang '+r.o:''}`:esc(r.note||(r.st==='absen'?'Tidak ada presensi':'Belum presensi'))}</span></div><span class="pill" style="background:${C[r.st]}">${L[r.st]}</span></button>`}).join('')}`}
function pickM(){S.py=S.ym.y;pm()}
function pm(){const y=S.py,cur=S.ym;
 sheet(`<h1 style="font-size:26px;margin-bottom:14px">Pilih bulan</h1>
 <div class="mp" style="margin:0 0 14px"><button class="bx" aria-label="Tahun sebelumnya" ${y<=JOIN.y?'disabled':''} onclick="S.py--;pm()">‹</button><div class="bx grow" style="background:var(--lime);color:var(--on);font-size:20px">${y}</div><button class="bx" aria-label="Tahun berikutnya" ${y>=NOW.y?'disabled':''} onclick="S.py++;pm()">›</button></div>
 <div class="mg">${MN.map((n,i)=>{const off=(y===JOIN.y&&i<JOIN.m)||(y===NOW.y&&i>NOW.m),on=cur.y===y&&cur.m===i;return `<button class="chip" style="padding:14px 0;${on?'background:var(--ink);color:var(--bg)':''}" ${off?'disabled':''} onclick="S.ym={y:${y},m:${i}};close_();render()">${n.slice(0,3)}</button>`}).join('')}</div>`)}
function det(d){const{y,m}=S.ym,x=rec(y,m,d),t=`${HR[new Date(y,m,d).getDay()]}, ${d} ${MN[m]} ${y}`;
 sheet(`<h1 style="font-size:24px">${t}</h1><span class="pill" style="background:${C[x.st]};display:inline-block;margin-top:8px">${L[x.st]}</span>
 ${x.i?`<div class="selfies"><div class="selfie" style="background:var(--lime)">😎<small>Masuk ${x.i}</small></div><div class="selfie" style="background:${x.o?'var(--sky)':'var(--card)'}">${x.o?'🙂':'⏳'}<small>${x.o?'Pulang '+x.o:'Belum pulang'}</small></div></div>`:`<p class="sub" style="margin:16px 0">${x.note?'Keterangan: '+esc(x.note):x.st==='absen'?'Tidak ada presensi dan tidak ada keterangan izin/sakit.':'Belum ada presensi hari ini.'}</p>`}`)}

function profil(){return `<div style="text-align:center"><div class="av" style="width:96px;height:96px;font-size:34px;margin:6px auto 12px;background:var(--lime);box-shadow:4px 4px 0 var(--ink)">AP</div><h1 style="font-size:28px">Andi Pratama</h1><p class="sub">@andi</p></div>
 <h2>Ubah profil</h2><label>Nama panggilan</label><input id="nk" value="${esc(S.nick)}">
 <button class="bx btn" onclick="S.nick=$('nk').value.trim()||S.nick;toast('Profil disimpan');render()">Simpan</button>
 <h2>Data kerja</h2><div class="bx card" style="padding:6px 16px">${[['Jabatan','Kasir'],['Role','Karyawan']].map(([a,b])=>`<div style="display:flex;justify-content:space-between;padding:12px 0"><span class="sub" style="margin:0">${a}</span><b>${b}</b></div>`).join('')}</div>
 <p class="lock" style="margin-top:10px">🔒 Jabatan dan role cuma bisa diubah admin.</p>
 <button class="bx btn alt" style="margin-top:8px;background:var(--pink);color:var(--on)" onclick="toast('Keluar dari akun (demo)')">Logout</button>`}

function render(){const m={home,riwayat,profil};$('view').innerHTML=m[S.tab]();$('view').scrollTop=0;
 $('nav').innerHTML=[['home','🏠','Beranda'],['riwayat','🗓️','Riwayat'],['profil','😎','Profil']].map(([k,i,l])=>`<button class="${S.tab===k?'on':''}" onclick="go('${k}')"><span>${i}</span>${l}</button>`).join('')}
render();
