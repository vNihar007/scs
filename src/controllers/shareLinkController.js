const { v4: uuidv4 } = require('uuid');
const path = require('path');
const SharedLink = require('../models/SharedLink');
const objectMeta = require('../models/objectMeta');
const {produceEvent} = require('../utlis/kafka/ProduceEvent');
const axios = require('axios');

// Generate a public shareable link for a file in a specific bucket
const generatePublicLink = async (req, res) => {
  try {
    const { id, bucketName } = req.params;
    const { expiresInMinutes = 60 } = req.body;

    // Find the file within the user's scope and specific bucket
    const file = await objectMeta.findOne({ _id: id, owner: req.user.id, bucket: bucketName });

    if (!file) {
      return res.status(404).json({ message: 'File Not Found' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const link = await SharedLink.create({
      file: file._id,
      token,
      expiresAt,
    });

    await produceEvent('file-events',{
      event:'share_link_created',
      filename:file.filename,
      bucket:file.bucket,
      user:req.user.email,
      token,
      expiresAt,
      timestamp: new Date().toISOString()
    })
    res.status(201).json({
      message: 'Shareable Link Created',
      token : link.token,
      link: `${req.protocol}://${req.get('host')}/public/${bucketName}/${link.token}`,
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to generate public link' });
  }
}

// Download the file using the public token
const DownloadViaPublicToken = async (req, res) => {
  try {
    const { token, bucketName } = req.params;
    const link = await SharedLink.findOne({ token }).populate('file');

    // Validate link and bucket
    if (!link || new Date() > link.expiresAt) {
      return res.status(410).json({ message: 'Link Invalid or Expired' });
    }

    if (link.file.bucket !== bucketName) {
      return res.status(403).json({ message: 'Access denied: Bucket mismatch' });
    }

    const fileStream = await axios({
      method:'get',
      url: link.file.url,
      responseType:'stream'
    })
    res.setHeader('Content-Disposition', `attachment; filename="${link.file.filename}"`);
    res.setHeader('Content-Type', fileStream.headers['content-type']);
    fileStream.data.pipe(res);

    console.log(`File Downloaded with ${link.token} named ${link.file.filename}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to download file' });
  }
}

module.exports = {
  generatePublicLink,
  DownloadViaPublicToken
};
