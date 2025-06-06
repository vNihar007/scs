const express = require('express');
const router = express.Router();

const {generatePublicLink,
    DownloadViaPublicToken} = require("../controllers/shareLinkController");
const verifyToken = require('../middlewear/authMiddlwear');

router.post('/:id/:bucketName/share',verifyToken,generatePublicLink) // protected route
router.get('/:token/:bucketName',DownloadViaPublicToken) //  public route


module.exports = router;
