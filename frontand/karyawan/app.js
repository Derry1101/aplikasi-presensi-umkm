const token = sessionStorage.getItem("token");
let user = JSON.parse(sessionStorage.getItem("user") || "null");

const $ = (id) => document.getElementById(id);

const MN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const HR = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const HF = [
  "Minggu", "Senin", "Selasa", "Rabu",
  "Kamis", "Jumat", "Sabtu"
];

const STATUS = {
  Hadir: "hadir",
  Terlambat: "terlambat",
  Izin: "izin",
  Sakit: "sakit",
  Absen: "absen"
};

const ST = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  absen: "Absen",
  belum: "Belum presensi"
};

const I = (p) => `
<svg class="i" viewBox="0 0 24 24" fill="none"
stroke="currentColor" stroke-width="1.8"
stroke-linecap="round" stroke-linejoin="round"
aria-hidden="true">${p}</svg>`;

const IC = {
  home: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/>'),
  cal: I('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/>'),
  l: I('<path d="m14.5 6-6 6 6 6"/>'),
  r: I('<path d="m9.5 6 6 6-6 6"/>'),
  down: I('<path d="m6 9.5 6 6 6-6"/>'),
  lock: I('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  cam: I('<path d="M4 8.5h3l1.5-2h7l1.5 2h3V19H4z"/><circle cx="12" cy="13.5" r="3.5"/>')
};

const PERSON = `
<svg class="p" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <circle cx="12" cy="8.5" r="4"/>
  <path d="M4 21c.8-4.3 4.2-6.5 8-6.5s7.2 2.2 8 6.5z"/>
</svg>`;

const S = {
  tab: "home",
  riwayat: [],
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  tahunPicker: new Date().getFullYear(),
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
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
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
  if (event.target.id === "sheetBg") {
    close_();
  }
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

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

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

function kelasStatus(status) {
  return STATUS[status] || "belum";
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
  const huruf = nama
    .split(" ")
    .map((kata) => kata[0])
    .slice(0, 2)
    .join("");

  return `
    <div class="av">
      ${esc(huruf.toUpperCase())}
    </div>
  `;
}

/* =========================
   BERANDA
========================= */

async function home() {
  await muatRiwayat();

  const today = dataHariIni();

  const sudahMasuk = Boolean(today?.jamMasuk);
  const sudahPulang = Boolean(today?.jamPulang);

  let warna = "var(--red-s)";
  let judul = "Belum presensi";
  let keterangan = "Jangan lupa melakukan presensi masuk hari ini.";

  if (today?.status === "Izin") {
    warna = "var(--info-s)";
    judul = "Izin hari ini";
    keterangan = "Status kehadiranmu sudah dicatat oleh admin.";
  } else if (today?.status === "Sakit") {
    warna = "var(--vio-s)";
    judul = "Sakit hari ini";
    keterangan = "Status kehadiranmu sudah dicatat oleh admin.";
  } else if (sudahPulang) {
    warna = "var(--ok-s)";
    judul = "Sudah pulang";
    keterangan = `Jam pulang ${jamDariData(today.jamPulang)}. Sampai ketemu besok!`;
  } else if (sudahMasuk) {
    warna = today.status === "Terlambat"
      ? "var(--warn-s)"
      : "var(--ok-s)";

    judul = today.status === "Terlambat"
      ? "Masuk terlambat"
      : "Sudah masuk";

    keterangan = `Jam masuk ${jamDariData(today.jamMasuk)}.`;
  }

  const tombolMasuk = !today;
  const tombolPulang = sudahMasuk && !sudahPulang;

  const tanggal = tanggalJakarta();
  const hariIni = new Date(`${tanggal}T00:00:00`);
  const hari = hariIni.getDay();

  const senin = new Date(hariIni);
  senin.setDate(hariIni.getDate() - (hari === 0 ? 6 : hari - 1));

  const minggu = [];

  for (let i = 0; i < 7; i++) {
    const tanggalMinggu = new Date(senin);
    tanggalMinggu.setDate(senin.getDate() + i);

    const key = [
      tanggalMinggu.getFullYear(),
      String(tanggalMinggu.getMonth() + 1).padStart(2, "0"),
      String(tanggalMinggu.getDate()).padStart(2, "0")
    ].join("-");

    const record = S.riwayat.find(
      (item) => tanggalHariIni(item) === key
    );

    const status = record?.status
      ? kelasStatus(record.status)
      : null;

    minggu.push(`
      <div>
        ${HR[tanggalMinggu.getDay()]}
        <span class="c ${status ? `s-${status}` : ""}">
          ${status ? status.charAt(0).toUpperCase() : ""}
        </span>
      </div>
    `);
  }

  return `
    <h1>Halo, ${esc(user.nama || "Karyawan")} 👋</h1>
    <p class="sub">${tanggalFormat(`${tanggal}T00:00:00.000Z`)}</p>

    <div class="hero">
      <span class="chip" style="background:${warna};color:var(--ink)">
        ${today?.status || "Status hari ini"}
      </span>

      <div class="big">${judul}</div>
      <p>${keterangan}</p>
    </div>

    <div class="acts">
      <button class="btn" ${tombolMasuk ? "" : "disabled"}
        onclick="cam('masuk')">
        ${IC.cam}
        ${sudahMasuk ? "Sudah masuk" : "Presensi Masuk"}
      </button>

      <button class="btn out" ${tombolPulang ? "" : "disabled"}
        onclick="cam('pulang')">
        ${IC.cam}
        ${sudahPulang ? "Sudah pulang" : "Presensi Pulang"}
      </button>
    </div>

    <h2>Minggu ini</h2>

    <div class="card wk">
      ${minggu.join("")}
    </div>
  `;
}

/* =========================
   KAMERA DAN PRESENSI
========================= */

function cam(jenis) {
  S.jenisPresensi = jenis;
  S.foto = null;

  sheet(`
    <h1 style="font-size:20px">
      Foto selfie presensi ${jenis}
    </h1>

    <div class="vf">
      <video id="videoKamera" autoplay playsinline
        style="width:100%;height:100%;object-fit:cover;display:none">
      </video>

      <img id="previewFoto" alt="Preview foto"
        style="width:100%;height:100%;object-fit:cover;display:none">

      <div id="kameraPlaceholder">
        ${PERSON}
      </div>

      <small id="petunjukFoto">
        Buka kamera untuk mengambil foto selfie presensi.
      </small>
    </div>

    <button class="shut" id="tombolKamera"
      aria-label="Buka kamera"
      onclick="bukaKamera()">
    </button>

    <button class="btn" id="kirimFoto"
      style="margin-top:12px"
      disabled onclick="kirimPresensi()">
      Kirim Presensi
    </button>

    <button class="btn out"
      style="margin-top:10px"
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

    $("kameraPlaceholder").style.display = "none";
    $("previewFoto").style.display = "none";

    $("petunjukFoto").textContent =
      "Posisikan wajah dengan jelas, lalu ambil foto.";

    $("tombolKamera").onclick = ambilFotoKamera;
  } catch (error) {
    toast(error.message || "Kamera tidak dapat dibuka.");
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

    S.foto = new File(
      [blob],
      `selfie-${Date.now()}.jpg`,
      { type: "image/jpeg" }
    );

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

  $("petunjukFoto").textContent =
    "Periksa foto sebelum mengirim presensi.";

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

  $("petunjukFoto").textContent =
    "Buka kamera untuk mengambil foto selfie.";

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

/* =========================
   RIWAYAT PRESENSI
========================= */

async function riwayat() {
  await muatRiwayat();

  const daftar = [...S.riwayat].sort(
    (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
  );

  const jumlah = {
    Hadir: 0,
    Terlambat: 0,
    Izin: 0,
    Sakit: 0,
    Absen: 0
  };

  daftar.forEach((item) => {
    if (item.status in jumlah) {
      jumlah[item.status]++;
    }
  });

  const sekarang = new Date();
  const bulanIni = sekarang.getMonth() + 1;
  const tahunIni = sekarang.getFullYear();

  const bulanSebelumnya =
    S.tahun > 2025 || (S.tahun === 2025 && S.bulan > 1);

  const bulanBerikutnya =
    S.tahun < tahunIni ||
    (S.tahun === tahunIni && S.bulan < bulanIni);

  return `
    <h1>Riwayat Presensi</h1>
    <p class="sub">Rekap kehadiran Anda per bulan</p>

    <div class="mb">
      <button class="sq" aria-label="Bulan sebelumnya"
        ${bulanSebelumnya ? "" : "disabled"}
        onclick="ubahBulan(-1)">
        ${IC.l}
      </button>

      <button class="mc" onclick="pickM()">
        ${MN[S.bulan - 1]} ${S.tahun}
        ${IC.down}
      </button>

      <button class="sq" aria-label="Bulan berikutnya"
        ${bulanBerikutnya ? "" : "disabled"}
        onclick="ubahBulan(1)">
        ${IC.r}
      </button>
    </div>

    <div class="stats">
      ${Object.entries(jumlah).map(([status, total]) => `
        <div class="st s-${kelasStatus(status)}">
          <b>${total}</b>
          <span>${status}</span>
        </div>
      `).join("")}
    </div>

    ${
      daftar.length
        ? daftar.map((item) => `
          <button class="card row"
            onclick="detailRiwayat(${Number(item.id)})">

            <div class="dt">
              <b>${new Date(item.tanggal).getUTCDate()}</b>
              <span>
                ${HR[new Date(item.tanggal).getUTCDay()]}
              </span>
            </div>

            <div class="grow">
              <b>${tanggalFormat(item.tanggal)}</b>
              <span>
                Masuk ${jamDariData(item.jamMasuk)}
                · Pulang ${jamDariData(item.jamPulang)}
              </span>
            </div>

            <span class="chip s-${kelasStatus(item.status)}">
              ${esc(item.status)}
            </span>
          </button>
        `).join("")
        : `
          <div class="card row">
            <div class="grow">
              <b>Belum ada riwayat</b>
              <span>Data presensi bulan ini belum tersedia.</span>
            </div>
          </div>
        `
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
  const bulanIni = sekarang.getMonth() + 1;
  const tahunIni = sekarang.getFullYear();

  if (
    S.tahun > tahunIni ||
    (S.tahun === tahunIni && S.bulan > bulanIni)
  ) {
    S.bulan = bulanIni;
    S.tahun = tahunIni;
  }

  render();
}

function pickM() {
  S.tahunPicker = S.tahun;
  pm();
}

function pm() {
  const tahun = S.tahunPicker;
  const tahunIni = new Date().getFullYear();

  sheet(`
    <h1 style="font-size:20px;margin-bottom:14px">
      Pilih bulan
    </h1>

    <div class="yr">
      <button class="sq" aria-label="Tahun sebelumnya"
        ${tahun <= 2025 ? "disabled" : ""}
        onclick="S.tahunPicker--;pm()">
        ${IC.l}
      </button>

      <div class="v">${tahun}</div>

      <button class="sq" aria-label="Tahun berikutnya"
        ${tahun >= tahunIni ? "disabled" : ""}
        onclick="S.tahunPicker++;pm()">
        ${IC.r}
      </button>
    </div>

    <div class="pmg">
      ${MN.map((nama, index) => {
        const tidakAktif =
          (tahun === 2025 && index < 0) ||
          (tahun === tahunIni && index > new Date().getMonth());

        return `
          <button class="pm"
            ${tidakAktif ? "disabled" : ""}
            onclick="
              S.bulan=${index + 1};
              S.tahun=${tahun};
              close_();
              render();
            ">
            ${nama.slice(0, 3)}
          </button>
        `;
      }).join("")}
    </div>
  `);
}

async function detailRiwayat(id) {
  const item = S.riwayat.find(
    (data) => Number(data.id) === Number(id)
  );

  if (!item) return;

  sheet(`
    <h1 style="font-size:20px">
      ${tanggalFormat(item.tanggal)}
    </h1>

    <div style="margin-top:8px">
      <span class="chip s-${kelasStatus(item.status)}">
        ${esc(item.status)}
      </span>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="kv">
        <span>Presensi masuk</span>
        <b>${jamDariData(item.jamMasuk)}</b>
      </div>

      <div class="kv">
        <span>Presensi pulang</span>
        <b>${jamDariData(item.jamPulang)}</b>
      </div>
    </div>
  `);
}

/* =========================
   PROFIL
========================= */

function profil() {
  return `
    ${avatar()}

    <div style="text-align:center">
      <h1>${esc(user.nama || "Karyawan")}</h1>
      <p class="sub">@${esc(user.username || "")}</p>
    </div>

    <h2>Ubah profil</h2>

    <label for="namaProfil">Nama lengkap</label>

    <input
      id="namaProfil"
      value="${esc(user.nama || "")}"
      maxlength="100"
    >

    <button class="btn" onclick="simpanProfil()">
      Simpan Perubahan
    </button>

    <h2>Data kerja</h2>

    <div class="card">
      <div class="kv">
        <span>Username</span>
        <b>${esc(user.username || "-")}</b>
      </div>

      <div class="kv">
        <span>Jabatan</span>
        <b>${esc(user.jabatan || "-")}</b>
      </div>

      <div class="kv">
        <span>Role</span>
        <b>Karyawan</b>
      </div>
    </div>

    <p class="note">
      ${IC.lock}
      Username, jabatan, dan role hanya dapat diubah oleh admin.
    </p>

    <button class="btn out"
      style="margin-top:22px"
      onclick="logoutAsk()">
      Keluar
    </button>
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

/* =========================
   LOGOUT
========================= */

function logoutAsk() {
  sheet(`
    <h1 style="font-size:20px">
      Keluar dari akun?
    </h1>

    <p class="sub" style="margin:10px 0 18px">
      Kamu perlu login kembali untuk menggunakan aplikasi.
    </p>

    <div class="two">
      <button class="btn out" onclick="close_()">
        Batal
      </button>

      <button class="btn" onclick="logout()">
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

/* =========================
   RENDER DAN NAVIGASI
========================= */

async function render() {
  const view = $("view");
  const nav = $("nav");

  view.innerHTML = `
    <div class="card" style="padding:16px">
      Memuat data...
    </div>
  `;

  const halaman = {
    home,
    riwayat,
    profil
  };

  const judul = {
    home: "Beranda",
    riwayat: "Riwayat",
    profil: "Profil"
  };

  try {
    view.innerHTML = await halaman[S.tab]();
    view.scrollTop = 0;

    $("topTitle").textContent = judul[S.tab];

    nav.innerHTML = [
      ["home", "Beranda", IC.home],
      ["riwayat", "Riwayat", IC.cal],
      ["profil", "Profil", IC.user]
    ].map(([key, label, icon]) => `
      <button
        class="${S.tab === key ? "on" : ""}"
        onclick="go('${key}')">
        ${icon}
        ${label}
      </button>
    `).join("");

  } catch (error) {
    view.innerHTML = `
      <div class="card" style="padding:16px">
        <b>Gagal memuat halaman</b>

        <p class="sub">
          ${esc(error.message)}
        </p>

        <button class="btn"
          style="margin-top:14px"
          onclick="render()">
          Coba Lagi
        </button>
      </div>
    `;
  }
}

render();