const Asset = require('../models/asset');
const User = require('../models/user');

// Collect all asset codes managed by any admin khusus (active only)
async function collectKhususManagedCodes() {
  const khususAdmins = await User.find({ role: 'admin', adminType: 'khusus', isActive: true })
    .select('managedAssetCodes')
    .lean();

  const managed = new Set();
  khususAdmins.forEach((admin) => {
    (admin.managedAssetCodes || []).forEach((code) => {
      if (code) managed.add(code);
    });
  });

  return managed;
}

// Helper to get allowed asset codes for a user
async function getAllowedAssetCodes(user) {
  if (!user) {
    return { allowedCodes: [], unrestricted: false };
  }

  // Superadmin can access all assets
  if (user.role === 'superadmin') {
    return { allowedCodes: [], unrestricted: true };
  }

  // Admin umum can access assets not handled by any admin khusus
  if (user.role === 'admin' && user.adminType === 'umum') {
    const managedCodes = await collectKhususManagedCodes();
    if (managedCodes.size === 0) {
      // No khusus admins: full access
      return { allowedCodes: [], unrestricted: true };
    }

    const unmanagedAssets = await Asset.find({ code: { $nin: [...managedCodes] } })
      .select('code')
      .lean();
    const allowedCodes = unmanagedAssets.map((asset) => asset.code);
    return { allowedCodes, unrestricted: false };
  }

  // Admin khusus can only access their managed assets
  if (user.role === 'admin' && user.adminType === 'khusus') {
    return { allowedCodes: Array.from(new Set(user.managedAssetCodes || [])), unrestricted: false };
  }

  // Supir can't access assets directly
  if (user.role === 'supir') {
    return { allowedCodes: [], unrestricted: false };
  }

  return { allowedCodes: [], unrestricted: false };
}

// Helper to check if user can manage specific asset
async function canManageAsset(user, assetCode) {
  if (!user) return false;

  const { allowedCodes, unrestricted } = await getAllowedAssetCodes(user);
  if (unrestricted) return true;

  if (!assetCode) return false;
  return allowedCodes.includes(assetCode);
}

// Helper to check if user can create drivers
function canCreateDriver(user) {
  if (!user) return false;
  
  // Only superadmin and admin umum can create drivers
  if (user.role === 'superadmin') return true;
  if (user.role === 'admin' && user.adminType === 'umum') return true;
  
  return false;
}

// Middleware to apply asset filter
async function applyAssetFilter(user, query = {}) {
  const { allowedCodes, unrestricted } = await getAllowedAssetCodes(user);

  if (unrestricted) return query;

  // No allowed codes -> explicit empty filter
  if (allowedCodes.length === 0) {
    return { ...query, assetCode: { $in: [] } };
  }

  // Filter by allowed asset codes
  return { ...query, assetCode: { $in: allowedCodes } };
}

module.exports = {
  getAllowedAssetCodes,
  canManageAsset,
  canCreateDriver,
  applyAssetFilter
};
