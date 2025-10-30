// upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = 'uploads/';

// Crea la carpeta si no existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ej: 1714335588483.jpg
  }
});

const upload = multer({ storage });
module.exports = upload;
