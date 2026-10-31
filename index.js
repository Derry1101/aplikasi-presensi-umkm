
import express from "express";
import prisma from "./prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import e from "express";
import { authMiddleware } from "../middlewere/authMiddleware.js";
import { roleMiddleware } from "../middlewere/roleMiddleware.js";
import upload from "./uploads.js";

const app = express();
const PORT = 3000;

// Membaca data JSON dari request
app.use(express.json());

// Endpoint untuk mengecek server
app.get("/", (req, res) => {
  res.json({
    message: "Backend aplikasi presensi berjalan!"
  });
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

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nama: true,
        role: true
      }
    })
    res.status(200).json({
        message: "Data berhasil di ambil",
        jumlahUser: users.length,
        users: users
      })
  } catch (error) {
    console.error(error)
    res.status(500)({
      message: "Gagal mengambil Data"
    })
    
  }
  
})

app.post("/api/users", async (req, res) => {
  try {
    const {username, nama, password, role} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10)
    const users = await prisma.user.create({
      data: {
        username,
        nama,
        password: hashedPassword,
        role
      }
    })

    res.status(200).json({
      message: "user berhasil di buat",
      users:{
        id: users.id,
        username: users.username,
        nama: users.nama
      }
    })
    
  } catch (error) {
    console.error(error)
    res.status(500)({
      message: "gagal membuat user"
    })
  }
})

app.put("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {username, nama, role} = req.body

    const users = await prisma.user.update({
      where: {id},
      data: {
        username,
        nama,
        role
      },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true
      }
    })

    res.status(200).json({
      message: "Data berhasil di ubah",
      users
    })
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Data gagal untuk di perbarui, periksa kembali id dan data yang akan di ubah"
    })
  }
  
})


app.delete("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    const users = await prisma.user.delete({
      where:{id},
      select: {
        username: true,
        nama: true,
        role: true,
        id: true
      }
    })

    res.status(200).json({
      message: "Data berhasil di hapus",
      users
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Delete data gagal, coba periksa kembali id dan data yang ingin di hapus"
    })
  }
})

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

    const tanggalHariIni = new Date(`${tanggalJakarta}T00:00:00.000Z`);

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
        status: "Hadir",
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






app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
