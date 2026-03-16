/**
 * @module branch.service
 * @description Business logic for branch management.
 * Called by: branch.controller
 * Calls: branch.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');

const listBranches = async (orgId, filters, branchRepository) => {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;

  const result = await branchRepository.listBranchesPaginated(orgId, {
    offset,
    limit,
    search,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    branches: result.branches.map(b => formatBranch(b)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

const createBranch = async (orgId, data, branchRepository) => {
  const { name, address, city, isRemote, coordinates } = data;

  if (!name || !address || !city) {
    throw new AppError('VAL_001', 'Name, address, city required', 400);
  }

  if (coordinates && coordinates.length < 3) {
    throw new AppError('VAL_001', 'Geofence requires minimum 3 coordinates', 400);
  }

  const branch = await branchRepository.createBranch({
    id: uuidv4(),
    org_id: orgId,
    name,
    address,
    city,
    is_remote: isRemote || false,
    geofence: coordinates ? { coordinates } : null,
  });

  return formatBranch(branch);
};

const getBranchById = async (orgId, branchId, branchRepository) => {
  const branch = await branchRepository.findBranchById(orgId, branchId);
  if (!branch) {
    throw new AppError('BRN_001', 'Branch not found', 404);
  }
  return formatBranch(branch);
};

const updateBranch = async (orgId, branchId, data, branchRepository) => {
  const branch = await branchRepository.findBranchById(orgId, branchId);
  if (!branch) {
    throw new AppError('BRN_001', 'Branch not found', 404);
  }

  const { name, address, city, isRemote } = data;
  const updateData = {};

  if (name) updateData.name = name;
  if (address) updateData.address = address;
  if (city) updateData.city = city;
  if (isRemote !== undefined) updateData.is_remote = isRemote;

  const updated = await branchRepository.updateBranch(orgId, branchId, updateData);
  return formatBranch(updated);
};

const deleteBranch = async (orgId, branchId, branchRepository) => {
  const branch = await branchRepository.findBranchById(orgId, branchId);
  if (!branch) {
    throw new AppError('BRN_001', 'Branch not found', 404);
  }

  const empCount = await branchRepository.countEmployeesByBranch(orgId, branchId);
  if (empCount > 0) {
    throw new AppError('BRN_002', 'Cannot delete branch with employees', 409);
  }

  await branchRepository.deleteBranch(orgId, branchId);
};

const setGeofence = async (orgId, branchId, data, branchRepository) => {
  const branch = await branchRepository.findBranchById(orgId, branchId);
  if (!branch) {
    throw new AppError('BRN_001', 'Branch not found', 404);
  }

  const { coordinates } = data;
  if (!Array.isArray(coordinates) || coordinates.length < 3) {
    throw new AppError('VAL_001', 'Geofence requires minimum 3 valid coordinates', 400);
  }

  const updated = await branchRepository.updateBranch(orgId, branchId, {
    geofence: { coordinates },
  });

  return formatBranch(updated);
};

const removeGeofence = async (orgId, branchId, branchRepository) => {
  const branch = await branchRepository.findBranchById(orgId, branchId);
  if (!branch) {
    throw new AppError('BRN_001', 'Branch not found', 404);
  }

  const updated = await branchRepository.updateBranch(orgId, branchId, { geofence: null });
  return formatBranch(updated);
};

const setWifiVerification = async (orgId, branchId, data, branchRepository) => {
  const branch = await branchRepository.findBranchById(orgId, branchId);
  if (!branch) {
    throw new AppError('BRN_001', 'Branch not found', 404);
  }

  const { bssids } = data;
  if (!Array.isArray(bssids) || bssids.length === 0) {
    throw new AppError('VAL_001', 'At least one WiFi BSSID required', 400);
  }

  const updated = await branchRepository.updateBranch(orgId, branchId, { wifi_bssids: bssids });
  return formatBranch(updated);
};

const formatBranch = (branch) => ({
  id: branch.id,
  name: branch.name,
  address: branch.address,
  city: branch.city,
  isRemote: branch.is_remote,
  geofence: branch.geofence,
  wifiBssids: branch.wifi_bssids,
  createdAt: branch.created_at,
});

module.exports = {
  listBranches,
  createBranch,
  getBranchById,
  updateBranch,
  deleteBranch,
  setGeofence,
  removeGeofence,
  setWifiVerification,
};