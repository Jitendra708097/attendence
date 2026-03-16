/**
 * @module verifyJWT
 * @description JWT verification middleware. Extracts token and verifies it.
 */
const { verifyAccessToken } = require('../utils/jwt.js');
const { AppError } = require('../utils/AppError.js');

const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('AUTH_001', 'No token provided', 401);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError('AUTH_001', 'Invalid token format', 401);
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      empId: decoded.empId,
      orgId: decoded.orgId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_002', message: 'Invalid token' },
    });
  }
};

module.exports = { verifyJWT };
