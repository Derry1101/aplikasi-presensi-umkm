
const API = "http://43.157.206.194:3000";

const token = sessionStorage.getItem("token");
const user = JSON.parse(sessionStorage.getItem("user") || "null");

const $ = (id) => document.getElementById(id);

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const warna = [
  "var(--lime)",
  "var(--sky)",
  "var(--pink)",
  "var(--sun)",
  "var(--lil)"
];

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
  tahun: new Date().getFullYear(),
  fotoTanggal: null,
  fotoUserId: null
};

if (!token || !user || user.role !== "admin") {
  sessionStorage.clear();
  location.href = "/";
}

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

  if (!response.ok) {
    throw new Error(data.message || "Terjadi kesalahan.");
  }

  return data;
}

function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.className = "show";

  setTimeout(() => {
    element.className = "";
  }, 2200);
}

function sheet(content) {
  $("sheet").innerHTML = content;
  $("sheetBg").classList.add("open");
}

function close_() {
  $("sheetBg").classList.remove("open");
}

$("sheetBg").addEventListener("click", (event) => {
  if (event.target.id === "sheetBg") close_();
});

function initials(name) {
  return String(name || "?")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatar(name, id = 0) {
  return `<div class="av" style="background:${warna[id % warna.length]}">${esc(initials(name))}</div>`;
}

function statusColor(status) {
  const colors = {
    "Hadir": "var(--lime)",
    "Terlambat": "var(--sun)",
    "Izin": "var(--sky)",
    "Sakit": "var(--pink)",
    "Alfa": "#FF8A00",
    "Belum Presensi": "var(--lil)"
  };

  return colors[status] || "var(--lil)";
}

function statusEmoji(status) {
  const icons = {
    "Hadir": "✅",
    "Terlambat": "⏰",
    "Izin": "📝",
    "Sakit": "🤒",
    "Belum Presensi": "⏳"
  };

  return icons[status] || "•";
}

function formatTanggal(dateString) {
  if (!dateString) return "-";

  const [year, month, day] = String(dateString).slice(0, 10).split("-").map(Number);

  return `${day} ${bulanNama[month - 1]} ${year}`;
}

function tanggalSekarang() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function jamSekarang() {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}

async function muatDashboard() {
  const data = await api("/api/admin/dashboard");
  S.dashboard = data;
  return data;
}

async function muatKaryawan() {
  const data = await api("/api/users");
  S.karyawan = data.data || [];
  return S.karyawan;
}

async function muatRekap() {
  const data = await api(
    `/api/presensi/rekap?bulan=${S.bulan}&tahun=${S.tahun}`
  );

  S.rekap = data;
  return data;
}

function go(tab) {
  S.tab = tab;
  render();
}

async function home() {
  const data = await muatDashboard();
  const ringkasan = data.ringkasan;
  const daftar = data.daftarPresensi || [];

  const jumlahMasuk = ringkasan.totalMasuk || 0;
  const total = ringkasan.totalKaryawan || 0;

  const urutan = {
    "Belum Presensi": 0,
    "Terlambat": 1,
    "Hadir": 2,
    "Izin": 3,
    "Sakit": 4
  };

  daftar.sort((a, b) => urutan[a.status] - urutan[b.status]);

  return `
    <h1>Pagi, ${esc(user.nama || "Admin")} 👋</h1>
    <p class="sub">${formatTanggal(data.tanggal)}</p>

    <div class="bx hero">
      <div class="big">${jumlahMasuk}/${total}</div>
      <p style="font-weight:600;margin-top:6px">karyawan sudah masuk hari ini</p>
      <div class="seg">
        <i style="flex:${ringkasan.hadir};background:var(--lime)"></i>
        <i style="flex:${ringkasan.terlambat};background:var(--sun)"></i>
        <i style="flex:${ringkasan.izin};background:var(--sky)"></i>
        <i style="flex:${ringkasan.sakit};background:var(--pink)"></i>
        <i style="flex:${ringkasan.belumPresensi};background:var(--lil)"></i>
      </div>
    </div>

    <div class="grid">
      <div class="bx tile" style="background:var(--lime)">
        <span>✅</span><b>${ringkasan.hadir}</b>Hadir
      </div>
      <div class="bx tile" style="background:var(--sun)">
        <span>⏰</span><b>${ringkasan.terlambat}</b>Terlambat
      </div>
      <div class="bx tile" style="background:var(--sky)">
        <span>📝</span><b>${ringkasan.izin}</b>Izin
      </div>
      <div class="bx tile" style="background:var(--pink)">
        <span>🤒</span><b>${ringkasan.sakit}</b>Sakit
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>Presensi hari ini</h2>
      <button class="bx pill" style="background:var(--sky);padding:10px 14px;font-weight:800"
        onclick="izin()">+ Izin/Sakit</button>
    </div>

    ${
      daftar.length
        ? daftar.map((item) => `
          <button class="bx card row" onclick="detail(${item.userId || item.id}, '${data.tanggal}')">
            ${avatar(item.nama, item.userId || item.id)}
            <div class="grow">
              <b>${esc(item.nama)}</b>
              <span>${esc(item.jabatan || "Karyawan")} · ${esc(item.jamMasuk || "Belum ada jam masuk")}</span>
              <span>${esc(item.jamPulang ? `Pulang ${item.jamPulang}` : "")}</span>
            </div>
            <span class="pill" style="background:${statusColor(item.status)}">
              ${esc(item.status)}
            </span>
          </button>
        `).join("")
        : `<div class="bx card row"><div class="grow"><b>Belum ada karyawan</b><span>Tambahkan karyawan terlebih dahulu.</span></div></div>`
    }
  `;
}

async function detail(userId, tanggal) {
  try {
    const data = await api(
      `/api/admin/presensi/foto?userId=${userId}&tanggal=${tanggal}`
    );

    const item = data.data;

    const fotoBox = (url, jam, label) => {
      const fotoUrl = url
        ? url.startsWith("http")
          ? url
          : `${API}${url.startsWith("/") ? "" : "/"}${url}`
        : "";

      return `
        <div class="selfie">
          ${
            fotoUrl
              ? `<img src="${esc(fotoUrl)}" alt="Foto presensi ${label}" style="width:100%;height:180px;object-fit:cover;border-radius:12px">`
              : `<div style="height:180px;display:grid;place-items:center">Foto belum tersedia</div>`
          }
          <small>${label} · ${esc(jam || "Belum ada foto")}</small>
        </div>
      `;
    };

    sheet(`
      <div class="row" style="padding:0;margin:0 0 12px">
        ${avatar(item.nama, item.id)}
        <div class="grow">
          <b style="font-size:20px">${esc(item.nama)}</b>
          <span>${esc(item.jabatan || "Karyawan")}</span>
          <span>${formatTanggal(item.tanggal)}</span>
        </div>
        <span class="pill" style="background:${statusColor(item.status)}">
          ${esc(item.status)}
        </span>
      </div>

      <div class="selfies">
        ${fotoBox(item.fotoMasuk, item.jamMasuk, "Presensi Masuk")}
        ${fotoBox(item.fotoPulang, item.jamPulang, "Presensi Pulang")}
      </div>
    `);
  } catch (error) {
    toast(error.message);
  }
}

async function izin() {
  try {
    await muatKaryawan();

    if (!S.karyawan.length) {
      toast("Belum ada karyawan.");
      return;
    }

    sheet(`
      <h1 style="font-size:26px;margin-bottom:16px">Catat Izin/Sakit</h1>

      <label>Karyawan</label>
      <select id="izinUser">
        ${S.karyawan.map((item) => `
          <option value="${item.id}">${esc(item.nama)}</option>
        `).join("")}
      </select>

      <label>Status</label>
      <div class="seg2">
        <button id="pilihIzin" class="on" style="background:var(--sky)"
          onclick="pilihStatus('Izin')">📝 Izin</button>
        <button id="pilihSakit"
          onclick="pilihStatus('Sakit')">🤒 Sakit</button>
      </div>

      <p class="sub" style="margin:12px 0">
        Status akan dicatat untuk tanggal hari ini.
      </p>

      <button class="bx btn" onclick="simpanIzin()">Simpan</button>
    `);

    window.statusIzin = "Izin";
  } catch (error) {
    toast(error.message);
  }
}

function pilihStatus(status) {
  window.statusIzin = status;

  $("pilihIzin").className = status === "Izin" ? "on" : "";
  $("pilihSakit").className = status === "Sakit" ? "on" : "";

  $("pilihIzin").style.background = status === "Izin" ? "var(--sky)" : "";
  $("pilihSakit").style.background = status === "Sakit" ? "var(--pink)" : "";
}

async function simpanIzin() {
  try {
    const userId = Number($("izinUser").value);

    await api("/api/admin/presensi/izin-sakit", {
      method: "POST",
      body: JSON.stringify({
        userId,
        status: window.statusIzin
      })
    });

    close_();
    toast("Status berhasil dicatat.");
    render();
  } catch (error) {
    toast(error.message);
  }
}

async function tim() {
  await muatKaryawan();

  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <h1>Tim</h1>
        <p class="sub">${S.karyawan.length} karyawan</p>
      </div>
      <button class="bx pill" style="background:var(--lime);padding:10px 14px;font-weight:800"
        onclick="formTim()">+ Tambah</button>
    </div>

    <div style="margin-top:18px">
      ${
        S.karyawan.length
          ? S.karyawan.map((item) => `
            <div class="bx card row">
              ${avatar(item.nama, item.id)}
              <div class="grow">
                <b>${esc(item.nama)}</b>
                <span>${esc(item.jabatan || "Karyawan")} · @${esc(item.username)}</span>
              </div>
              <button class="bx ib" onclick="formTim(${item.id})">✏️</button>
              <button class="bx ib" onclick="resetPassword(${item.id})">🔑</button>
              <button class="bx ib" onclick="hapusKaryawan(${item.id})">🗑️</button>
            </div>
          `).join("")
          : `<div class="bx card row"><div class="grow"><b>Belum ada karyawan</b><span>Ketuk Tambah untuk membuat akun.</span></div></div>`
      }
    </div>
  `;
}

function formTim(id) {
  const item = id ? S.karyawan.find((k) => k.id === id) : null;

  window.editId = id || null;

  sheet(`
    <h1 style="font-size:26px;margin-bottom:16px">
      ${id ? "Edit Karyawan" : "Karyawan Baru"}
    </h1>

    <label>Nama</label>
    <input id="namaKaryawan" value="${esc(item?.nama || "")}" placeholder="Nama lengkap">

    <label>Jabatan</label>
    <input id="jabatanKaryawan" value="${esc(item?.jabatan || "")}" placeholder="Contoh: Kasir">

    <label>Username</label>
    <input id="usernameKaryawan" value="${esc(item?.username || "")}" autocapitalize="none">

    ${
      id ? "" : `
        <label>Password awal</label>
        <input id="passwordKaryawan" type="password" placeholder="Minimal 6 karakter">
      `
    }

    <button class="bx btn" onclick="simpanKaryawan()">
      ${id ? "Simpan Perubahan" : "Buat Akun"}
    </button>
  `);
}

async function simpanKaryawan() {
  const nama = $("namaKaryawan").value.trim();
  const jabatan = $("jabatanKaryawan").value.trim();
  const username = $("usernameKaryawan").value.trim();

  if (!nama || !jabatan || !username) {
    toast("Semua data wajib diisi.");
    return;
  }

  try {
    if (window.editId) {
      await api(`/api/users/${window.editId}`, {
        method: "PUT",
        body: JSON.stringify({ nama, jabatan, username })
      });
    } else {
      const password = $("passwordKaryawan").value;

      if (password.length < 6) {
        toast("Password minimal 6 karakter.");
        return;
      }

      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({ nama, jabatan, username, password })
      });
    }

    close_();
    toast("Data karyawan berhasil disimpan.");
    render();
  } catch (error) {
    toast(error.message);
  }
}

function resetPassword(id) {
  const item = S.karyawan.find((k) => k.id === id);

  sheet(`
    <h1 style="font-size:26px">Reset Password</h1>
    <p class="sub" style="margin:8px 0 16px">${esc(item?.nama || "Karyawan")}</p>

    <label>Password baru</label>
    <input id="passwordBaru" type="password" placeholder="Minimal 6 karakter">

    <button class="bx btn" onclick="simpanPassword(${id})">Simpan Password</button>
  `);
}

async function simpanPassword(id) {
  const password = $("passwordBaru").value;

  if (password.length < 6) {
    toast("Password minimal 6 karakter.");
    return;
  }

  try {
    await api(`/api/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password })
    });

    close_();
    toast("Password berhasil direset.");
  } catch (error) {
    toast(error.message);
  }
}

function hapusKaryawan(id) {
  const item = S.karyawan.find((k) => k.id === id);

  sheet(`
    <h1 style="font-size:26px">Hapus Karyawan?</h1>
    <p class="sub" style="margin:10px 0 18px">
      Akun dan seluruh riwayat presensi ${esc(item?.nama || "")} akan ikut terhapus.
    </p>

    <div class="seg2">
      <button class="bx" onclick="close_()">Batal</button>
      <button class="bx" style="background:var(--pink)" onclick="konfirmasiHapus(${id})">
        Ya, Hapus
      </button>
    </div>
  `);
}

async function konfirmasiHapus(id) {
  try {
    await api(`/api/users/${id}`, { method: "DELETE" });

    close_();
    toast("Karyawan berhasil dihapus.");
    render();
  } catch (error) {
    toast(error.message);
  }
}

function jumlahHariRekap() {
  const sekarang = tanggalSekarang();
  const bulanSekarang = Number(sekarang.slice(5, 7));
  const tahunSekarang = Number(sekarang.slice(0, 4));

  if (S.tahun < tahunSekarang || (S.tahun === tahunSekarang && S.bulan < bulanSekarang)) {
    return new Date(S.tahun, S.bulan, 0).getDate();
  }

  if (S.tahun === tahunSekarang && S.bulan === bulanSekarang) {
    return Number(sekarang.slice(8, 10));
  }

  return 0;
}

function hitungRekapKaryawan(karyawan, daftar, jumlahHari) {
  const hasil = {
    Hadir: 0,
    Terlambat: 0,
    Izin: 0,
    Sakit: 0,
    Alfa: 0
  };

  const tanggalTercatat = new Set();

  daftar
    .filter((item) => Number(item.userId) === Number(karyawan.id))
    .forEach((item) => {
      if (hasil[item.status] !== undefined) {
        hasil[item.status]++;
      }

      tanggalTercatat.add(String(item.tanggal).slice(0, 10));
    });

  hasil.Alfa = Math.max(
    0,
    jumlahHari - tanggalTercatat.size
  );

  hasil.total = hasil.Hadir + hasil.Terlambat + hasil.Izin + hasil.Sakit + hasil.Alfa;

  return hasil;
}

function barRekap(hasil) {
  const total = hasil.total;

  if (!total) {
    return `<div class="seg" style="margin-top:10px"><i style="flex:1;background:var(--lil)"></i></div>`;
  }

  return `
    <div class="seg" style="margin-top:10px">
      ${[
        ["Hadir", "var(--lime)"],
        ["Terlambat", "var(--sun)"],
        ["Izin", "var(--sky)"],
        ["Sakit", "var(--pink)"],
        ["Alfa", "#FF8A00"]
      ].map(([status, color]) => `
        ${hasil[status] ? `<i style="flex:${hasil[status]};background:${color}"></i>` : ""}
      `).join("")}
    </div>
  `;
}

function kartuRekap(karyawan, hasil) {
  const label = [
    ["Hadir", "var(--lime)"],
    ["Terlambat", "var(--sun)"],
    ["Izin", "var(--sky)"],
    ["Sakit", "var(--pink)"],
    ["Alfa", "#FF8A00"]
  ];

  return `
    <button class="bx card" style="display:block;width:100%;text-align:left;margin-top:12px"
      onclick="detailRekap(${karyawan.id})">

      <div class="row" style="padding:0;margin:0">
        ${avatar(karyawan.nama, karyawan.id)}

        <div class="grow">
          <b>${esc(karyawan.nama)}</b>
          <span>${esc(karyawan.jabatan || "Karyawan")} · Lihat rincian</span>
        </div>

        <span class="pill" style="background:var(--lil)">
          ${hasil.total} hari
        </span>
      </div>

      ${barRekap(hasil)}

      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
        ${label.map(([status, color]) => `
          <span class="pill" style="background:${color};font-size:11px">
            ${status} ${hasil[status]}
          </span>
        `).join("")}
      </div>
    </button>
  `;
}

async function rekap() {
  const [data, karyawan] = await Promise.all([
    muatRekap(),
    muatKaryawan()
  ]);

  const daftar = data.daftarPresensi || [];
  const jumlahHari = jumlahHariRekap();

  const kartu = karyawan.map((item) => {
    const hasil = hitungRekapKaryawan(item, daftar, jumlahHari);
    return kartuRekap(item, hasil);
  });

  return `
    <h1>Rekap</h1>

    <div class="mp">
      <button class="bx" onclick="ubahBulan(-1)">‹</button>
      <button class="bx grow">
        ${bulanNama[S.bulan - 1]} ${S.tahun}
      </button>
      <button class="bx" onclick="ubahBulan(1)">›</button>
    </div>

    <div style="margin-top:16px">
      ${
        kartu.length
          ? kartu.join("")
          : `<div class="bx card row"><div class="grow"><b>Belum ada karyawan</b><span>Tambahkan karyawan untuk melihat rekap.</span></div></div>`
      }
    </div>
  `;
}

async function detailRekap(userId) {
  try {
    const data = await muatRekap();

    const karyawan = S.karyawan.find(
      (item) => Number(item.id) === Number(userId)
    );

    const daftar = (data.daftarPresensi || [])
      .filter((item) => Number(item.userId) === Number(userId))
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));

    if (!karyawan) {
      toast("Data karyawan tidak ditemukan.");
      return;
    }

    sheet(`
      <div class="row" style="padding:0;margin:0 0 14px">
        ${avatar(karyawan.nama, karyawan.id)}
        <div class="grow">
          <b style="font-size:20px">${esc(karyawan.nama)}</b>
          <span>${esc(karyawan.jabatan || "Karyawan")}</span>
          <span>${bulanNama[S.bulan - 1]} ${S.tahun}</span>
        </div>
      </div>

      <h2>Rincian Presensi</h2>

      ${
        daftar.length
          ? daftar.map((item) => `
            <div class="bx card row">
              <div class="grow">
                <b>${formatTanggal(item.tanggal)}</b>
                <span>Masuk ${esc(item.jamMasuk || "-")} · Pulang ${esc(item.jamPulang || "-")}</span>
              </div>
              <span class="pill" style="background:${statusColor(item.status)}">
                ${esc(item.status)}
              </span>
            </div>
          `).join("")
          : `<div class="bx card row"><div class="grow"><b>Belum ada catatan</b><span>Tidak ada presensi tercatat pada periode ini.</span></div></div>`
      }
    `);
  } catch (error) {
    toast(error.message);
  }
}

function ubahBulan(arah) {
  S.bulan += arah;

  if (S.bulan > 12) {
    S.bulan = 1;
    S.tahun++;
  }

  if (S.bulan < 1) {
    S.bulan = 12;
    S.tahun--;
  }

  render();
}

function profil() {
  return `
    <div style="text-align:center">
      <div class="av" style="width:96px;height:96px;font-size:34px;margin:6px auto 12px;background:var(--lime)">
        ${esc(initials(user.nama || "Admin"))}
      </div>

      <h1 style="font-size:28px">${esc(user.nama || "Admin")}</h1>
      <p class="sub">@${esc(user.username || "")} · Admin</p>
    </div>

    <div class="bx card" style="margin-top:24px">
      <h2>Ubah Profil</h2>

      <label>Nama Admin</label>
      <input
        id="namaAdmin"
        value="${esc(user.nama || "")}"
        placeholder="Masukkan nama"
      >

      <label>Password Baru</label>
      <input
        id="passwordAdmin"
        type="password"
        placeholder="Kosongkan jika tidak ingin mengubah password"
      >

      <label>Konfirmasi Password Baru</label>
      <input
        id="konfirmasiPasswordAdmin"
        type="password"
        placeholder="Ulangi password baru"
      >

      <button class="bx btn" style="margin-top:16px" onclick="simpanProfilAdmin()">
        Simpan Perubahan
      </button>
    </div>

    <button class="bx btn alt" style="margin-top:16px;background:var(--pink);color:var(--on)"
      onclick="logoutAsk()">Logout</button>
  `;
}

async function simpanProfilAdmin() {
  const nama = $("namaAdmin").value.trim();
  const password = $("passwordAdmin").value;
  const konfirmasi = $("konfirmasiPasswordAdmin").value;

  if (!nama) {
    toast("Nama tidak boleh kosong.");
    return;
  }

  if (password && password.length < 6) {
    toast("Password minimal 6 karakter.");
    return;
  }

  if (password !== konfirmasi) {
    toast("Konfirmasi password tidak cocok.");
    return;
  }

  try {
    const data = await api("/api/admin/profil", {
      method: "PUT",
      body: JSON.stringify({
        nama,
        password: password || undefined
      })
    });

    user.nama = data.data.nama;
    sessionStorage.setItem("user", JSON.stringify(user));

    toast("Profil berhasil diperbarui.");
    render();

  } catch (error) {
    toast(error.message);
  }
}

function logoutAsk() {
  sheet(`
    <h1 style="font-size:26px">Keluar dari akun?</h1>
    <p class="sub" style="margin:10px 0 18px">
      Kamu perlu login kembali untuk membuka aplikasi.
    </p>

    <div class="seg2">
      <button class="bx" onclick="close_()">Batal</button>
      <button class="bx" style="background:var(--pink)" onclick="logout()">Ya, Keluar</button>
    </div>
  `);
}

function logout() {
  sessionStorage.clear();
  location.href = "/";
}

async function render() {
  const view = $("view");
  const nav = $("nav");

  nav.style.display = "flex";
  view.innerHTML = `<div class="bx card">Memuat data...</div>`;

  const halaman = {
    home,
    tim,
    rekap,
    profil
  };

  try {
    view.innerHTML = await halaman[S.tab]();
    view.scrollTop = 0;

    nav.innerHTML = [
      ["home", "🏠", "Beranda"],
      ["tim", "👥", "Tim"],
      ["rekap", "📊", "Rekap"],
      ["profil", "😎", "Profil"]
    ].map(([key, icon, label]) => `
      <button class="${S.tab === key ? "on" : ""}" onclick="go('${key}')">
        <span>${icon}</span>${label}
      </button>
    `).join("");
  } catch (error) {
    view.innerHTML = `
      <div class="bx card">
        <b>Gagal memuat halaman</b>
        <p class="sub">${esc(error.message)}</p>
        <button class="bx btn" onclick="render()">Coba Lagi</button>
      </div>
    `;
  }
}

render();
