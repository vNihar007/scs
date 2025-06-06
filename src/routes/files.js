const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewear/authMiddlwear');
const {authorizeFileAccess} = require('../middlewear/aclMiddlewear');
const {
  listFiles,
  DownloadFiles,
  DeleteFile,
  SearchFiles,
  DownloadMultipleFiles,
  ListFileVersions,
  DownloadByVersionLabel,
  RollBackVersion,
  shareFile
} = require('../controllers/fileController');

// Search within a bucket
router.get('/:bucketName/search/query', verifyToken, SearchFiles);

// List all files in a bucket
router.get('/:bucketName', verifyToken,authorizeFileAccess('read'), listFiles);

// Download a specific file by ID from a bucket
router.get('/:bucketName/:id/download', verifyToken,authorizeFileAccess('read'), DownloadFiles);

// Download multiple files from a bucket
router.post('/:bucketName/download/bulk', verifyToken,authorizeFileAccess('read'), DownloadMultipleFiles);

// Delete a file from a bucket
router.delete('/:bucketName/:id', verifyToken,authorizeFileAccess('write'), DeleteFile);

// List versions of a file in a bucket
router.get('/:bucketName/versions/:filename', verifyToken,authorizeFileAccess('read'), ListFileVersions);

// Download a specific version of a file
router.get('/:bucketName/:filename/version/:versionLabel/download', verifyToken,authorizeFileAccess('read'), DownloadByVersionLabel);

// Roll back to a specific version
router.post('/:bucketName/:filename/version/:versionLabel/rollback', verifyToken,authorizeFileAccess('write'), RollBackVersion);

// Share a file with users (owner only)
router.post('/:bucketName/:id/share', verifyToken,authorizeFileAccess('owner'), shareFile);

module.exports = router;
