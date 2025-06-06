const ACL = require('../models/acl');

const canAccessFile = async (fileId, userId, requiredPermission = 'read') => {
  const acl = await ACL.findOne({
    resourceId: fileId,
    user: userId,
    permission: { $in: [requiredPermission, 'owner'] },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  });

  return !!acl;
};
