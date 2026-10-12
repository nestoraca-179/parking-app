const { AppError } = require('../errors/AppError');

const authorize = (...roles) => (req, res, next) => {
  if (!req.auth || !roles.includes(req.auth.role)) {
    return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
  }
  return next();
};

module.exports = { authorize };
