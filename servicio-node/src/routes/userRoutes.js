const express = require('express');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createUserSchema, updateUserSchema } = require('../validators/userSchemas');
const userService = require('../services/userService');

const router = express.Router();

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(authenticate, authorize('ADMIN'));

router.post(
  '/',
  validate(createUserSchema),
  wrap(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  })
);

router.get(
  '/',
  wrap(async (req, res) => {
    res.json(await userService.listUsers());
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    res.json(await userService.findUserOrFail(req.params.id));
  })
);

router.put(
  '/:id',
  validate(updateUserSchema),
  wrap(async (req, res) => {
    res.json(await userService.updateUser(req.params.id, req.body, req.auth.sub));
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    res.json(await userService.deactivateUser(req.params.id, req.auth.sub));
  })
);

module.exports = router;
