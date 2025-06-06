const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middlewear/authMiddlwear');
const { uploadFiles } = require('../controllers/uploadController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Upload files to a specific bucket
router.post('/:bucketName/upload', auth, upload.array('files'), uploadFiles);

module.exports = router;
