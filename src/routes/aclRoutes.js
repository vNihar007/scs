const express = require('express');
const router  = express.Router();
const verifyToken = require('../middlewear/authMiddlwear');
const assignOwnerAcl = require('../controllers/aclController');

router.post('/assign-owner',verifyToken,assignOwnerAcl);

module.exports = router;

