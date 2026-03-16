/**
 * @module department.routes
 * @description Route definitions for department endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const deptController = require('./department.controller.js');
const { validate, createDepartmentValidator, updateDepartmentValidator  } = require('./department.validator.js');

const router = Router();

router.get('/', verifyJWT, orgGuard, deptController.listDepartments);
router.post('/', verifyJWT, orgGuard, requireRole(['admin']), validate(createDepartmentValidator), deptController.createDepartment);
router.get('/:id', verifyJWT, orgGuard, deptController.getDepartmentById);
router.put('/:id', verifyJWT, orgGuard, requireRole(['admin']), validate(updateDepartmentValidator), deptController.updateDepartment);
router.delete('/:id', verifyJWT, orgGuard, requireRole(['admin']), deptController.deleteDepartment);

module.exports = router;
