const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { findUserOrFail } = require('../services/userService');

const router = express.Router();

router.get('/users/:id', authenticate, authorize('SERVICE'), async (req, res, next) => {
  try {
    const user = await findUserOrFail(req.params.id);
    res.json({ id: user.id, username: user.username, fullName: user.fullName });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
