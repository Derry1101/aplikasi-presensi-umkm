
const token = sessionStorage.getItem("token");
let user = JSON.parse(sessionStorage.getItem("user") || "null");

const $ = (id) => document.getElementById(id);

const MN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const HR = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const C = {
  Hadir: "var(--lime)",
  Terlambat: "var(--sun)",
  Izin: "var(--sky)",
  Sakit: "var(--pink)",
  "Belum Presensi": "var(--lil)"
};

const S = {
  tab: "home",
  riwayat: [],
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  foto: null,
  jenisPresensi: null,
  kameraStream: null,
  previewUrl: null
};

if (!token || !user || user.role !== "karyawan") {
  sessionStorage.clear();
  location.href = "/";
}

async function api(url, options = {}) {
  const response = await fetch(url, {
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

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
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
  hentikanKamera();

  if (S.previewUrl) {
    URL.revokeObjectURL(S.previewUrl);
    S.previewUrl = null;
  }

  $("sheetBg").classList.remove("open");
}

$("sheetBg").addEventListener("click", (event) => {
  if (event.target.id === "sheetBg") close_();
});

function tanggalJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function tanggalFormat(value) {
  if (!value) return "-";

  const date = new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function jamDariData(value) {
  if (!value) return "-";

  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function tanggalHariIni(item) {
  return new Date(item.tanggal).toISOString().slice(0, 10);
}

async function muatRiwayat() {
  const data = await api(
    `/api/presensi/riwayat?bulan=${S.bulan}&tahun=${S.tahun}`
  );

  S.riwayat = data.data || [];
  return S.riwayat;
}

function dataHariIni() {
  return S.riwayat.find(
    (item) => tanggalHariIni(item) === tanggalJakarta()
  ) || null;
}

function go(tab) {
  S.tab = tab;
  render();
}

function avatar() {
  const nama = user.nama || "Karyawan";
  const huruf = nama.split(" ").map((kata) => kata[0]).slice(0, 2).join("");

  return `<div class="av" style="width:96px;height:96px;font-size:34px;margin:6px auto 12px;background:var(--lime);box-shadow:4px 4px 0 var(--ink)">${esc(huruf.toUpperCase())}</div>`;
}

async function home() {
  await muatRiwayat();

  const today = dataHariIni();
  const sudahMasuk = Boolean(today?.jamMasuk);
  const sudahPulang = Boolean(today?.jamPulang);

  let warna = "var(--lil)";
  let judul = "Belum presensi";
  let keterangan = "Jangan lupa melakukan presensi masuk hari ini.";

  if (today?.status === "Izin") {
    warna = "var(--sky)";
    judul = "Izin hari ini";
    keterangan = "Status kehadiranmu sudah dicatat oleh admin.";
  } else if (today?.status === "Sakit") {
    warna = "var(--pink)";
    judul = "Sakit hari ini";
    keterangan = "Status kehadiranmu sudah dicatat oleh admin.";
  } else if (sudahPulang) {
    warna = "var(--sky)";
    judul = "Sudah pulang";
    keterangan = `Jam pulang ${jamDariData(today.jamPulang)}. Sampai ketemu besok 👋`;
  } else if (sudahMasuk) {
    warna = C[today.status] || "var(--lime)";
    judul = today.status === "Terlambat" ? "Masuk terlambat" : "Sudah masuk";
    keterangan = `Jam masuk ${jamDariData(today.jamMasuk)}.`;
  }

  const tombolMasuk = !today;
  const tombolPulang = sudahMasuk && !sudahPulang;

  const hariIni = new Date(`${tanggalJakarta()}T00:00:00`);
  const hari = hariIni.getDay();
  const senin = new Date(hariIni);

  senin.setDate(hariIni.getDate() - (hari === 0 ? 6 : hari - 1));

  const minggu = [];

  for (let i = 0; i < 6; i++) {
    const tanggal = new Date(senin);
    tanggal.setDate(senin.getDate() + i);

    const key = [
      tanggal.getFullYear(),
      String(tanggal.getMonth() + 1).padStart(2, "0"),
      String(tanggal.getDate()).padStart(2, "0")
    ].join("-");

    const record = S.riwayat.find(
      (item) => tanggalHariIni(item) === key
    );

    minggu.push({
      nama: HR[tanggal.getDay()],
      status: record?.status || null
    });
  }

  minggu.push({
    nama: HR[hariIni.getDay()],
    status: today?.status || null
  });

  return `
    <h1>Halo, ${esc(user.nama || "Karyawan")} 👋</h1>
    <p class="sub">${tanggalFormat(`${tanggalJakarta()}T00:00:00.000Z`)}</p>

    <div class="bx" style="background:${warna};padding:18px;margin-top:18px">
      <p style="font-weight:600">Status hari ini</p>
      <div class="big" style="font-size:36px;margin-top:6px">${judul}</div>
      <p style="margin-top:8px;font-weight:600">${keterangan}</p>
    </div>

    <div class="act">
      <button class="bx btn" ${tombolMasuk ? "" : "disabled"}
        onclick="cam('masuk')">
        ${sudahMasuk ? "Sudah masuk ✓" : today ? "Tidak tersedia" : "📸 Masuk"}
      </button>

      <button class="bx btn alt" style="background:var(--sky);color:var(--on)"
        ${tombolPulang ? "" : "disabled"} onclick="cam('pulang')">
        ${sudahPulang ? "Sudah pulang ✓" : "🏃 Pulang"}
      </button>
    </div>

    <h2>Minggu ini</h2>

    <div class="bx card" style="padding:14px">
      <div class="wk">
        ${minggu.map((item) => `
          <div>
            ${item.nama}
            <i style="background:${C[item.status] || "var(--card)"}"></i>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function cam(jenis) {
  S.jenisPresensi = jenis;
  S.foto = null;

  sheet(`
    <h1 style="font-size:26px;margin-bottom:14px">
      Selfie ${jenis}
    </h1>

    <div class="vf">
      <video id="videoKamera" autoplay playsinline
        style="width:100%;height:230px;object-fit:cover;border-radius:16px;display:none"></video>

      <img id="previewFoto" alt="Preview foto"
        style="width:100%;height:230px;object-fit:cover;border-radius:16px;display:none">

      <div id="kameraPlaceholder" class="em">📷</div>

      <p id="petunjukFoto">
        Buka kamera untuk mengambil foto selfie presensi ${jenis}.
      </p>
    </div>

    <button class="bx btn" id="tombolKamera" style="margin-top:16px"
        onclick="bukaKamera()">
        Buka Kamera
    </button>

    <button id="kirimFoto" class="bx btn" style="margin-top:14px"
      disabled onclick="kirimPresensi()">
      Kirim Presensi
    </button>

    <button class="bx btn alt" style="margin-top:10px"
      onclick="close_()">
      Batal
    </button>
  `);
}

async function bukaKamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser membutuhkan HTTPS untuk membuka kamera.");
    }

    hentikanKamera();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    S.kameraStream = stream;

    const video = $("videoKamera");
    video.srcObject = stream;
    video.style.display = "block";

    $("previewFoto").style.display = "none";
    $("kameraPlaceholder").style.display = "none";
    $("petunjukFoto").textContent = "Posisikan wajah dengan jelas, lalu ambil foto.";

    const tombol = $("tombolKamera");
    tombol.textContent = "Ambil Foto";
    tombol.onclick = ambilFotoKamera;
  } catch (error) {
    toast(error.message || "Kamera tidak dapat dibuka. Periksa izin kamera.");
  }
}

function ambilFotoKamera() {
  const video = $("videoKamera");

  if (!video.videoWidth) {
    toast("Kamera belum siap.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (!blob) {
      toast("Gagal mengambil foto.");
      return;
    }

    S.foto = new File([blob], `selfie-${Date.now()}.jpg`, {
      type: "image/jpeg"
    });

    hentikanKamera();
    tampilkanPreview();
  }, "image/jpeg", 0.9);
}

function tampilkanPreview() {
  const preview = $("previewFoto");

  if (S.previewUrl) {
    URL.revokeObjectURL(S.previewUrl);
  }

  S.previewUrl = URL.createObjectURL(S.foto);
  preview.src = S.previewUrl;
  preview.style.display = "block";

  $("videoKamera").style.display = "none";
  $("kameraPlaceholder").style.display = "none";
  $("petunjukFoto").textContent = "Periksa foto sebelum mengirim presensi.";

  $("tombolKamera").textContent = "Ambil Ulang";
  $("tombolKamera").onclick = ulangFoto;

  $("kirimFoto").disabled = false;
}

function ulangFoto() {
  S.foto = null;

  if (S.previewUrl) {
    URL.revokeObjectURL(S.previewUrl);
    S.previewUrl = null;
  }

  $("previewFoto").style.display = "none";
  $("kameraPlaceholder").style.display = "block";
  $("petunjukFoto").textContent = "Buka kamera untuk mengambil foto selfie.";

  $("tombolKamera").textContent = "Buka Kamera";
  $("tombolKamera").onclick = bukaKamera;

  $("kirimFoto").disabled = true;
}

function hentikanKamera() {
  if (S.kameraStream) {
    S.kameraStream.getTracks().forEach((track) => track.stop());
    S.kameraStream = null;
  }
}

async function kirimPresensi() {
  if (!S.foto) {
    toast("Foto selfie wajib diambil.");
    return;
  }

  const tombol = $("kirimFoto");
  tombol.disabled = true;
  tombol.textContent = "Mengirim...";

  try {
    const formData = new FormData();
    formData.append("foto", S.foto);

    const endpoint = S.jenisPresensi === "masuk"
      ? "/api/presensi/masuk"
      : "/api/presensi/pulang";

    const data = await api(endpoint, {
      method: "POST",
      body: formData
    });

    close_();
    toast(data.message || "Presensi berhasil.");
    await render();
  } catch (error) {
    tombol.disabled = false;
    tombol.textContent = "Coba Lagi";
    toast(error.message);
  }
}

async function riwayat() {
  await muatRiwayat();

  const daftar = [...S.riwayat].sort(
    (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
  );

  const jumlah = {
    Hadir: 0,
    Terlambat: 0,
    Izin: 0,
    Sakit: 0
  };

  daftar.forEach((item) => {
    if (item.status in jumlah) jumlah[item.status]++;
  });

  return `
    <h1>Riwayat</h1>

    <div class="mp">
      <button class="bx" onclick="ubahBulan(-1)">‹</button>
      <button class="bx grow">
        ${MN[S.bulan - 1]} ${S.tahun}
      </button>
      <button class="bx" onclick="ubahBulan(1)">›</button>
    </div>

    <div class="chips" style="margin-top:8px">
      ${Object.entries(jumlah).map(([status, total]) => `
        <span class="pill" style="background:${C[status]};padding:8px 14px">
          ${status} ${total}
        </span>
      `).join("")}
    </div>

    ${
      daftar.length
        ? daftar.map((item) => `
          <button class="bx card row" onclick="detailRiwayat(${item.id})">
            <div class="av" style="background:${C[item.status] || "var(--lil)"};border-radius:14px">
              ${new Date(item.tanggal).getUTCDate()}
            </div>

            <div class="grow">
              <b>${tanggalFormat(item.tanggal)}</b>
              <span>
                Masuk ${jamDariData(item.jamMasuk)}
                · Pulang ${jamDariData(item.jamPulang)}
              </span>
            </div>

            <span class="pill" style="background:${C[item.status] || "var(--lil)"}">
              ${esc(item.status)}
            </span>
          </button>
        `).join("")
        : `<div class="bx card row"><div class="grow"><b>Belum ada riwayat</b><span>Data presensi bulan ini belum tersedia.</span></div></div>`
    }
  `;
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

  const sekarang = new Date();
  const bulanSekarang = sekarang.getMonth() + 1;
  const tahunSekarang = sekarang.getFullYear();

  if (
    S.tahun > tahunSekarang ||
    (S.tahun === tahunSekarang && S.bulan > bulanSekarang)
  ) {
    S.bulan = bulanSekarang;
    S.tahun = tahunSekarang;
  }

  render();
}

async function detailRiwayat(id) {
  const item = S.riwayat.find((data) => data.id === id);

  if (!item) return;

  sheet(`
    <h1 style="font-size:24px">${tanggalFormat(item.tanggal)}</h1>

    <span class="pill" style="background:${C[item.status] || "var(--lil)"};display:inline-block;margin-top:8px">
      ${esc(item.status)}
    </span>

    <div class="bx card" style="margin-top:16px">
      <div class="row">
        <div class="grow">
          <b>Presensi Masuk</b>
          <span>${jamDariData(item.jamMasuk)}</span>
        </div>
      </div>

      <div class="row">
        <div class="grow">
          <b>Presensi Pulang</b>
          <span>${jamDariData(item.jamPulang)}</span>
        </div>
      </div>
    </div>
  `);
}

function profil() {
  return `
    <div style="text-align:center">
      ${avatar()}
      <h1 style="font-size:28px">${esc(user.nama || "Karyawan")}</h1>
      <p class="sub">@${esc(user.username || "")}</p>
    </div>

    <h2>Ubah profil</h2>

    <label>Nama lengkap</label>
    <input id="namaProfil" value="${esc(user.nama || "")}">

    <button class="bx btn" onclick="simpanProfil()">Simpan Perubahan</button>

    <h2>Data kerja</h2>

    <div class="bx card" style="padding:6px 16px">
      <div style="display:flex;justify-content:space-between;padding:12px 0">
        <span class="sub" style="margin:0">Username</span>
        <b>${esc(user.username || "-")}</b>
      </div>

      <div style="display:flex;justify-content:space-between;padding:12px 0">
        <span class="sub" style="margin:0">Jabatan</span>
        <b>${esc(user.jabatan || "-")}</b>
      </div>

      <div style="display:flex;justify-content:space-between;padding:12px 0">
        <span class="sub" style="margin:0">Role</span>
        <b>Karyawan</b>
      </div>
    </div>

    <p class="lock" style="margin-top:10px">
      🔒 Username, jabatan, dan role hanya dapat diubah admin.
    </p>

    <button class="bx btn alt" style="margin-top:8px;background:var(--pink);color:var(--on)"
      onclick="logoutAsk()">Logout</button>
  `;
}

async function simpanProfil() {
  const nama = $("namaProfil").value.trim();

  if (!nama) {
    toast("Nama wajib diisi.");
    return;
  }

  try {
    const data = await api("/api/profil", {
      method: "PUT",
      body: JSON.stringify({ nama })
    });

    user = { ...user, ...data.data };
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
      Kamu perlu login kembali untuk menggunakan aplikasi.
    </p>

    <div class="seg2">
      <button class="bx" onclick="close_()">Batal</button>
      <button class="bx" style="background:var(--pink)" onclick="logout()">
        Ya, Keluar
      </button>
    </div>
  `);
}

function logout() {
  hentikanKamera();
  sessionStorage.clear();
  location.href = "/";
}

async function render() {
  const view = $("view");
  const nav = $("nav");

  view.innerHTML = `<div class="bx card">Memuat data...</div>`;

  const halaman = {
    home,
    riwayat,
    profil
  };

  try {
    view.innerHTML = await halaman[S.tab]();
    view.scrollTop = 0;

    nav.innerHTML = [
      ["home", "🏠", "Beranda"],
      ["riwayat", "🗓️", "Riwayat"],
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
