const ACL = require('../models/acl');
const Bucket = require('../models/bucket');

const authorizeFileAccess = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { id, bucketName } = req.params;

      let resourceId = null;

      // Check if it's a file-based access
      if (id) {
        resourceId = id;
      } 
      // If it's a bucket-based route
      if (!resourceId && bucketName) {
        const bucket = await Bucket.findOne({ name: bucketName, owner: userId });

        if (!bucket) return res.status(404).json({ message: 'Bucket Not Found' });

        resourceId = bucket._id;
        console.log(`Became the resource id ${resourceId}`); 
      }

      if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID missing in route parameters' });
      }

      // ACL Check (either owner or granted permission)
      const acl = await ACL.findOne({
        resourceId,
        user: userId,
        permission: { $in: [requiredPermission, 'owner'] },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      });

      if (!acl) {
        if (requiredPermission === 'read' && bucket.access === 'public') {
          return next(); // allow public read access
        }
        return res.status(403).json({ message: 'Access Denied' });
      }
      

      req.acl = acl;
      return next();
    } catch (err) {
      console.error('ACL middleware failed:', err);
      return res.status(500).json({ message: 'ACL middleware error' });
    }
  };
};

module.exports = { authorizeFileAccess };
