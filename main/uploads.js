
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderUpload = path.join(__dirname, "uploads");

if (!fs.existsSync(folderUpload)) {
  fs.mkdirSync(folderUpload, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, folderUpload);
  },
  filename: (req, file, cb) => {
    const namaFile = Date.now() + path.extname(file.originalname);
    cb(null, namaFile);
  },
});

const fileFilter = (req, file, cb) => {
  const tipeFile = ["image/jpeg", "image/png"];

  if (tipeFile.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format foto harus JPG atau PNG"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export default upload;
