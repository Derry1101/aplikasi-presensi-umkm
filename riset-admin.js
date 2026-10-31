import prisma from "./prisma.js";
import bcrypt from "bcrypt";

async function resetAdmin() {
  try {
    const passwordBaru = "tm garis keras";

    const hashedPassword = await bcrypt.hash(passwordBaru, 10);

    await prisma.user.update({
      where: {
        username: "liliee11",
      },
      data: {
        password: hashedPassword,
      },
    });

    console.log("Password admin berhasil diperbarui");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();