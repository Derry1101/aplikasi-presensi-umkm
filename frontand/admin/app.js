// API otomatis: saat dibuka dari localhost gunakan alamat backend VPS.
// Saat dibuka dari domain aplikasi, gunakan alamat yang sama (melalui Nginx).
const API = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://43.157.206.194:3000"
  : "";

// const API = ""
const token = sessionStorage.getItem("token");
const user = JSON.parse(sessionStorage.getItem("user") || "null");

const $ = (id) => document.getElementById(id);

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const bulanNama = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const S = {
  tab: "home",
  karyawan: [],
  dashboard: null,
  rekap: null,
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear()
};

if (!token || !user || user.role !== "admin") {
  sessionStorage.clear();
  location.href = "/";
}

/* ---------- ikon (garis tipis, tanpa emoji) ---------- */
const I = (p) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  home: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/>'),
  tim: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.5-5 6.5-5s5.7 1.4 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3.2 4 1.5 4.5 4.5"/>'),
  rekap: I('<path d="M5 20v-7M12 20V5M19 20v-10"/>'),
  profil: I('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/>'),
  edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  key: I('<circle cx="8" cy="15" r="3.5"/><path d="m10.5 12.5 9-9M16 7l2.5 2.5"/>'),
  trash: I('<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>'),
  l: I('<path d="m14.5 6-6 6 6 6"/>'),
  r: I('<path d="m9.5 6 6 6-6 6"/>')
};

/* ---------- status -> kelas warna ---------- */
const kelas = (s) => ({
  "Hadir": "s-hadir", "Terlambat": "s-terlambat", "Izin": "s-izin",
  "Sakit": "s-sakit", "Alfa": "s-absen", "Belum Presensi": "s-belum"
}[s] || "s-belum");

async function api(url, options = {}) {
  const response = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    sessionStorage.clear();
    location.href = "/";
    throw new Error("Sesi login sudah berakhir.");
  }

  if (!response.ok) throw new Error(data.message || "Terjadi kesalahan.");
  return data;
}

function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.className = "show";
  setTimeout(() => { element.className = ""; }, 2200);
}

function sheet(content) {
  $("sheet").innerHTML = content;
  $("sheetBg").classList.add("open");
}
function close_() { $("sheetBg").classList.remove("open"); }
$("sheetBg").addEventListener("click", (event) => { if (event.target.id === "sheetBg") close_(); });

function initials(name) {
  return String(name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
const avatar = (name) => `<div class="avs">${esc(initials(name))}</div>`;

function formatTanggal(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = String(dateString).slice(0, 10).split("-").map(Number);
  return `${day} ${bulanNama[month - 1]} ${year}`;
}
function tanggalSekarang() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function jamSekarang() {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}
function sapaan() {
  const j = Number(jamSekarang().slice(0, 2));
  return j < 11 ? "Selamat pagi" : j < 15 ? "Selamat siang" : j < 18 ? "Selamat sore" : "Selamat malam";
}

async function muatDashboard() { S.dashboard = await api("/api/admin/dashboard"); return S.dashboard; }
async function muatKaryawan() { S.karyawan = (await api("/api/users")).data || []; return S.karyawan; }
async function muatRekap() { S.rekap = await api(`/api/presensi/rekap?bulan=${S.bulan}&tahun=${S.tahun}`); return S.rekap; }

function go(tab) { S.tab = tab; render(); }

/* ================= TAB 1: BERANDA ================= */
async function home() {
  const data = await muatDashboard();
  const r = data.ringkasan;
  const daftar = data.daftarPresensi || [];
  const urutan = { "Belum Presensi": 0, "Terlambat": 1, "Hadir": 2, "Izin": 3, "Sakit": 4 };
  daftar.sort((a, b) => (urutan[a.status] ?? 9) - (urutan[b.status] ?? 9));

  const seg = [["hadir", r.hadir], ["terlambat", r.terlambat], ["izin", r.izin], ["sakit", r.sakit], ["belum", r.belumPresensi]];
  const tile = [["Hadir", r.hadir, "hadir"], ["Terlambat", r.terlambat, "terlambat"], ["Izin", r.izin, "izin"], ["Sakit", r.sakit, "sakit"], ["Belum", r.belumPresensi, "belum"]];

  return `
    <h1>${sapaan()}, ${esc(user.nama || "Admin")}</h1>
    <p class="sub">${formatTanggal(data.tanggal)}</p>

    <div class="hero">
      <span class="chip">Hari ini</span>
      <div class="big">${r.totalMasuk || 0}/${r.totalKaryawan || 0}</div>
      <p>karyawan sudah masuk hari ini</p>
    </div>

    <div class="card" style="padding:14px;margin-top:14px">
      <div class="bar">${seg.map(([k, v]) => v ? `<i class="b-${k}" style="flex:${v}"></i>` : "").join("")}</div>
      <div class="stats" style="margin-top:12px">
        ${tile.map(([l, v, k]) => `<div class="st s-${k}"><b>${v || 0}</b><span>${l}</span></div>`).join("")}
      </div>
    </div>

    <div class="hd">
      <h2>Presensi hari ini</h2>
      <button class="btn sm" onclick="izin()">Catat Izin/Sakit</button>
    </div>

    ${daftar.length ? daftar.map((item) => `
      <button class="card row" onclick="detail(${item.userId || item.id}, '${data.tanggal}')">
        ${avatar(item.nama)}
        <div class="grow">
          <b>${esc(item.nama)}</b>
          <span>${esc(item.jabatan || "Karyawan")} · ${esc(item.jamMasuk || "Belum ada jam masuk")}</span>
          ${item.jamPulang ? `<span>Pulang ${esc(item.jamPulang)}</span>` : ""}
        </div>
        <span class="chip ${kelas(item.status)}">${esc(item.status)}</span>
      </button>`).join("")
      : `<div class="card row"><div class="grow"><b>Belum ada karyawan</b><span>Tambahkan karyawan terlebih dahulu.</span></div></div>`}
  `;
}

async function detail(userId, tanggal) {
  try {
    const item = (await api(`/api/admin/presensi/foto?userId=${userId}&tanggal=${tanggal}`)).data;

    const fotoBox = (url, jam, label) => {
      const u = url ? (url.startsWith("http") ? url : `${API}${url.startsWith("/") ? "" : "/"}${url}`) : "";
      return u
        ? `<div class="ph"><img src="${esc(u)}" alt="Foto ${label}"><span class="chip">${label} ${esc(jam || "")}</span></div>`
        : `<div class="ph gone">Foto belum tersedia<span class="chip">${label}</span></div>`;
    };

    sheet(`
      <div class="row" style="padding:0;margin:0 0 14px">
        ${avatar(item.nama)}
        <div class="grow">
          <b style="font-size:18px">${esc(item.nama)}</b>
          <span>${esc(item.jabatan || "Karyawan")} · ${formatTanggal(item.tanggal)}</span>
        </div>
        <span class="chip ${kelas(item.status)}">${esc(item.status)}</span>
      </div>
      <div class="two">
        ${fotoBox(item.fotoMasuk, item.jamMasuk, "Masuk")}
        ${fotoBox(item.fotoPulang, item.jamPulang, "Pulang")}
      </div>
    `);
  } catch (error) { toast(error.message); }
}

async function izin() {
  try {
    await muatKaryawan();
    if (!S.karyawan.length) return toast("Belum ada karyawan.");

    window.statusIzin = "Izin";
    sheet(`
      <h1 style="font-size:20px;margin-bottom:16px">Catat Izin/Sakit</h1>
      <label>Karyawan</label>
      <select id="izinUser">${S.karyawan.map((k) => `<option value="${k.id}">${esc(k.nama)}</option>`).join("")}</select>
      <label>Status</label>
      <div class="seg2">
        <button id="pilihIzin" class="on" onclick="pilihStatus('Izin')">Izin</button>
        <button id="pilihSakit" onclick="pilihStatus('Sakit')">Sakit</button>
      </div>
      <p class="sub" style="margin:0 0 14px">Status dicatat untuk tanggal hari ini.</p>
      <button class="btn" onclick="simpanIzin()">Simpan</button>
    `);
  } catch (error) { toast(error.message); }
}

function pilihStatus(status) {
  window.statusIzin = status;
  $("pilihIzin").className = status === "Izin" ? "on" : "";
  $("pilihSakit").className = status === "Sakit" ? "on" : "";
}

async function simpanIzin() {
  try {
    await api("/api/admin/presensi/izin-sakit", {
      method: "POST",
      body: JSON.stringify({ userId: Number($("izinUser").value), status: window.statusIzin })
    });
    close_();
    toast("Status berhasil dicatat.");
    render();
  } catch (error) { toast(error.message); }
}

/* ================= TAB 2: TIM ================= */
async function tim() {
  await muatKaryawan();
  return `
    <div class="hd">
      <div><h1>Tim</h1><p class="sub">${S.karyawan.length} karyawan</p></div>
      <button class="btn sm" onclick="formTim()">Tambah</button>
    </div>
    <div style="margin-top:8px">
      ${S.karyawan.length ? S.karyawan.map((item) => `
        <div class="card row">
          ${avatar(item.nama)}
          <div class="grow">
            <b>${esc(item.nama)}</b>
            <span>${esc(item.jabatan || "Karyawan")} · @${esc(item.username)}</span>
          </div>
          <button class="ib" aria-label="Edit ${esc(item.nama)}" onclick="formTim(${item.id})">${IC.edit}</button>
          <button class="ib" aria-label="Reset password ${esc(item.nama)}" onclick="resetPassword(${item.id})">${IC.key}</button>
          <button class="ib" aria-label="Hapus ${esc(item.nama)}" onclick="hapusKaryawan(${item.id})">${IC.trash}</button>
        </div>`).join("")
        : `<div class="card row"><div class="grow"><b>Belum ada karyawan</b><span>Ketuk Tambah untuk membuat akun.</span></div></div>`}
    </div>
  `;
}

function formTim(id) {
  const item = id ? S.karyawan.find((k) => k.id === id) : null;
  window.editId = id || null;

  sheet(`
    <h1 style="font-size:20px;margin-bottom:16px">${id ? "Edit Karyawan" : "Karyawan Baru"}</h1>
    <label for="namaKaryawan">Nama</label>
    <input id="namaKaryawan" value="${esc(item?.nama || "")}" placeholder="Nama lengkap">
    <label for="jabatanKaryawan">Jabatan</label>
    <input id="jabatanKaryawan" value="${esc(item?.jabatan || "")}" placeholder="Contoh: Kasir">
    <label for="usernameKaryawan">Username</label>
    <input id="usernameKaryawan" value="${esc(item?.username || "")}" autocapitalize="none">
    ${id ? "" : `<label for="passwordKaryawan">Password awal</label><input id="passwordKaryawan" type="password" placeholder="Minimal 6 karakter">`}
    <button class="btn" onclick="simpanKaryawan()">${id ? "Simpan Perubahan" : "Buat Akun"}</button>
  `);
}

async function simpanKaryawan() {
  const nama = $("namaKaryawan").value.trim();
  const jabatan = $("jabatanKaryawan").value.trim();
  const username = $("usernameKaryawan").value.trim();
  if (!nama || !jabatan || !username) return toast("Semua data wajib diisi.");

  try {
    if (window.editId) {
      await api(`/api/users/${window.editId}`, { method: "PUT", body: JSON.stringify({ nama, jabatan, username }) });
    } else {
      const password = $("passwordKaryawan").value;
      if (password.length < 6) return toast("Password minimal 6 karakter.");
      await api("/api/users", { method: "POST", body: JSON.stringify({ nama, jabatan, username, password }) });
    }
    close_();
    toast("Data karyawan berhasil disimpan.");
    render();
  } catch (error) { toast(error.message); }
}

function resetPassword(id) {
  const item = S.karyawan.find((k) => k.id === id);
  sheet(`
    <h1 style="font-size:20px">Reset Password</h1>
    <p class="sub" style="margin:6px 0 16px">${esc(item?.nama || "Karyawan")}</p>
    <label for="passwordBaru">Password baru</label>
    <input id="passwordBaru" type="password" placeholder="Minimal 6 karakter">
    <button class="btn" onclick="simpanPassword(${id})">Simpan Password</button>
  `);
}

async function simpanPassword(id) {
  const password = $("passwordBaru").value;
  if (password.length < 6) return toast("Password minimal 6 karakter.");
  try {
    await api(`/api/users/${id}/password`, { method: "PUT", body: JSON.stringify({ password }) });
    close_();
    toast("Password berhasil direset.");
  } catch (error) { toast(error.message); }
}

function hapusKaryawan(id) {
  const item = S.karyawan.find((k) => k.id === id);
  sheet(`
    <h1 style="font-size:20px">Hapus karyawan?</h1>
    <p class="sub" style="margin:8px 0 18px">Akun dan seluruh riwayat presensi ${esc(item?.nama || "")} akan ikut terhapus.</p>
    <div class="seg2">
      <button onclick="close_()">Batal</button>
      <button class="danger" onclick="konfirmasiHapus(${id})">Ya, Hapus</button>
    </div>
  `);
}

async function konfirmasiHapus(id) {
  try {
    await api(`/api/users/${id}`, { method: "DELETE" });
    close_();
    toast("Karyawan berhasil dihapus.");
    render();
  } catch (error) { toast(error.message); }
}

/* ================= TAB 3: REKAP (konsep milik user) ================= */
function jumlahHariRekap() {
  const sekarang = tanggalSekarang();
  const bulanSekarang = Number(sekarang.slice(5, 7));
  const tahunSekarang = Number(sekarang.slice(0, 4));

  if (S.tahun < tahunSekarang || (S.tahun === tahunSekarang && S.bulan < bulanSekarang)) {
    return new Date(S.tahun, S.bulan, 0).getDate();
  }
  if (S.tahun === tahunSekarang && S.bulan === bulanSekarang) return Number(sekarang.slice(8, 10));
  return 0;
}

function hitungRekapKaryawan(karyawan, daftar, jumlahHari) {
  const hasil = { Hadir: 0, Terlambat: 0, Izin: 0, Sakit: 0, Alfa: 0 };
  const tanggalTercatat = new Set();

  daftar
    .filter((item) => Number(item.userId) === Number(karyawan.id))
    .forEach((item) => {
      if (hasil[item.status] !== undefined) hasil[item.status]++;
      tanggalTercatat.add(String(item.tanggal).slice(0, 10));
    });

  hasil.Alfa = Math.max(0, jumlahHari - tanggalTercatat.size);
  hasil.total = hasil.Hadir + hasil.Terlambat + hasil.Izin + hasil.Sakit + hasil.Alfa;
  return hasil;
}

function barRekap(hasil) {
  if (!hasil.total) return `<div class="bar"><i class="b-belum" style="flex:1"></i></div>`;
  return `<div class="bar">${["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"]
    .map((s) => hasil[s] ? `<i class="b-${s.toLowerCase()}" style="flex:${hasil[s]}"></i>` : "").join("")}</div>`;
}

function kartuRekap(karyawan, hasil) {
  return `
    <button class="card rk" onclick="detailRekap(${karyawan.id})">
      <div class="row">
        ${avatar(karyawan.nama)}
        <div class="grow">
          <b>${esc(karyawan.nama)}</b>
          <span>${esc(karyawan.jabatan || "Karyawan")} · Lihat rincian</span>
        </div>
        <span class="chip s-belum">${hasil.total} hari</span>
      </div>
      ${barRekap(hasil)}
      <div class="pills">
        ${["Hadir", "Terlambat", "Izin", "Sakit", "Alfa"].map((s) => `<span class="chip ${kelas(s)}">${s} ${hasil[s]}</span>`).join("")}
      </div>
    </button>
  `;
}

async function rekap() {
  const [data, karyawan] = await Promise.all([muatRekap(), muatKaryawan()]);
  const daftar = data.daftarPresensi || [];
  const jumlahHari = jumlahHariRekap();
  const kartu = karyawan.map((item) => kartuRekap(item, hitungRekapKaryawan(item, daftar, jumlahHari)));

  return `
    <h1>Rekap</h1>
    <p class="sub">Rekap kehadiran seluruh karyawan per bulan</p>
    <div class="mb">
      <button class="sq" aria-label="Bulan sebelumnya" onclick="ubahBulan(-1)">${IC.l}</button>
      <div class="mc">${bulanNama[S.bulan - 1]} ${S.tahun}</div>
      <button class="sq" aria-label="Bulan berikutnya" onclick="ubahBulan(1)">${IC.r}</button>
    </div>
    <div>
      ${kartu.length ? kartu.join("")
        : `<div class="card row"><div class="grow"><b>Belum ada karyawan</b><span>Tambahkan karyawan untuk melihat rekap.</span></div></div>`}
    </div>
  `;
}

async function detailRekap(userId) {
  try {
    const data = await muatRekap();
    const karyawan = S.karyawan.find((item) => Number(item.id) === Number(userId));
    const daftar = (data.daftarPresensi || [])
      .filter((item) => Number(item.userId) === Number(userId))
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));

    if (!karyawan) return toast("Data karyawan tidak ditemukan.");

    sheet(`
      <div class="row" style="padding:0;margin:0 0 6px">
        ${avatar(karyawan.nama)}
        <div class="grow">
          <b style="font-size:18px">${esc(karyawan.nama)}</b>
          <span>${esc(karyawan.jabatan || "Karyawan")} · ${bulanNama[S.bulan - 1]} ${S.tahun}</span>
        </div>
      </div>
      <h2>Rincian Presensi</h2>
      ${daftar.length ? daftar.map((item) => `
        <div class="card row">
          <div class="grow">
            <b>${formatTanggal(item.tanggal)}</b>
            <span>Masuk ${esc(item.jamMasuk || "-")} · Pulang ${esc(item.jamPulang || "-")}</span>
          </div>
          <span class="chip ${kelas(item.status)}">${esc(item.status)}</span>
        </div>`).join("")
        : `<div class="card row"><div class="grow"><b>Belum ada catatan</b><span>Tidak ada presensi tercatat pada periode ini.</span></div></div>`}
    `);
  } catch (error) { toast(error.message); }
}

function ubahBulan(arah) {
  S.bulan += arah;
  if (S.bulan > 12) { S.bulan = 1; S.tahun++; }
  if (S.bulan < 1) { S.bulan = 12; S.tahun--; }
  render();
}

/* ================= TAB 4: PROFIL ================= */
function profil() {
  return `
    <div class="av">${esc(initials(user.nama || "Admin"))}</div>
    <div style="text-align:center">
      <h1>${esc(user.nama || "Admin")}</h1>
      <p class="sub">@${esc(user.username || "")} · Admin</p>
    </div>

    <div class="card" style="padding:16px;margin-top:20px">
      <h2 style="margin-top:0">Ubah Profil</h2>
      <label for="namaAdmin">Nama Admin</label>
      <input id="namaAdmin" value="${esc(user.nama || "")}" placeholder="Masukkan nama">
      <label for="passwordAdmin">Password Baru</label>
      <input id="passwordAdmin" type="password" placeholder="Kosongkan jika tidak ingin mengubah">
      <label for="konfirmasiPasswordAdmin">Konfirmasi Password Baru</label>
      <input id="konfirmasiPasswordAdmin" type="password" placeholder="Ulangi password baru">
      <button class="btn" onclick="simpanProfilAdmin()">Simpan Perubahan</button>
    </div>

    <button class="btn out" style="margin-top:16px" onclick="logoutAsk()">Keluar</button>
  `;
}

async function simpanProfilAdmin() {
  const nama = $("namaAdmin").value.trim();
  const password = $("passwordAdmin").value;
  const konfirmasi = $("konfirmasiPasswordAdmin").value;

  if (!nama) return toast("Nama tidak boleh kosong.");
  if (password && password.length < 6) return toast("Password minimal 6 karakter.");
  if (password !== konfirmasi) return toast("Konfirmasi password tidak cocok.");

  try {
    const data = await api("/api/admin/profil", {
      method: "PUT",
      body: JSON.stringify({ nama, password: password || undefined })
    });
    user.nama = data.data.nama;
    sessionStorage.setItem("user", JSON.stringify(user));
    toast("Profil berhasil diperbarui.");
    render();
  } catch (error) { toast(error.message); }
}

function logoutAsk() {
  sheet(`
    <h1 style="font-size:20px">Keluar dari akun?</h1>
    <p class="sub" style="margin:8px 0 18px">Anda perlu login kembali untuk membuka aplikasi.</p>
    <div class="seg2">
      <button onclick="close_()">Batal</button>
      <button class="danger" onclick="logout()">Ya, Keluar</button>
    </div>
  `);
}

function logout() {
  sessionStorage.clear();
  location.href = "/";
}

/* ================= RENDER ================= */
async function render() {
  const view = $("view");
  const nav = $("nav");
  const halaman = { home, tim, rekap, profil };
  const judul = { home: "Beranda", tim: "Tim", rekap: "Rekap", profil: "Profil" };

  nav.style.display = "flex";
  view.innerHTML = `<div class="card" style="padding:16px;color:var(--mut)">Memuat data...</div>`;
  $("topTitle").textContent = judul[S.tab];

  try {
    view.innerHTML = await halaman[S.tab]();
    view.scrollTop = 0;
  } catch (error) {
    view.innerHTML = `
      <div class="card" style="padding:16px">
        <b>Gagal memuat halaman</b>
        <p class="sub" style="margin:6px 0 14px">${esc(error.message)}</p>
        <button class="btn" onclick="render()">Coba Lagi</button>
      </div>`;
  }

  nav.innerHTML = [["home", "Beranda"], ["tim", "Tim"], ["rekap", "Rekap"], ["profil", "Profil"]]
    .map(([key, label]) => `<button class="${S.tab === key ? "on" : ""}" onclick="go('${key}')">${IC[key]}${label}</button>`).join("");
}

render();