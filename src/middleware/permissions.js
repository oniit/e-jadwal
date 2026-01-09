// Helper to get allowed asset codes for a user
function getAllowedAssetCodes(user) {
  if (!user) return [];
  
  // Superadmin can access all assets
  if (user.role === 'superadmin') {
    return [];
  }
  
  // Admin umum can access all assets
  if (user.role === 'admin' && user.adminType === 'umum') {
    return [];
  }
  
  // Admin khusus can only access their managed assets
  if (user.role === 'admin' && user.adminType === 'khusus') {
    return user.managedAssetCodes || [];
  }
  
  return [];
}

// Helper to check if user can manage specific asset
function canManageAsset(user, assetCode) {
  if (!user) return false;
  
  // Superadmin can manage all
  if (user.role === 'superadmin') return true;
  
  // Admin umum can manage all
  if (user.role === 'admin' && user.adminType === 'umum') return true;
  
  // Admin khusus can only manage their assets
  if (user.role === 'admin' && user.adminType === 'khusus') {
    return (user.managedAssetCodes || []).includes(assetCode);
  }
  
  return false;
}

// Middleware to apply asset filter
function applyAssetFilter(user, query = {}) {
  const allowedCodes = getAllowedAssetCodes(user);
  
  // If empty array, user can access nothing (only for khusus with no assets)
  if (Array.isArray(allowedCodes) && allowedCodes.length === 0 && user.adminType === 'khusus') {
    return { ...query, assetCode: { $in: [] } };
  }
  
  // If allowedCodes is empty for umum/superadmin, don't filter
  if (allowedCodes.length === 0) {
    return query;
  }
  
  // Filter by allowed asset codes
  return { ...query, assetCode: { $in: allowedCodes } };
}

module.exports = {
  getAllowedAssetCodes,
  canManageAsset,
  applyAssetFilter
};
