const ACL = require('../models/acl');
const Bucket = require('../models/bucket');

const authorizeFileAccess = (requiredPermission) => {
    return async (req, res, next) => {
      let resourceId = null;
      const userId = req.user._id;
  
      // Resolve bucket ObjectId if only bucketName is present
      if (req.params.bucketName && !req.params.id) {
        const bucket = await Bucket.findOne({
          name: req.params.bucketName,
          owner: userId
        });
  
        if (!bucket) {
          return res.status(404).json({ message: 'Bucket Not Found' });
        }
  
        resourceId = bucket._id;
      }
  
      // If it's a file route with :id
      if (!resourceId && req.params.id) {
        resourceId = req.params.id;
      }
  
      if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID missing in route parameters' });
      }
  
      const acl = await ACL.findOne({
        resourceId,
        user: userId,
        permission: { $in: [requiredPermission, 'owner'] },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      });
  
      if (!acl) {
        return res.status(403).json({ message: 'Access Denied' });
      }
  
      req.acl = acl;
      next();
    };
  };
  

module.exports = { authorizeFileAccess };
