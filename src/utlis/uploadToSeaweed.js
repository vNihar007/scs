const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SEAWEED_FILER = 'http://localhost:8888';

const uploadToSeaweed = async (filepath, originalFilename, bucketName, folder,versionLabel) => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filepath));

    const uploadPath = `/${bucketName}/${folder}/${versionLabel}_${originalFilename}`;
    const targetUrl = `${SEAWEED_FILER}${uploadPath}`;

    const response = await axios.post(targetUrl, form, {
      headers: form.getHeaders(),
    });

    console.log(`Uploaded to SeaweedFS Filer at: ${uploadPath}`);

    return {
      fid: uploadPath, // optional, if you want to keep
      fileUrl: targetUrl,
    };
  } catch (error) {
    console.error('Error uploading via Filer:', error.message);
    throw error;
  }
};

module.exports = { uploadToSeaweed };
