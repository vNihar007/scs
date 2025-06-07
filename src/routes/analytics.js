const express = require('express');
const router  = express.Router();
const verifyToken = require('../middlewear/authMiddlwear');
const {StorageAnalytics,UserMetrics,PerformaceMetrics,exportUsageReport} = require('../controllers/analyticsController');


router.get('/storage',verifyToken,StorageAnalytics);
router.get('/activity',verifyToken,UserMetrics);
router.get('/performance',verifyToken,PerformaceMetrics);
router.get('/reports',verifyToken,exportUsageReport);


module.exports = router ;