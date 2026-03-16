/**
 * @module branch.controller
 * @description Handles branch CRUD operations.
 */
const branchService = require('./branch.service.js');
const branchRepository = require('./branch.repository.js');
const { logAudit } = {};  // TODO: Implement audit logging

const listBranches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await branchService.listBranches(req.org_id, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    }, branchRepository);
    res.status(200).json({
      success: true,
      message: 'Branches fetched',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const branch = await branchService.createBranch(req.org_id, req.body, branchRepository);
    logAudit(req, 'CREATE', 'Branch', branch.id, { name: branch.name });
    res.status(201).json({
      success: true,
      message: 'Branch created',
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

const getBranchById = async (req, res, next) => {
  try {
    const branch = await branchService.getBranchById(req.org_id, req.params.id, branchRepository);
    res.status(200).json({
      success: true,
      message: 'Branch fetched',
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const branch = await branchService.updateBranch(req.org_id, req.params.id, req.body, branchRepository);
    logAudit(req, 'UPDATE', 'Branch', req.params.id, { changes: Object.keys(req.body) });
    res.status(200).json({
      success: true,
      message: 'Branch updated',
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    await branchService.deleteBranch(req.org_id, req.params.id, branchRepository);
    logAudit(req, 'DELETE', 'Branch', req.params.id, {});
    res.status(200).json({
      success: true,
      message: 'Branch deleted',
    });
  } catch (err) {
    next(err);
  }
};

const setGeofence = async (req, res, next) => {
  try {
    const branch = await branchService.setGeofence(req.org_id, req.params.id, req.body, branchRepository);
    logAudit(req, 'UPDATE', 'Branch.Geofence', req.params.id, { coordinates: req.body.coordinates.length });
    res.status(200).json({
      success: true,
      message: 'Geofence updated',
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

const removeGeofence = async (req, res, next) => {
  try {
    const branch = await branchService.removeGeofence(req.org_id, req.params.id, branchRepository);
    logAudit(req, 'DELETE', 'Branch.Geofence', req.params.id, {});
    res.status(200).json({
      success: true,
      message: 'Geofence removed',
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

const setWifiVerification = async (req, res, next) => {
  try {
    const branch = await branchService.setWifiVerification(req.org_id, req.params.id, req.body, branchRepository);
    logAudit(req, 'UPDATE', 'Branch.WiFi', req.params.id, { bssids: req.body.bssids.length });
    res.status(200).json({
      success: true,
      message: 'WiFi verification updated',
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

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