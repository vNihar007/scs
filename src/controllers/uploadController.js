const ObjectMeta = require('../models/objectMeta');
const {bloomCheck,bloomAdd,bloomInit} = require('../utlis/bloomFilter');
const {uploadToSeaweed} = require('../utlis/uploadToSeaweed');
const {produceEvent} = require('../utlis/kafka/ProduceEvent');
const crypto = require('crypto');
const fs = require('fs');

// Upload files with versioning and bucket context
const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    const { bucketName } = req.params;
    const { folder = '', tags = '', versionReason = '' } = req.body;

    // support for multiple files 
    const tagArray = tags.split(',').map(tag => tag.trim());
    const uploads = [];

    for (const file of files) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');

      // Bloom filter optimization
      const existsInBloom = await bloomCheck(hash);
      if (existsInBloom === 1) {
        console.log(`Duplicate skipped via Bloom for ${file.originalname}`);
        fs.unlinkSync(file.path);
        continue;
      }

      // to check the prev.versions
      const PreviousVersion = await ObjectMeta.find({
        owner: req.user._id,
        filename: file.originalname,
        folder,
        bucket: bucketName
      });

      // Deduplication Check: Skip if latest version has same SHA-256
      const latestVersion = PreviousVersion.find(v => v.isLatest === true);
      if (latestVersion && latestVersion.sha256 === hash) {
        console.log(`Duplicate upload Skipped for ${file.originalname}`);
        fs.unlinkSync(file.path); // remove the uploaded file
        continue;
      }

      const nextVersionNumber = PreviousVersion.length + 1;
      const versionLabel = `v${nextVersionNumber}`;

      // To maintain the versioning of files: in-validating the older ones 
      await ObjectMeta.updateMany({
        owner: req.user._id,
        filename: file.originalname,
        folder,
        bucket: bucketName,
        isLatest: true
      }, { isLatest: false });

      // upload to seaweed-fs
      const { fid, fileUrl } = await uploadToSeaweed(file.path, file.originalname, bucketName, folder,versionLabel);
      fs.unlinkSync(file.path);  // To remove the local copy 

      const meta = new ObjectMeta({
        owner: req.user._id,
        filename: file.originalname,
        fid,
        url: fileUrl,
        folder,
        bucket: bucketName,
        size: file.size,
        tags: tagArray,
        access: 'private',
        versionId: crypto.randomUUID(),
        sha256: hash,
        versionLabel,
        versionReason,
        isLatest: true
      });

      await meta.save();

      // adding bloom for successful db insert
      await bloomAdd(hash);

      await produceEvent('file-events',{
        event: 'upload',
        filename: file.originalname,
        version: versionLabel,
        bucket: bucketName,
        user:req.user.email,
        timestamp: new Date().toISOString()
      });

      console.log(`File uploaded: ${file.originalname}`);
      uploads.push(meta);
    }

    if (uploads.length === 0) {
      return res.status(200).json({ message: "No new versions uploaded. Duplicate files were skipped." });
    }

    return res.status(200).json({
      message: 'Upload successful',
      uploaded: uploads.map(f => ({
        fileid:f._id,
        filename: f.filename,
        version: f.versionLabel,
        url: f.url
      }))
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      message: "Upload failed",
      error: err.message
    });
  }
};

module.exports = { uploadFiles };
