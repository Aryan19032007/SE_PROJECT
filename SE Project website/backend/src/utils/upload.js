const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '..', 'uploads');
const profileUploadDir = path.join(uploadRoot, 'profiles');

function ensureUploadDirs() {
  [uploadRoot, profileUploadDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function imageOnly(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }
  cb(new Error('Only image uploads are allowed'));
}

function makeStorage(directory, prefix = '') {
  return multer.diskStorage({
    destination: directory,
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      cb(null, `${prefix}${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
    }
  });
}

ensureUploadDirs();

const requestImageUpload = multer({
  storage: makeStorage(uploadRoot),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageOnly
});

const profileImageUpload = multer({
  storage: makeStorage(profileUploadDir, 'profile-'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageOnly
});

module.exports = {
  ensureUploadDirs,
  profileImageUpload,
  requestImageUpload,
  uploadRoot
};
