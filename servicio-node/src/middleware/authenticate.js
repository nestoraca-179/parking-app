const { verifyToken } = require('../services/tokenService');
const { AppError } = require('../errors/AppError');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }
  try {
    req.auth = verifyToken(token);
    return next();
  } catch (error) {
    return next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
};

module.exports = { authenticate };
