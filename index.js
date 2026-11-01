
import express from "express";
import prisma from "./prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import e from "express";
import { authMiddleware } from "../middlewere/authMiddleware.js";
import { roleMiddleware } from "../middlewere/roleMiddleware.js";
import upload from "./uploads.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folderFrontand = path.resolve(__dirname, "../frontand");


app.use(express.json());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/admin", express.static(path.join(folderFrontand, "admin")));
app.use("/karyawan", express.static(path.join(folderFrontand, "karyawan")));


app.use(express.static(folderFrontand));


app.get("/", (req, res) => {
    res.sendFile(path.join(folderFrontand, "login", "index.html"));
});

app.get("/test-db", async (req, res) =>{
  try {
    const users = await prisma.user.findMany();

    res.json({
      message: "koneksi database berhasil",
      jumlahUser: users.length,
      users: users.map((user)=>({
        id: user.id,
        username: user.username,
        password: user.password,
        nama: user.nama,
        role: user.role
      }))
    })
  } catch (error) {
      console.error(error)
      res.status(500)({
        message: "gagal membaca database"
      })
  }
})

app.get("/buat-user",  async (req, res)=>{
  try {
    
    const user = await prisma.user.create({
      data: {
        username: "liliee143",
        nama: "lilii",
        password: "143"
        
      }
    })

    res.json({message:"data berhasil di buat"})

  } catch (error) {
    console.error(error)
      res.status(500)({
        message: "gagal membuat user"
      })
  }
})


app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh melihat daftar karyawan",
      });
    }

    const users = await prisma.user.findMany({
      where: {
        role: "karyawan",
      },
      select: {
        id: true,
        username: true,
        nama: true,
        jabatan: true,
        role: true,
      },
      orderBy: {
        nama: "asc",
      },
    });

    return res.status(200).json({
      message: "Daftar karyawan berhasil ditampilkan",
      jumlah: users.length,
      data: users,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil daftar karyawan",
    });
  }
});


app.post("/api/users", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh menambahkan karyawan",
      });
    }

    const { username, nama, password, jabatan } = req.body;

    if (!username || !nama || !password || !jabatan) {
      return res.status(400).json({
        message: "Username, nama, password, dan jabatan wajib diisi",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const users = await prisma.user.create({
      data: {
        username,
        nama,
        password: hashedPassword,
        jabatan,
        role: "karyawan",
      },
      select: {
        id: true,
        username: true,
        nama: true,
        jabatan: true,
        role: true,
      },
    });

    return res.status(201).json({
      message: "Karyawan berhasil ditambahkan",
      users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal menambahkan karyawan",
    });
  }
});

app.put("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh mengubah data karyawan",
      });
    }

    const id = Number(req.params.id);
    const { username, nama, jabatan } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID karyawan tidak valid",
      });
    }

    const users = await prisma.user.update({
      where: { id },
      data: {
        username,
        nama,
        jabatan,
      },
      select: {
        id: true,
        username: true,
        nama: true,
        jabatan: true,
        role: true,
      },
    });

    return res.status(200).json({
      message: "Data karyawan berhasil diubah",
      users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal memperbarui data karyawan",
    });
  }
});



app.delete("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh menghapus karyawan",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID karyawan tidak valid",
      });
    }

    const karyawan = await prisma.user.findFirst({
      where: {
        id,
        role: "karyawan",
      },
      select: {
        id: true,
        username: true,
        nama: true,
      },
    });

    if (!karyawan) {
      return res.status(404).json({
        message: "Karyawan tidak ditemukan",
      });
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      message: "Karyawan berhasil dihapus",
      data: karyawan,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal menghapus karyawan",
    });
  }
});


app.post("/api/auth/login", async (req, res) => {
  try {
    const {username, password} = req.body;

    const user = await prisma.user.findUnique({
      where: {username}
    })

    if(!user){
      return res.status(401).json({
        message: "Username atau Password salah"
      })
    }

    const cocok = await bcrypt.compare(
      password,
      user.password
    )

    if(!cocok){
      return res.status(401).json({
        message: "Username atau Password salah"
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {expiresIn: "1d"}
    )

    res.status(200).json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
  })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server"
    })
  }
  
})

app.get("/api/test-auth", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Token valid",
    user: req.user,
  });
});






app.post("/api/presensi/masuk", authMiddleware, upload.single("foto"), async (req, res) => {
  try {
    if (req.user.role !== "karyawan") {
      return res.status(403).json({
        message: "Hanya karyawan yang boleh melakukan presensi",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Foto selfie wajib diunggah",
      });
    }

    const userId = req.user.id;
    const sekarang = new Date();

    const tanggalJakarta = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(sekarang);

    const tanggalHariIni = new Date(
      `${tanggalJakarta}T00:00:00.000Z`
    );

    const jamMasukJakarta = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(sekarang);

    const statusPresensi = jamMasukJakarta > "08:00"
      ? "Terlambat"
      : "Hadir";

    const presensiHariIni = await prisma.presensi.findUnique({
      where: {
        userId_tanggal: {
          userId,
          tanggal: tanggalHariIni,
        },
      },
    });

    if (presensiHariIni) {
      return res.status(400).json({
        message: "Kamu sudah melakukan presensi masuk hari ini",
      });
    }

    const presensi = await prisma.presensi.create({
      data: {
        userId,
        tanggal: tanggalHariIni,
        jamMasuk: sekarang,
        fotoMasuk: req.file.filename,
        status: statusPresensi,
      },
    });

    return res.status(201).json({
      message: "Presensi masuk berhasil",
      data: {
        id: presensi.id,
        userId: presensi.userId,
        tanggal: tanggalJakarta,
        jamMasuk: new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(presensi.jamMasuk),
        fotoMasuk: presensi.fotoMasuk,
        status: presensi.status,
      },
    });

  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Kamu sudah melakukan presensi masuk hari ini",
      });
    }

    return res.status(500).json({
      message: "Gagal melakukan presensi masuk",
    });
  }
});








app.post("/api/presensi/pulang", authMiddleware, upload.single("foto"), async (req, res) => {
  try {
    if (req.user.role !== "karyawan") {
      return res.status(403).json({
        message: "Hanya karyawan yang boleh melakukan presensi",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Foto selfie wajib diunggah",
      });
    }

    const userId = req.user.id;
    const sekarang = new Date();

    const tanggalJakarta = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(sekarang);

    const tanggalHariIni = new Date(
      `${tanggalJakarta}T00:00:00.000Z`
    );

    const presensiHariIni = await prisma.presensi.findUnique({
      where: {
        userId_tanggal: {
          userId,
          tanggal: tanggalHariIni,
        },
      },
    });

    if (!presensiHariIni || !presensiHariIni.jamMasuk) {
      return res.status(400).json({
        message: "Kamu belum melakukan presensi masuk hari ini",
      });
    }

    if (presensiHariIni.jamPulang) {
      return res.status(400).json({
        message: "Kamu sudah melakukan presensi pulang hari ini",
      });
    }

    const hasilUpdate = await prisma.presensi.updateMany({
      where: {
        id: presensiHariIni.id,
        jamPulang: null,
      },
      data: {
        jamPulang: sekarang,
        fotoPulang: req.file.filename,
      },
    });

    if (hasilUpdate.count === 0) {
      return res.status(400).json({
        message: "Kamu sudah melakukan presensi pulang hari ini",
      });
    }

    const presensi = await prisma.presensi.findUnique({
      where: {
        id: presensiHariIni.id,
      },
    });

    return res.status(200).json({
      message: "Presensi pulang berhasil",
      data: {
        id: presensi.id,
        userId: presensi.userId,
        tanggal: tanggalJakarta,
        jamMasuk: new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(presensi.jamMasuk),
        jamPulang: new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(presensi.jamPulang),
        fotoMasuk: presensi.fotoMasuk,
        fotoPulang: presensi.fotoPulang,
        status: presensi.status,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal melakukan presensi pulang",
    });
  }
});



app.get("/api/presensi/riwayat", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "karyawan") {
      return res.status(403).json({
        message: "Hanya karyawan yang boleh melihat riwayat presensi",
      });
    }

    const { bulan, tahun } = req.query;

    if (
      !bulan ||
      !tahun ||
      !/^\d{1,2}$/.test(bulan) ||
      !/^\d{4}$/.test(tahun) ||
      Number(bulan) < 1 ||
      Number(bulan) > 12
    ) {
      return res.status(400).json({
        message: "Bulan dan tahun tidak valid",
      });
    }

    const awalBulan = new Date(
      `${tahun}-${bulan.padStart(2, "0")}-01T00:00:00.000Z`
    );

    const akhirBulan = new Date(
      Date.UTC(
        Number(tahun),
        Number(bulan),
        1
      )
    );

    const riwayat = await prisma.presensi.findMany({
      where: {
        userId: req.user.id,
        tanggal: {
          gte: awalBulan,
          lt: akhirBulan,
        },
      },
      orderBy: {
        tanggal: "desc",
      },
    });

    return res.status(200).json({
      message: "Riwayat presensi berhasil diambil",
      bulan: Number(bulan),
      tahun: Number(tahun),
      jumlahData: riwayat.length,
      data: riwayat,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil riwayat presensi",
    });
  }
});



app.get("/api/admin/dashboard", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh mengakses dashboard",
      });
    }

    const sekarang = new Date();

    const tanggalJakarta = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(sekarang);

    const tanggalHariIni = new Date(
      `${tanggalJakarta}T00:00:00.000Z`
    );

    const [karyawan, presensiHariIni] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "karyawan",
        },
        select: {
          id: true,
          nama: true,
          jabatan: true,
        },
        orderBy: {
          nama: "asc",
        },
      }),

      prisma.presensi.findMany({
        where: {
          tanggal: tanggalHariIni,
        },
      }),
    ]);

    const daftarPresensi = karyawan.map((user) => {
      const presensi = presensiHariIni.find(
        (item) => item.userId === user.id
      );

      let status = "Belum Presensi";

      if (presensi) {
        status = presensi.status;

        if (status === "Hadir" && presensi.jamMasuk) {
          const jamMasuk = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(presensi.jamMasuk);

          if (jamMasuk > "08:00") {
            status = "Terlambat";
          }
        }
      }

      const formatJam = (tanggal) => {
        if (!tanggal) return null;

        return new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(tanggal);
      };

      return {
        id: user.id,
        nama: user.nama,
        jabatan: user.jabatan,
        jamMasuk: formatJam(presensi?.jamMasuk),
        jamPulang: formatJam(presensi?.jamPulang),
        status,
      };
    });

    const ringkasan = {
      totalKaryawan: karyawan.length,
      totalMasuk: daftarPresensi.filter(
        (item) => ["Hadir", "Terlambat"].includes(item.status)
      ).length,
      hadir: daftarPresensi.filter(
        (item) => item.status === "Hadir"
      ).length,
      terlambat: daftarPresensi.filter(
        (item) => item.status === "Terlambat"
      ).length,
      izin: daftarPresensi.filter(
        (item) => item.status === "Izin"
      ).length,
      sakit: daftarPresensi.filter(
        (item) => item.status === "Sakit"
      ).length,
      belumPresensi: daftarPresensi.filter(
        (item) => item.status === "Belum Presensi"
      ).length,
    };

    return res.status(200).json({
      message: "Dashboard berhasil ditampilkan",
      tanggal: tanggalJakarta,
      ringkasan,
      daftarPresensi,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil data dashboard",
    });
  }
});



app.post("/api/admin/presensi/izin-sakit", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh menginput Izin atau Sakit",
      });
    }

    const { userId, status } = req.body;

    if (!userId || !["Izin", "Sakit"].includes(status)) {
      return res.status(400).json({
        message: "User ID dan status Izin atau Sakit wajib diisi",
      });
    }

    const idKaryawan = Number(userId);

    if (!Number.isInteger(idKaryawan) || idKaryawan <= 0) {
      return res.status(400).json({
        message: "ID karyawan tidak valid",
      });
    }

    const karyawan = await prisma.user.findFirst({
      where: {
        id: idKaryawan,
        role: "karyawan",
      },
    });

    if (!karyawan) {
      return res.status(404).json({
        message: "Karyawan tidak ditemukan",
      });
    }

    const sekarang = new Date();

    const tanggalJakarta = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(sekarang);

    const tanggalHariIni = new Date(
      `${tanggalJakarta}T00:00:00.000Z`
    );

    const presensiHariIni = await prisma.presensi.findUnique({
      where: {
        userId_tanggal: {
          userId: idKaryawan,
          tanggal: tanggalHariIni,
        },
      },
    });

    if (presensiHariIni?.jamMasuk || presensiHariIni?.jamPulang) {
      return res.status(400).json({
        message: "Karyawan sudah melakukan presensi hari ini",
      });
    }

    let hasil;

    if (presensiHariIni) {
      hasil = await prisma.presensi.update({
        where: {
          id: presensiHariIni.id,
        },
        data: {
          status,
        },
      });
    } else {
      hasil = await prisma.presensi.create({
        data: {
          userId: idKaryawan,
          tanggal: tanggalHariIni,
          status,
        },
      });
    }

    return res.status(200).json({
      message: `Status ${status} berhasil dicatat`,
      data: {
        id: hasil.id,
        userId: hasil.userId,
        nama: karyawan.nama,
        tanggal: tanggalJakarta,
        status: hasil.status,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mencatat status Izin atau Sakit",
    });
  }
});



app.put("/api/profil", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "karyawan") {
      return res.status(403).json({
        message: "Fitur ini hanya untuk karyawan",
      });
    }

    const { nama } = req.body;

    if (!nama || typeof nama !== "string" || !nama.trim()) {
      return res.status(400).json({
        message: "Nama wajib diisi",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        nama: nama.trim(),
      },
      select: {
        id: true,
        username: true,
        nama: true,
        jabatan: true,
        role: true,
      },
    });

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      data: user,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal memperbarui profil",
    });
  }
});


app.put("/api/users/:id/password", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh mereset password",
      });
    }

    const id = Number(req.params.id);
    const { password } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID karyawan tidak valid",
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password wajib diisi minimal 6 karakter",
      });
    }

    const karyawan = await prisma.user.findFirst({
      where: {
        id,
        role: "karyawan",
      },
    });

    if (!karyawan) {
      return res.status(404).json({
        message: "Karyawan tidak ditemukan",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const hasil = await prisma.user.update({
      where: {
        id,
      },
      data: {
        password: passwordHash,
      },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
      },
    });

    return res.status(200).json({
      message: "Password karyawan berhasil direset",
      data: hasil,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mereset password karyawan",
    });
  }
});


app.get("/api/admin/presensi/foto", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Hanya admin yang boleh melihat foto presensi",
      });
    }

    const { userId, tanggal } = req.query;

    if (!userId || !tanggal) {
      return res.status(400).json({
        message: "User ID dan tanggal wajib diisi",
      });
    }

    const idKaryawan = Number(userId);

    if (!Number.isInteger(idKaryawan) || idKaryawan <= 0) {
      return res.status(400).json({
        message: "ID karyawan tidak valid",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return res.status(400).json({
        message: "Format tanggal harus YYYY-MM-DD",
      });
    }

    const tanggalPresensi = new Date(`${tanggal}T00:00:00.000Z`);

    const presensi = await prisma.presensi.findUnique({
      where: {
        userId_tanggal: {
          userId: idKaryawan,
          tanggal: tanggalPresensi,
        },
      },
      include: {
        user: {
          select: {
            nama: true,
            jabatan: true,
          },
        },
      },
    });

    if (!presensi) {
      return res.status(404).json({
        message: "Data presensi tidak ditemukan",
      });
    }

    const formatJam = (waktu) => {
      if (!waktu) return null;

      return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(waktu);
    };

    return res.status(200).json({
      message: "Foto presensi berhasil ditampilkan",
      data: {
        nama: presensi.user.nama,
        jabatan: presensi.user.jabatan,
        tanggal,
        status: presensi.status,
        fotoMasuk: presensi.fotoMasuk
          ? `/uploads/${presensi.fotoMasuk}`
          : null,
        jamMasuk: formatJam(presensi.jamMasuk),
        fotoPulang: presensi.fotoPulang
          ? `/uploads/${presensi.fotoPulang}`
          : null,
        jamPulang: formatJam(presensi.jamPulang),
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil foto presensi",
    });
  }
});



app.get("/api/presensi/rekap", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "karyawan"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Role tidak memiliki akses",
      });
    }

    const bulan = Number(req.query.bulan);
    const tahun = Number(req.query.tahun);

    if (
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12 ||
      !Number.isInteger(tahun) ||
      tahun < 2000 ||
      tahun > 2100
    ) {
      return res.status(400).json({
        message: "Bulan atau tahun tidak valid",
      });
    }

    const tanggalMulai = new Date(Date.UTC(tahun, bulan - 1, 1));
    const tanggalAkhir = new Date(Date.UTC(tahun, bulan, 1));

    const filterPresensi = {
      tanggal: {
        gte: tanggalMulai,
        lt: tanggalAkhir,
      },
    };

    if (req.user.role === "karyawan") {
      filterPresensi.userId = req.user.id;
    }

    const presensi = await prisma.presensi.findMany({
      where: filterPresensi,
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
          },
        },
      },
      orderBy: {
        tanggal: "desc",
      },
    });

    const formatJam = (waktu) => {
      if (!waktu) return null;

      return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(waktu);
    };

    const daftarPresensi = presensi.map((item) => {
      let status = item.status;

      if (status === "Hadir" && item.jamMasuk) {
        const jamMasuk = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(item.jamMasuk);

        if (jamMasuk > "08:00") {
          status = "Terlambat";
        }
      }

      return {
        id: item.id,
        userId: item.userId,
        nama: item.user.nama,
        jabatan: item.user.jabatan,
        tanggal: new Intl.DateTimeFormat("en-CA", {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(item.tanggal),
        jamMasuk: formatJam(item.jamMasuk),
        jamPulang: formatJam(item.jamPulang),
        status,
      };
    });

    const ringkasan = {
      totalPresensi: daftarPresensi.length,
      hadir: daftarPresensi.filter((item) => item.status === "Hadir").length,
      terlambat: daftarPresensi.filter((item) => item.status === "Terlambat").length,
      izin: daftarPresensi.filter((item) => item.status === "Izin").length,
      sakit: daftarPresensi.filter((item) => item.status === "Sakit").length,
    };

    return res.status(200).json({
      message: "Rekap presensi berhasil ditampilkan",
      role: req.user.role,
      periode: { bulan, tahun },
      ringkasan,
      daftarPresensi,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil rekap presensi",
    });
  }
});



app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
