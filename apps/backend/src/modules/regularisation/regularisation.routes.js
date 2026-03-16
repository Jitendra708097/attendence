/**
 * @module regularisation.routes
 * @description Route definitions for regularisation request endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const regController = require('./regularisation.controller.js');
const { validate, createRegularisationValidator, updateRegularisationValidator, approveRegularisationValidator, rejectRegularisationValidator  } = require('./regularisation.validator.js');

const router = Router();

router.get('/', verifyJWT, orgGuard, regController.listRegularisations);
router.post('/', verifyJWT, orgGuard, validate(createRegularisationValidator), regController.createRegularisation);
router.get('/:id', verifyJWT, orgGuard, regController.getRegularisationById);
router.put('/:id', verifyJWT, orgGuard, validate(updateRegularisationValidator), regController.updateRegularisation);
router.delete('/:id', verifyJWT, orgGuard, regController.deleteRegularisation);
router.post('/:id/approve', verifyJWT, orgGuard, requireRole(['admin']), validate(approveRegularisationValidator), regController.approveRegularisation);
router.post('/:id/reject', verifyJWT, orgGuard, requireRole(['admin']), validate(rejectRegularisationValidator), regController.rejectRegularisation);

module.exports = router;
