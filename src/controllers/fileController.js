const objectMeta = require('../models/objectMeta');
const ACL = require('../models/acl');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const moment = require('moment');
const axios = require('axios');
const mongoose = require('mongoose');
const {produceEvent} = require('../utlis/kafka/ProduceEvent');

const SEAWEED_FILER = 'http://localhost:8888';


// To find the files of the Bucket
const listFiles = async (req, res) => {
    try {
        const { bucketName } = req.params;
        const query = { owner: req.user._id, bucket: bucketName };

        if (req.query.folder) query.folder = req.query.folder;

        if (req.query.tags) {
            const TagArray = req.query.tags.split(',').map(tag => tag.trim());
            query.tags = { $in: TagArray };
        }

        const files = await objectMeta.find(query).sort({ createdAt: -1 });
        return res.status(200).json(files);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Failed to list Files" });
    }
}

const DownloadFiles = async (req, res) => {
    try {
        const { bucketName,id } = req.params;
        const file = await objectMeta.findOne({
          _id:id,
          bucket:bucketName
        });
        if (!file) return res.status(404).json({ message: "File not found" });

        if (file.access === 'private' && !file.owner.equals(req.user._id)) {
            return res.status(403).json({ message: "NOT AUTHORIZED TO DOWNLOAD" });
        }
        const seaweed_url = file.url;
        const response = await axios({
          method:'get',
          url:seaweed_url,
          responseType:'stream',
          validateStatus : (status) => status < 500
        });

        if(response.status !== 200){
          return res.status(response.status).json({
            message:`Failed to Retrive ${file.filename} form seaweed-fs`,
            seaweedStatus:response.status
          })
        }
        const contentType = response.headers?.['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.setHeader('Content-Type', contentType);
        response.data.pipe(res);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to download file" });
    }
}

const DownloadMultipleFiles = async (req, res) => {
    try {
        const { bucketName } = req.params;
        const { fileIds } = req.body;

        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ message: "No file IDS Provided" });
        }

        const files = await objectMeta.find({
            _id: { $in: fileIds },
            owner: req.user._id,
            bucket: bucketName
        });

        if (files.length !== fileIds.length || files.length === 0) {
            return res.status(404).json({ message: " files not found" });
        }

        const MAX_FILES = 10;
        if (files.length > MAX_FILES) {
            return res.status(400).json({ message: `Max ${MAX_FILES} files can be downloaded at a time` });
        }

        const timestamp = moment().format('YYYYMMDD_HHmmss');
        const zipfilename = `files_${timestamp}.zip`;
        const archive = archiver('zip', { zlib: { level: 9 } });

        res.attachment(zipfilename).type("application/zip");
        archive.pipe(res);

        for(const file of files){
          const response = await axios.get(file.url,{responseType:'stream'})
          archive.append(response.data,{name:file.filename})
        }
        await archive.finalize();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to download files" });
    }
}

const DeleteFile = async (req, res) => {
    try {
        const { bucketName ,id } = req.params;
        const file = await objectMeta.findOne({ _id: id, bucket: bucketName });

        if (!file) return res.status(404).json({ message: "File not Found" });

        if (file.access === 'private' && !file.owner.equals(req.user._id)) {
            return res.status(403).json({ message: "NOT AUTHORIZED TO DELETE" });
        }
        // seaweed fs path url
        const seaweedPath = new URL(file.url).pathname; 
        //  delete the path
        await axios.delete(`${SEAWEED_FILER}${seaweedPath}`);
        //  Delete the metadata 
        await file.deleteOne({_id:file._id});
        await produceEvent('file-events',{
          event:'delete',
          filename:file.filename,
          bucket:file.bucket,
          user:req.user.email,
          timestamp: new Date().toISOString()
        })
        return res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Deletion Failed" });
    }
}

const SearchFiles = async (req, res) => {
    try {
        const { bucketName } = req.params;
        const { name, tags } = req.query;
        const query = { owner: req.user._id, bucket: bucketName };

        if (name) query.filename = { $regex: name, $options: 'i' };

        if (tags) {
            const TagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: TagArray };
        }

        const files = await objectMeta.find(query);
        return res.status(200).json(files);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to search files" });
    }
}

const ListFileVersions = async (req, res) => {
    try {
      const { filename, bucketName } = req.params;
      const folder = req.query.folder;
  
      const query = {
        owner: req.user._id,
        filename,
        bucket: bucketName
      };
  
      if (folder) query.folder = folder;
  
      const versions = await objectMeta.find(query).sort({ createdAt: -1 });
  
      const response = versions.map(v => ({
        versionId: v.versionId,
        versionLabel: v.versionLabel,
        isLatest: v.isLatest,
        filename: v.filename,
        folder: v.folder,
        size: v.size,
        createdAt: v.createdAt,
        tags: v.tags,
        versionReason: v.versionReason,
        _id: v._id
      }));
  
      return res.status(200).json({
        file: filename,
        folder: folder || '',
        totalVersions: versions.length,
        versions: response
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to list file versions" });
    }
  };
  
const DownloadByVersionLabel = async (req, res) => {
    try {
      const { versionLabel, filename, bucketName } = req.params;
      const folder = req.query.folder ||  '';
  
      const file  = await objectMeta.findOne({
        owner: req.user._id,
        filename,
        versionLabel,
        bucket:bucketName,
        folder
      });
      
      if (!file) {
        return res.status(404).json({ message: "File Not Found" });
      }
      
      const seaweed_url = file.url;
      const response = await axios({
        method:'get',
        url:seaweed_url,
        responseType:'stream',
        validateStatus : (status) => status < 500
      })
      
      if(response.status !== 200){
        return res.status(response.status).json({
          message:`Failed to Retrive ${file.filename} form seaweed-fs`,
          seaweedStatus:response.status
        })
      }
      const contentType = response.headers?.['content-type'] || 'application/octet-stream';
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', contentType);
      response.data.pipe(res);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Download Failed" });
    }
  };
  
  const RollBackVersion = async (req, res) => {
    try {
      const { filename, versionLabel, bucketName } = req.params;
      const folder = req.query.folder || '';
  
      // dynamic query
      const matchQuery = {
        owner: req.user._id,
        filename,
        versionLabel,
        bucket: bucketName
      };
  
      if (folder) matchQuery.folder = folder;
      const target = await objectMeta.findOne(matchQuery);
  
      if (!target) {
        return res.status(404).json({ message: "File Not Found" });
      }
      // Unset previous latest version
      const latestResetQuery = {
        owner: req.user._id,
        filename,
        bucket: bucketName,
        isLatest: true
      };
      if (folder) latestResetQuery.folder = folder;
  
      await objectMeta.updateMany(latestResetQuery, { isLatest: false });
  
      // Promote this version
      target.isLatest = true;
      await target.save();
  
      return res.status(200).json({ message: `Rolled Back to Version ${target.versionLabel}` });
  
    } catch (error) {
      console.error(' Rollback Error:', error);
      return res.status(500).json({
        message: `Failed to Roll Back Version ${req.params.versionLabel}`
      });
    }
  };
// To Give access of an OBJECT to an another user
const shareFile = async (req, res) => {
  try {
    const { id, bucketName } = req.params;
    const { userIds = [], permission = 'read', expiresInMinutes } = req.body;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid file ID format' });
    }

    // 🔍 Fetch file by ID + bucket match (for extra safety)
    const file = await objectMeta.findOne({
      _id: id,
      bucket: bucketName
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found in this bucket' });
    }

    // 🔐 Only file owner can share
    if (!file.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to share this file' });
    }

    file.access = 'shared';
    await file.save();

    const expiresAt = expiresInMinutes
      ? new Date(Date.now() + expiresInMinutes * 60 * 1000)
      : null;

    const aclEntries = userIds.map(uid => ({
      resourceType: 'file',
      resourceId: file._id,
      user: uid,
      permission,
      expiresAt
    }));

    await ACL.insertMany(aclEntries);

    console.log(`✅ File ${id} shared with ${userIds} (${permission})`);
    return res.status(200).json({ message: 'File shared successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to share file' });
  }
};

module.exports = { shareFile };


module.exports = {
    listFiles,
    DownloadFiles,
    DeleteFile,
    SearchFiles,
    DownloadMultipleFiles,
    ListFileVersions,
    DownloadByVersionLabel,
    RollBackVersion,
    shareFile
};
