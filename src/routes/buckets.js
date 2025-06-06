const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewear/authMiddlwear');
const {authorizeFileAccess} = require('../middlewear/aclMiddlewear');

const {
  createBucket,
  listBuckets,
  ObjectsInBucket
} = require('../controllers/bucketController');

router.post('/buckets', verifyToken, createBucket);
router.get('/buckets', verifyToken, listBuckets);
router.get('/buckets/:name/objects', verifyToken, authorizeFileAccess('read'), ObjectsInBucket);

module.exports = router;
