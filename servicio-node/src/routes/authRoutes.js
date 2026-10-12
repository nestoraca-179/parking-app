const express = require('express');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { loginSchema } = require('../validators/authSchemas');
const { authenticate: verifyCredentials, findUserOrFail } = require('../services/userService');
const { signUserToken } = require('../services/tokenService');
const { AppError } = require('../errors/AppError');

const router = express.Router();

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.post(
  '/login',
  validate(loginSchema),
  wrap(async (req, res) => {
    const user = await verifyCredentials(req.body.username, req.body.password);
    const token = signUserToken(user);
    res.json({ token, user });
  })
);

router.get(
  '/me',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  wrap(async (req, res) => {
    const user = await findUserOrFail(req.auth.sub);
    if (!user.active) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
    }
    res.json(user);
  })
);

module.exports = router;
