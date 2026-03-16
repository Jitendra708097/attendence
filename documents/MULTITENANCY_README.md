# AttendEase — Multi-Tenancy Architecture

**Strategy:** Shared Database + `org_id` Row-Level Isolation  
**Status:** Locked ✅  
**Last Updated:** March 2026

---

## Table of Contents

1. [Strategy Decision](#1-strategy-decision)
2. [The org_id Contract](#2-the-org_id-contract)
3. [orgGuard Middleware](#3-orgguard-middleware)
4. [Sequelize Named Scopes](#4-sequelize-named-scopes)
5. [Row Level Security (RLS) — Decision](#5-row-level-security-rls--decision)
6. [The One Query That Breaks Everything](#6-the-one-query-that-breaks-everything)
7. [Super Admin + Impersonation Exception](#7-super-admin--impersonation-exception)
8. [Clean Service Layer Pattern](#8-clean-service-layer-pattern)
9. [Request Flow — End to End](#9-request-flow--end-to-end)
10. [Code Review Checklist](#10-code-review-checklist)

---

## 1. Strategy Decision

Three multi-tenancy models exist. AttendEase uses **Shared DB + `org_id`**.

| Model | How It Works | Verdict |
|---|---|---|
| Separate DB per org | Each client gets their own database | ❌ Ops nightmare. 500 clients = 500 databases to migrate, monitor, backup |
| Separate Schema per org | Each client gets a Postgres schema | ❌ Schema migrations run 500×. Connection pooling breaks. |
| ✅ **Shared DB + `org_id`** | One DB, every row tagged with `org_id` | ✅ Simple, cheap, easy migrations, scales well to 50K employees |

**The trade-off:** Perfect isolation is sacrificed for operational simplicity. The risk lives entirely in application code — one missing `org_id` in a WHERE clause leaks another company's data. This is why `orgGuard`, named scopes, and the patterns in this document are non-negotiable.

---

## 2. The `org_id` Contract

> **`org_id` ONLY ever comes from the verified JWT. Never from request body, URL params, or query strings.**

This is the single most important rule in the codebase. Everything else in this document enforces it.

### Why — The Attack Vector

```javascript
// 🔴 WRONG — attacker controls org_id
const employees = await Employee.findAll({
  where: { org_id: req.body.org_id }   // attacker sends any org_id they want
});

// ✅ RIGHT — org_id from signed JWT, verified by middleware
const employees = await Employee.findAll({
  where: { org_id: req.user.orgId }    // comes from token, cannot be spoofed
});
```

An attacker only needs to change one field in a request body to read another company's entire employee list. The JWT is signed — it cannot be modified without invalidating the signature.

### The Contract in Code

```
Source of org_id:   JWT payload (req.user.orgId)
Set by:             authMiddleware → orgGuard → res.locals.orgId
Used by:            Every service function — passed as first argument
Never from:         req.body, req.params, req.query
```

---

## 3. `orgGuard` Middleware

Runs on every org-scoped route. Placed after `authMiddleware` (JWT verification).

```javascript
// apps/backend/src/middleware/orgGuard.js

/**
 * orgGuard — Multi-tenancy enforcement middleware
 *
 * Guarantees:
 *   - req.user.orgId is always present on protected org routes
 *   - org_id NEVER comes from request body / params / query
 *   - Super admins are blocked (they access org data via impersonation only)
 *
 * Prerequisites:
 *   - Must run AFTER authMiddleware (JWT must already be verified)
 *
 * Injects:
 *   - res.locals.orgId — available to all downstream handlers
 */
const orgGuard = (req, res, next) => {
  const { orgId, role } = req.user;

  // Super admins have orgId: null in their token.
  // They must use impersonation to access org data — never direct access.
  if (role === 'superadmin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_010',
        message: 'Super admins must use impersonation to access org data'
      }
    });
  }

  // Every other role MUST have an orgId in their token.
  if (!orgId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_011',
        message: 'Organisation context missing from token'
      }
    });
  }

  // Inject into res.locals — downstream handlers use this, not req.user
  res.locals.orgId = orgId;
  next();
};

module.exports = { orgGuard };
```

### Middleware Stack Order

```javascript
// apps/backend/src/routes/employees.js
const router = express.Router();

// Order matters — each layer depends on the previous
router.use(rateLimiter);          // 1. Rate limiting (no auth needed)
router.use(authenticateToken);    // 2. Verify JWT → sets req.user
router.use(orgGuard);             // 3. Extract org_id → sets res.locals.orgId
router.use(auditLogger);          // 4. Audit logging (needs orgId)

router.get('/',     getEmployees);
router.post('/',    createEmployee);
router.get('/:id',  getEmployee);
router.put('/:id',  updateEmployee);
router.delete('/:id', deleteEmployee);
```

---

## 4. Sequelize Named Scopes

`orgGuard` puts `orgId` in `res.locals`. But without a model-level safety net, every developer must remember to include `org_id` in every `findAll`, `findOne`, `update`, and `destroy` across 57 routes. One slip = data leak.

Named scopes enforce the pattern at the model layer.

### Why Named Scope, Not Default Scope

Sequelize's `defaultScope` is automatically applied to every query — including Super Admin queries that legitimately need cross-org access. A named scope is opt-in and explicit.

```javascript
// ❌ defaultScope — cannot be bypassed cleanly
// defaultScope: { where: { org_id: ??? } }  // what value? breaks super admin

// ✅ Named scope — explicit, bypassed only when intentional
scopes: {
  forOrg(orgId) {
    return { where: { org_id: orgId } };
  }
}
```

### Model Definition Pattern

```javascript
// apps/backend/src/models/Employee.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  org_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'organisations', key: 'id' }
  },
  name:      { type: DataTypes.STRING(100), allowNull: false },
  email:     { type: DataTypes.STRING(255), allowNull: false },
  // ... rest of fields

}, {
  tableName: 'employees',
  paranoid: true,   // soft deletes via deleted_at

  scopes: {
    /**
     * forOrg — apply to EVERY query that touches this model
     *
     * Usage:
     *   Employee.scope({ method: ['forOrg', orgId] }).findAll(...)
     *   Employee.scope({ method: ['forOrg', orgId] }).findOne(...)
     *   Employee.scope({ method: ['forOrg', orgId] }).count(...)
     */
    forOrg(orgId) {
      return {
        where: { org_id: orgId }
      };
    }
  }
});

module.exports = Employee;
```

**Apply this `forOrg` scope pattern to every model that has `org_id`:**
`branches`, `departments`, `shifts`, `employees`, `attendance`, `leave_requests`, `regularisations`, `holidays`, `notifications`, `device_tokens`, `audit_logs`

### Service Layer Usage

```javascript
// apps/backend/src/services/employeeService.js

/**
 * orgId is ALWAYS the first parameter on every service function
 * This makes it impossible to call a service without org context
 */

const getEmployees = async (orgId, filters = {}) => {
  return Employee
    .scope({ method: ['forOrg', orgId] })
    .findAll({
      where: filters,
      order: [['created_at', 'DESC']]
    });
};

const getEmployeeById = async (orgId, empId) => {
  const employee = await Employee
    .scope({ method: ['forOrg', orgId] })
    .findOne({ where: { id: empId } });

  // Returns null for BOTH "not found" AND "belongs to different org"
  // Never reveal which — attacker gets "not found" either way
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  return employee;
};

const updateEmployee = async (orgId, empId, updates) => {
  // Fetch first to verify org ownership, then update
  const employee = await getEmployeeById(orgId, empId);
  return employee.update(updates);
};

const deleteEmployee = async (orgId, empId) => {
  const employee = await getEmployeeById(orgId, empId);
  return employee.destroy(); // paranoid: true → sets deleted_at
};
```

---

## 5. Row Level Security (RLS) — Decision

Postgres supports RLS — policies that enforce `org_id` at the database driver level.

```sql
-- Example of what RLS would look like
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON employees
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

### Comparison

| | RLS (Postgres) | orgGuard + Named Scopes |
|---|---|---|
| Enforcement level | Database driver | Application layer |
| Can be bypassed? | No — even raw `psql` is blocked | Yes — if dev forgets the scope |
| Complexity | High — session variables, Postgres config | Medium — middleware + models |
| Sequelize compatibility | Awkward — must set session var per request | Native |
| Direct DB safety | ✅ Protected | ❌ Raw `psql` has no protection |
| Performance overhead | Minor — per-row policy check | Zero |

### Decision: Skip RLS for V1

**Reasons:**

1. Team is JS-native — RLS is a Postgres DBA skill. Adds ops complexity with little V1 payoff.
2. `orgGuard` + named scopes + code review catches the same class of bugs.
3. `audit_logs` table provides full traceability — any leak is detectable post-facto.
4. No direct DB access granted to anything other than the API in V1.

**Add RLS in V2 when:** A BI tool (Metabase, Superset, Redash) is given a direct read connection to the database, bypassing the API entirely. At that point, application-layer guards are insufficient.

> **Documented decision:** *"RLS deferred to V2. Trigger: first direct DB read access granted to BI/analytics tooling."*

---

## 6. The One Query That Breaks Everything

The most dangerous pattern is a lookup by primary key without `org_id` in the WHERE clause. It feels safe because UUIDs are "unique." They are — but they are not secret.

```javascript
// 🔴 THE DANGEROUS PATTERN
const getAttendanceRecord = async (orgId, attendanceId) => {
  return Attendance.findOne({
    where: { id: attendanceId }   // ← org_id missing
    // Attacker sends any attendanceId from any org → gets their data
  });
};
```

An attacker who enumerates UUIDs (or intercepts one from network traffic) can pull any record from any organisation.

```javascript
// ✅ THE SAFE PATTERN — always scope by BOTH org_id AND id
const getAttendanceRecord = async (orgId, attendanceId) => {
  const record = await Attendance
    .scope({ method: ['forOrg', orgId] })   // org_id in scope
    .findOne({
      where: { id: attendanceId },
      include: [{
        model: Employee,
        where: { org_id: orgId }            // scope the join too
      }]
    });

  if (!record) throw new AppError('ATT_001', 'Record not found', 404);
  return record;
};
```

### The 4 Dangerous Patterns + Safe Alternatives

#### Pattern 1 — `findByPk()` Ignores All Scopes

`findByPk` is a Sequelize convenience method. It **completely bypasses all named and default scopes.** Never use it in AttendEase.

```javascript
// 🔴 WRONG — scopes are silently ignored
Employee.findByPk(empId)

// ✅ RIGHT — scopes applied correctly
Employee.findOne({ where: { id: empId, org_id: orgId } })
```

> **Rule:** `findByPk` is banned in AttendEase service layer code. Replace with `findOne` + explicit `org_id`.

#### Pattern 2 — Includes / Joins Without Scope

When you include an associated model, Sequelize does NOT automatically scope the included model.

```javascript
// 🔴 WRONG — Employee join is unscoped
Attendance.scope({ method: ['forOrg', orgId] }).findAll({
  include: [Employee]   // Pulls employees from ALL orgs if FK is cross-org
});

// ✅ RIGHT — both parent and include are scoped
Attendance.scope({ method: ['forOrg', orgId] }).findAll({
  include: [{
    model: Employee,
    where: { org_id: orgId },
    required: true
  }]
});
```

#### Pattern 3 — Bulk Updates Without `org_id`

```javascript
// 🔴 WRONG — updates attendance rows for ALL orgs with this shift_id
Attendance.update(
  { status: 'absent' },
  { where: { shift_id: shiftId } }
);

// ✅ RIGHT — scoped to org
Attendance.update(
  { status: 'absent' },
  { where: { shift_id: shiftId, org_id: orgId } }
);
```

#### Pattern 4 — Raw Queries

Scopes do not apply to `sequelize.query()`. Every raw query must manually include `org_id`.

```javascript
// 🔴 WRONG
sequelize.query(
  'SELECT * FROM attendance WHERE shift_id = :shiftId',
  { replacements: { shiftId } }
);

// ✅ RIGHT
sequelize.query(
  `SELECT * FROM attendance
   WHERE shift_id = :shiftId
     AND org_id   = :orgId`,
  { replacements: { shiftId, orgId } }
);
```

---

## 7. Super Admin + Impersonation Exception

Super admins have `orgId: null` in their JWT. They legitimately need cross-org access for support and billing operations. This is handled without punching holes in `orgGuard`.

### Two Access Modes for Super Admins

**Mode 1 — Super Admin Routes** (`/api/v1/superadmin/*`)

These routes have their own `superAdminGuard` middleware instead of `orgGuard`. They return cross-org data for the Super Admin dashboard (org list, billing, platform health).

```javascript
// apps/backend/src/routes/superadmin.js
router.use(authenticateToken);
router.use(superAdminGuard);    // verifies role === 'superadmin', NOT orgGuard

router.get('/organisations', getAllOrgs);
router.get('/health',        getPlatformHealth);
// ...
```

**Mode 2 — Impersonation** (Access org data as an admin)

When a super admin starts an impersonation session, they receive a special 30-minute token with a real `orgId`:

```javascript
// Impersonation token payload
{
  userId: superAdminUserId,    // super admin's own ID
  orgId: targetOrgId,          // the org being impersonated
  role: 'admin',               // behaves as org admin
  isImpersonated: true,
  impersonatedBy: superAdminId,
  exp: now + 1800              // 30 minutes, no refresh
}
```

This token **passes `orgGuard` normally** — it has a real `orgId`. The impersonation is tracked via the `impersonatedBy` field, which the audit logger picks up on every action.

```javascript
// apps/backend/src/middleware/auditLogger.js

const auditLogger = async (req, res, next) => {
  // Runs after response — captures what was done
  res.on('finish', async () => {
    await AuditLog.create({
      org_id:          res.locals.orgId,
      actor_id:        req.user.userId,
      impersonated_by: req.user.impersonatedBy || null,  // super admin's ID if impersonated
      action:          `${req.method} ${req.path}`,
      ip_address:      req.ip,
      user_agent:      req.headers['user-agent'],
      status_code:     res.statusCode,
    });
  });
  next();
};
```

### Impersonation Rules

```
Hard time limit:    30 minutes, no refresh
Token refresh:      Explicitly blocked (impersonation tokens cannot be refreshed)
Audit trail:        Every action tagged with impersonated_by in audit_logs
UI indicator:       "Support Session Active" banner shown to org admin
Org admin email:    Notification sent when impersonation session starts
Super Admin log:    Separate entry in impersonation_sessions table
```

---

## 8. Clean Service Layer Pattern

`orgId` flows from JWT → middleware → route handler → service function. It is never stored in a global variable, module-level state, or thread-local equivalent.

### Convention

> **Every service function that accesses org-scoped data takes `orgId` as its first parameter.**

This makes it structurally impossible to call a service without org context. Passing `undefined` as the first argument is an obvious mistake — passing it inside an object is easy to miss.

```javascript
// ✅ CORRECT — orgId is the first param, explicit and required
const getEmployees     = async (orgId, filters) => { ... }
const getEmployeeById  = async (orgId, empId)   => { ... }
const createEmployee   = async (orgId, data)    => { ... }
const updateEmployee   = async (orgId, empId, updates) => { ... }
const deleteEmployee   = async (orgId, empId)   => { ... }
```

### Route Handler — Thin Wiring Layer

Route handlers extract from HTTP, call service, return HTTP. Nothing else.

```javascript
// apps/backend/src/controllers/employeeController.js

const getEmployeesHandler = async (req, res, next) => {
  try {
    const { orgId } = res.locals;          // from orgGuard — never from req
    const employees = await employeeService.getEmployees(orgId, req.query);
    res.json({ success: true, data: employees });
  } catch (err) {
    next(err);
  }
};

const getEmployeeHandler = async (req, res, next) => {
  try {
    const { orgId } = res.locals;
    const employee = await employeeService.getEmployeeById(orgId, req.params.id);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);                             // AppError → global error handler
  }
};
```

---

## 9. Request Flow — End to End

```
HTTP Request: GET /api/v1/employees/abc-123
Authorization: Bearer <access_token>

  1. rateLimiter
       └── Check request rate (no auth needed)

  2. authenticateToken
       └── Verify JWT signature
       └── Decode payload: { userId, orgId, role }
       └── Set req.user = { userId, orgId: 'org-xyz', role: 'admin' }

  3. orgGuard
       └── Verify role !== 'superadmin'
       └── Verify orgId exists in token
       └── Set res.locals.orgId = 'org-xyz'

  4. getEmployeeHandler (route handler)
       └── const orgId = res.locals.orgId  ← from JWT, not request
       └── call employeeService.getEmployeeById('org-xyz', 'abc-123')

  5. employeeService.getEmployeeById
       └── Employee
             .scope({ method: ['forOrg', 'org-xyz'] })
             .findOne({ where: { id: 'abc-123' } })

  6. Sequelize → PostgreSQL
       └── SELECT * FROM employees
           WHERE org_id = 'org-xyz'   ← from scope
             AND id     = 'abc-123'   ← from where
             AND deleted_at IS NULL   ← from paranoid

  7. Result
       └── Record found → return to handler → 200 response
       └── Record not found (wrong org or deleted) → AppError EMP_001 → 404
```

**The org isolation is enforced at Step 3 (orgGuard) and re-enforced at Step 6 (Sequelize scope + PostgreSQL WHERE clause).** Two independent layers means a bug in one layer does not automatically mean a data leak.

---

## 10. Code Review Checklist

Every PR that touches data access must pass this checklist before merge.

```
MULTI-TENANCY REVIEW CHECKLIST
────────────────────────────────────────────────────────────

SOURCE OF org_id
  □ org_id comes from res.locals.orgId (from JWT), not req.body / req.params / req.query
  □ orgId is passed as the first argument to every service function called

MODEL QUERIES
  □ No usage of findByPk() anywhere — replaced with findOne({ where: { id, org_id } })
  □ Every findAll() uses .scope({ method: ['forOrg', orgId] })
  □ Every findOne() uses .scope({ method: ['forOrg', orgId] }) OR explicit org_id in where

ASSOCIATIONS / INCLUDES
  □ All included/joined models also have org_id in their where clause

BULK OPERATIONS
  □ All update() calls have org_id in the WHERE clause
  □ All destroy() calls have org_id in the WHERE clause (or go through a scoped findOne first)

RAW QUERIES
  □ All sequelize.query() calls include AND org_id = :orgId in SQL
  □ :orgId is in the replacements object, not string-interpolated

NEW MODELS
  □ New model has org_id column with NOT NULL constraint and FK to organisations
  □ New model has forOrg(orgId) named scope defined
  □ New model is added to the list in Section 4

NEW ROUTES
  □ New route file has orgGuard in the middleware stack (after authenticateToken)
  □ No route handler reads org_id from anywhere except res.locals

SUPER ADMIN
  □ Super admin routes use superAdminGuard, not orgGuard
  □ Impersonation actions will be tagged via impersonatedBy in the token

────────────────────────────────────────────────────────────
All boxes must be checked. One miss can leak data across organisations.
```

---

## Summary — Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Tenancy model | Shared DB + `org_id` | Operational simplicity at current scale |
| `org_id` source | JWT only | Cannot be spoofed; attacker cannot influence |
| Scope strategy | Named scope `forOrg` (not `defaultScope`) | Can be bypassed for super admin cross-org queries |
| `findByPk` | Banned | Silently bypasses all Sequelize scopes |
| Raw queries | Allowed with mandatory `:orgId` replacement | Needed for complex report queries |
| RLS | Deferred to V2 | Low V1 risk; add when BI tools get direct DB access |
| Super admin access | Separate routes + impersonation tokens | No holes in `orgGuard`; full audit trail |
| Service convention | `orgId` as first parameter always | Structurally prevents calling service without context |
