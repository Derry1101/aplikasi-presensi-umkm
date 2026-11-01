const C={hadir:'var(--lime)',terlambat:'var(--sun)',izin:'var(--sky)',sakit:'var(--pink)',belum:'var(--lil)'};
const L={hadir:'Hadir',terlambat:'Telat',izin:'Izin',sakit:'Sakit',belum:'Belum'};
const E={hadir:'✅',terlambat:'⏰',izin:'📝',sakit:'🤒'};
C.absen='#FF9F43';L.absen='Absen';
const S={ym:{y:2026,m:9},py:2026,adm:{n:'Owner',u:'admin',pw:'admin123'},out:false,ov:{},mode:'hari',day:6,tab:'home',f:'all',q:'',emp:[
{id:1,n:'Andi Pratama',r:'Kasir',st:'hadir',i:'07:55',o:'17:02',on:1,rk:[20,3,1,1]},
{id:2,n:'Sinta Maharani',r:'Barista',st:'terlambat',i:'08:15',o:'',on:1,rk:[16,6,2,1]},
{id:3,n:'Budi Santoso',r:'Gudang',st:'hadir',i:'07:48',o:'',on:1,rk:[22,1,1,1]},
{id:4,n:'Dewi Lestari',r:'Kasir',st:'izin',note:'Urus KTP',on:1,rk:[19,2,3,1]},
{id:5,n:'Raka Aditya',r:'Kurir',st:'sakit',note:'Demam',on:1,rk:[18,4,0,3]},
{id:6,n:'Mita Anggraini',r:'Admin',st:'hadir',i:'07:58',o:'',on:1,rk:[23,1,1,0]},
{id:7,n:'Fajar Nugroho',r:'Barista',st:null,on:1,rk:[17,5,2,1]},
{id:8,n:'Nadia Putri',r:'Pramuniaga',st:'hadir',i:'07:50',o:'',on:1,rk:[21,2,1,1]}]};
const cols=['var(--lime)','var(--sky)','var(--pink)','var(--sun)','var(--lil)'];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const ini=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const act=()=>S.emp;
const cnt=k=>act().filter(e=>(e.st||'belum')===k).length;
const av=e=>`<div class="av" style="background:${cols[e.id%5]}">${esc(ini(e.n))}</div>`;
function toast(m){const t=$('toast');t.textContent=m;t.className='show';setTimeout(()=>t.className='',1800)}
function sheet(h){$('sheet').innerHTML=h;$('sheetBg').classList.add('open')}
function close_(){$('sheetBg').classList.remove('open')}
$('sheetBg').onclick=e=>{if(e.target.id==='sheetBg')close_()};
function go(t,f){S.tab=t;if(f)S.f=f;render()}

function home(){const tot=S.emp.length,masuk=cnt('hadir')+cnt('terlambat'),ord={belum:0,terlambat:1,hadir:2,izin:3,sakit:4};
 const rs=S.emp.map(e=>[e,ar(e,2026,9,6)]).sort((a,b)=>ord[a[1].st]-ord[b[1].st]);
 return `<h1>Pagi, Bos 👋</h1><p class="sub">Selasa, 6 Oktober 2026</p>
 <div class="bx hero"><div class="big">${masuk}/${tot}</div><p style="font-weight:600;margin-top:6px">karyawan udah masuk hari ini</p>
 <div class="seg">${['hadir','terlambat','izin','sakit'].map(k=>`<i style="flex:${cnt(k)};background:${C[k]}"></i>`).join('')}<i style="flex:${cnt('belum')}"></i></div></div>
 <div class="grid">${['hadir','terlambat','izin','sakit'].map(k=>`<div class="bx tile" style="background:${C[k]}"><span>${E[k]}</span><b>${cnt(k)}</b>${L[k]}</div>`).join('')}</div>
 <div style="display:flex;justify-content:space-between;align-items:center"><h2>Hari ini</h2><button class="bx pill" style="background:var(--sky);padding:10px 14px;font-weight:800" onclick="izin()">+ Izin/Sakit</button></div>
 ${rs.length?rs.map(([e,r])=>prow(e,2026,9,6,r)).join(''):'<div class="bx card row"><div class="grow"><b>Belum ada karyawan</b><span>Tambah dulu di tab Tim.</span></div></div>'}`}
const KEEP=new Date(2026,6,6),HR=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const dim=(y,m)=>new Date(y,m+1,0).getDate(),isCur=(y,m)=>y===2026&&m===9,lastD=(y,m)=>isCur(y,m)?6:dim(y,m);
const wk=(y,m,d)=>{const w=new Date(y,m,d).getDay();return w===0||w===6};
const hasPh=(y,m,d)=>new Date(y,m,d)>=KEEP;
function ar(e,y,m,d){
 if(wk(y,m,d)||d>lastD(y,m)||y*12+m<2025*12+10)return null;
 const ovr=S.ov[`${e.id}|${y}-${m}-${d}`];if(ovr)return{...ovr};
 if(isCur(y,m)&&d===6)return{st:e.st||'belum',i:e.i,o:e.o,note:e.note};
 if(e.nw)return null;
 const s=(Math.imul(e.id*977+y*400+m*31+d,2654435761)>>>0)%100,p=n=>String(n).padStart(2,'0'),o='17:'+p(s%10);
 if(s<66)return{st:'hadir',i:'07:'+p(40+s%19),o};
 if(s<78)return{st:'terlambat',i:'08:'+p(5+s%35),o};
 if(s<86)return{st:'izin',note:['Urus KTP','Acara keluarga','Keperluan pribadi'][s%3]};
 if(s<92)return{st:'sakit',note:['Demam','Flu','Sakit kepala'][s%3]};
 return{st:'absen'}}
const th=(ok,em,bg)=>`<div class="th" style="background:${ok?bg:'var(--bg)'};${ok?'':'border-style:dashed;opacity:.7'}">${ok?em:'🫥'}</div>`;
function prow(e,y,m,d,r,lbl,back){const ok=hasPh(y,m,d),k=r.st,today=isCur(y,m)&&d===6;
 const ph=r.i?`<div class="thp">${th(ok,'😎','var(--lime)')}${r.o?th(ok,'🙂','var(--sky)'):'<div class="th" style="background:var(--card)">⏳</div>'}</div>`:`<div class="thp"><div class="th" style="background:${C[k]}">${{izin:'📝',sakit:'🤒',belum:'⏳',absen:'❌'}[k]}</div></div>`;
 const mid=`<div class="grow"><b>${esc(lbl||e.n)}</b><span>${r.i?r.i+(r.o?' - '+r.o:''):esc(r.note||(k==='absen'?'Tidak ada presensi':'Belum presensi'))}</span></div>`;
 if(k==='belum'&&today)return `<div class="bx card row">${ph}${mid}<button class="pill" style="background:var(--sky)" onclick="izin(${e.id})">Izin/Sakit</button></div>`;
 return `<button class="bx card row" onclick="detail(${e.id},${y},${m},${d}${back?',1':''})">${ph}${mid}<span class="pill" style="background:${C[k]}">${L[k]}</span></button>`}
function personView(id){const e=S.emp.find(x=>x.id===id),{y,m}=S.ym;let rows='';
 for(let d=lastD(y,m);d>=1;d--){const r=ar(e,y,m,d);if(r)rows+=prow(e,y,m,d,r,`${HR[new Date(y,m,d).getDay()]}, ${d} ${MN[m].slice(0,3)}`,1)}
 sheet(`<div class="row" style="padding:0;margin:0 0 4px">${av(e)}<div class="grow"><b style="font-size:20px">${esc(e.n)}</b><span>${MN[m]} ${y}</span></div></div><p class="sub" style="font-size:13px;margin-bottom:10px">📸 Foto disimpan 3 bulan.</p>${rows||'<p class="sub">Belum ada data.</p>'}`)}
function detail(id,y,m,d,back){const e=S.emp.find(x=>x.id===id),r=ar(e,y,m,d),k=r.st,ok=hasPh(y,m,d),ex=new Date(y,m+3,d);
 const t=`${HR[new Date(y,m,d).getDay()]}, ${d} ${MN[m]} ${y}`,exs=`${ex.getDate()} ${MN[ex.getMonth()].slice(0,3)} ${ex.getFullYear()}`;
 const box=(em,bg,lab)=>`<div class="selfie" style="background:${ok?bg:'var(--card)'};${ok?'':'border-style:dashed'}">${ok?em:'🫥'}<small>${ok?lab:'Foto sudah dihapus otomatis'}</small></div>`;
 sheet(`${back?`<button class="chip" style="margin-bottom:12px" onclick="personView(${id})">‹ Kembali</button>`:''}<div class="row" style="padding:0;margin:0">${av(e)}<div class="grow"><b style="font-size:20px">${esc(e.n)}</b><span>${t}</span></div><span class="pill" style="background:${C[k]}">${L[k]}</span></div>
 ${r.i?`<div class="selfies">${box('😎','var(--lime)','Masuk '+r.i)}${r.o?box('🙂','var(--sky)','Pulang '+r.o):'<div class="selfie" style="background:var(--card)">⏳<small>Belum pulang</small></div>'}</div>`:`<p class="sub" style="margin:16px 0">${r.note?'Keterangan: '+esc(r.note):k==='absen'?'Tidak ada presensi dan tidak ada keterangan izin/sakit.':'Belum ada presensi hari ini.'}</p>`}
 `)}

function izin(id){window._t='izin';
 sheet(`<h1 style="font-size:26px;margin-bottom:16px">Catat izin/sakit</h1>
 <label>Karyawan</label><select id="iu">${S.emp.map(e=>`<option value="${e.id}" ${e.id===id?'selected':''}>${esc(e.n)}</option>`).join('')}</select>
 <label>Tanggal</label><input id="it" type="date" value="2026-10-06" min="2025-11-01" max="2026-10-06">
 <div class="seg2"><button id="bi" class="on" style="background:var(--sky)" onclick="pick('izin')">📝 Izin</button><button id="bs" onclick="pick('sakit')">🤒 Sakit</button></div>
 <label>Keterangan</label><input id="ik" placeholder="Contoh: demam, urusan keluarga">
 <button class="bx btn" onclick="saveIzin()">Simpan</button>`)}
function pick(t){window._t=t;$('bi').className=t==='izin'?'on':'';$('bs').className=t==='sakit'?'on':'';$('bi').style.background=t==='izin'?'var(--sky)':'';$('bs').style.background=t==='sakit'?'var(--pink)':''}
function saveIzin(){const e=S.emp.find(x=>x.id==$('iu').value),v=$('it').value;if(!e||!v){toast('Pilih karyawan dan tanggal');return}
 const[y,mo,d]=v.split('-').map(Number),m=mo-1;
 if(y*12+m<2025*12+10||y*12+m>2026*12+9||(isCur(y,m)&&d>6)){toast('Tanggal di luar rentang');return}
 if(wk(y,m,d)){toast('Tanggal itu hari libur');return}
 const o={st:window._t,note:$('ik').value.trim()||'-'};S.ov[`${e.id}|${y}-${m}-${d}`]=o;
 if(isCur(y,m)&&d===6){e.st=o.st;e.note=o.note;e.i=e.o=''}
 close_();toast(`${L[o.st]} tersimpan untuk ${e.n.split(' ')[0]}`);render()}
const MN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const JOIN={y:2025,m:10},NOW={y:2026,m:9};
const un=e=>e.u||e.n.split(' ')[0].toLowerCase();
const ib=(l,i,f)=>`<button class="bx ib" aria-label="${l}" onclick="${f}">${i}</button>`;
function tim(){return `<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h1>Tim</h1><p class="sub">${S.emp.length} karyawan</p></div><button class="bx pill" style="background:var(--lime);padding:10px 14px;font-weight:800" onclick="formTim()">+ Tambah</button></div>
 <div style="margin-top:18px">${S.emp.length?S.emp.map(e=>`<div class="bx card row">${av(e)}<div class="grow"><b>${esc(e.n)}</b><span>${esc(e.r)} · @${esc(un(e))}</span></div>${ib('Edit '+esc(e.n),'✏️',`formTim(${e.id})`)}${ib('Hapus '+esc(e.n),'🗑️',`del_(${e.id})`)}</div>`).join(''):`<div class="bx card row"><div class="grow"><b>Belum ada karyawan</b><span>Ketuk + Tambah buat bikin akun pertama.</span></div></div>`}</div>`}
function formTim(id){const e=id?S.emp.find(x=>x.id===id):{};window._eid=id||0;
 sheet(`<h1 style="font-size:26px;margin-bottom:16px">${id?'Edit karyawan':'Karyawan baru'}</h1>
 <label>Nama</label><input id="tn" value="${esc(e.n||'')}" placeholder="Nama lengkap"><label>Jabatan</label><input id="tj" value="${esc(e.r||'')}" placeholder="Contoh: Kasir">
 <label>Username</label><input id="tu" value="${esc(id?un(e):'')}" autocapitalize="none"><label>${id?'Password baru':'Password awal'}</label><input id="tp" type="password" placeholder="${id?'Kosongkan jika tidak diubah':'Min. 6 karakter'}">
 <button class="bx btn" onclick="saveTim()">${id?'Simpan perubahan':'Buat akun'}</button>`)}
function saveTim(){const id=window._eid,n=$('tn').value.trim(),j=$('tj').value.trim(),u=$('tu').value.trim(),p=$('tp').value;
 if(!n||!u||(!id&&!p)||(p&&p.length<6)){toast('Isi nama, username, dan password (min. 6)');return}
 if(S.emp.some(x=>x.id!==id&&un(x)===u)){toast('Username udah dipakai');return}
 if(id){const e=S.emp.find(x=>x.id===id);e.n=n;e.r=j||e.r;e.u=u}else S.emp.push({id:Date.now()%1e6,n,r:j||'Staf',u,st:null,nw:1,rk:[0,0,0,0,0]});
 close_();toast(id?'Perubahan disimpan':'Akun dibuat');render()}
function del_(id){const e=S.emp.find(x=>x.id===id);window._eid=id;
 sheet(`<h1 style="font-size:26px">Hapus ${esc(e.n.split(' ')[0])}?</h1><p class="sub" style="margin:10px 0 18px">Akun dan semua riwayat presensi ${esc(e.n)} bakal ikut kehapus. Ini nggak bisa dibatalin.</p>
 <div class="seg2"><button class="bx" onclick="close_()">Batal</button><button class="bx" style="background:var(--pink);color:var(--on)" onclick="doDel()">Ya, hapus</button></div>`)}
function doDel(){S.emp=S.emp.filter(x=>x.id!==window._eid);close_();toast('Karyawan dihapus');render()}

function rk(e,y,m){if(e.nw)return[0,0,0,0,0];if(y===NOW.y&&m===NOW.m)return[...e.rk.slice(0,4),e.rk[4]||0];
 const s=Math.imul(e.id*977+y*13+m,2654435761)>>>0;return[16+s%7,(s>>3)%5,(s>>6)%4,(s>>9)%3,(s>>12)%2]}
function mv(n){let{y,m}=S.ym;m+=n;if(m<0){m=11;y--}if(m>11){m=0;y++}S.ym={y,m};render()}
function pickM(){S.py=S.ym.y;pm()}
function pm(){const y=S.py,cur=S.ym;
 sheet(`<h1 style="font-size:26px;margin-bottom:14px">Pilih bulan</h1>
 <div class="mp" style="margin:0 0 14px"><button class="bx" aria-label="Tahun sebelumnya" ${y<=JOIN.y?'disabled':''} onclick="S.py--;pm()">‹</button><div class="bx grow" style="background:var(--lime);color:var(--on);font-size:20px">${y}</div><button class="bx" aria-label="Tahun berikutnya" ${y>=NOW.y?'disabled':''} onclick="S.py++;pm()">›</button></div>
 <div class="mg">${MN.map((n,i)=>{const off=(y===JOIN.y&&i<JOIN.m)||(y===NOW.y&&i>NOW.m),on=cur.y===y&&cur.m===i;return `<button class="chip" style="padding:14px 0;${on?'background:var(--ink);color:var(--bg)':''}" ${off?'disabled':''} onclick="S.ym={y:${y},m:${i}};close_();render()">${n.slice(0,3)}</button>`}).join('')}</div>`)}
function rekap(){const{y,m}=S.ym,pv=!(y===JOIN.y&&m===JOIN.m),nx=!(y===NOW.y&&m===NOW.m),K=['hadir','terlambat','izin','sakit','absen'];
 return `<h1>Rekap</h1>
 <div class="mp"><button class="bx" aria-label="Bulan sebelumnya" ${pv?'':'disabled'} onclick="mv(-1)">‹</button><button class="bx grow" onclick="pickM()">${MN[m]} ${y} ▾</button><button class="bx" aria-label="Bulan berikutnya" ${nx?'':'disabled'} onclick="mv(1)">›</button></div>
 <div style="margin-top:18px">${S.emp.map(e=>{const r=rk(e,y,m);
 return `<div class="bx card" style="padding:14px;margin-bottom:14px"><button class="row" style="padding:0;margin:0 0 10px;width:100%;text-align:left" onclick="personView(${e.id})">${av(e)}<div class="grow"><b>${esc(e.n)}</b><span>${esc(e.r)} · Lihat harian ›</span></div></button>
 <div class="seg" style="margin:0 0 10px;border-color:var(--ink)">${r.map((v,x)=>`<i style="flex:${v};background:${C[K[x]]}"></i>`).join('')}</div>
 <div style="display:flex;gap:6px;flex-wrap:wrap">${r.map((v,x)=>`<span class="pill" style="background:${C[K[x]]}">${L[K[x]]} ${v}</span>`).join('')}</div></div>`}).join('')}</div>`}

function profil(){return `<div style="text-align:center"><div class="av" style="width:96px;height:96px;font-size:34px;margin:6px auto 12px;background:var(--lime);box-shadow:4px 4px 0 var(--ink)">${esc(ini(S.adm.n))}</div><h1 style="font-size:28px">${esc(S.adm.n)}</h1><p class="sub">@${esc(S.adm.u)} · Admin</p></div>
 <h2>Ubah akun</h2><label>Username</label><input id="au" value="${esc(S.adm.u)}" autocapitalize="none">
 <label>Password lama</label><input id="ao" type="password" placeholder="Wajib diisi (demo: admin123)"><label>Password baru</label><input id="an" type="password" placeholder="Kosongkan jika tidak diganti">
 <button class="bx btn" onclick="saveAdm()">Simpan</button>
 <button class="bx btn alt" style="margin-top:16px;background:var(--pink);color:var(--on)" onclick="logoutAsk()">Logout</button>`}
function saveAdm(){const u=$('au').value.trim(),o=$('ao').value,n=$('an').value;
 if(!u){toast('Username nggak boleh kosong');return}
 if(o!==S.adm.pw){toast('Password lama salah');return}
 if(n&&n.length<6){toast('Password baru min. 6 karakter');return}
 if(S.emp.some(x=>un(x)===u)){toast('Username udah dipakai');return}
 S.adm.u=u;if(n)S.adm.pw=n;toast('Akun diperbarui');render()}
function logoutAsk(){sheet(`<h1 style="font-size:26px">Keluar dari akun?</h1><p class="sub" style="margin:10px 0 18px">Kamu perlu login lagi buat buka aplikasi.</p>
 <div class="seg2"><button class="bx" onclick="close_()">Batal</button><button class="bx" style="background:var(--pink);color:var(--on)" onclick="S.out=true;close_();render()">Ya, keluar</button></div>`)}
function loginV(){return `<div style="text-align:center;margin-top:40px"><div style="font-size:64px">⚡</div><h1>Presensi UMKM</h1><p class="sub">Login admin</p></div>
 <div style="margin-top:28px"><label>Username</label><input id="lu" autocapitalize="none"><label>Password</label><input id="lp" type="password"><button class="bx btn" onclick="doLogin()">Login</button></div>`}
function doLogin(){if($('lu').value.trim()===S.adm.u&&$('lp').value===S.adm.pw){S.out=false;S.tab='home';render()}else toast('Username atau password salah.')}
function render(){$('nav').style.display=S.out?'none':'flex';if(S.out){$('view').innerHTML=loginV();return}
 const m={home,tim,rekap,profil};$('view').innerHTML=m[S.tab]();$('view').scrollTop=0;
 $('nav').innerHTML=[['home','🏠','Beranda'],['tim','👥','Tim'],['rekap','📊','Rekap'],['profil','😎','Profil']].map(([k,i,l])=>`<button class="${S.tab===k?'on':''}" onclick="go('${k}',${k==='pres'?"'all'":'null'})"><span>${i}</span>${l}</button>`).join('')}
render();
