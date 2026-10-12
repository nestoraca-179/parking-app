const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../config/env');
const { User } = require('../models/User');
const { AppError } = require('../errors/AppError');

const hashPassword = (password) => bcrypt.hash(password, env.bcryptCost);

let dummyHashPromise = null;

const getDummyHash = () => {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword('dummy-password-for-timing');
  }
  return dummyHashPromise;
};

const findUserOrFail = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
};

const authenticate = async (username, password) => {
  const user = await User.findOne({ username });
  const hash = user ? user.passwordHash : await getDummyHash();
  const matches = await bcrypt.compare(password, hash);
  if (!user || !matches || !user.active) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }
  return user;
};

const createUser = async (data) => {
  const passwordHash = await hashPassword(data.password);
  return User.create({
    username: data.username,
    passwordHash,
    fullName: data.fullName,
    role: data.role,
    active: data.active,
  });
};

const listUsers = () => User.find().sort({ createdAt: 1 });

const assertNotSelfDowngrade = (user, changes, actingUserId) => {
  if (user.id !== actingUserId) {
    return;
  }
  const losesRole = changes.role !== undefined && changes.role !== user.role;
  const deactivates = changes.active === false;
  if (losesRole || deactivates) {
    throw new AppError(403, 'SELF_MODIFICATION_FORBIDDEN', 'Administrators cannot change their own role or deactivate themselves');
  }
};

const updateUser = async (id, changes, actingUserId) => {
  const user = await findUserOrFail(id);
  assertNotSelfDowngrade(user, changes, actingUserId);
  if (changes.fullName !== undefined) {
    user.fullName = changes.fullName;
  }
  if (changes.role !== undefined) {
    user.role = changes.role;
  }
  if (changes.active !== undefined) {
    user.active = changes.active;
  }
  if (changes.password !== undefined) {
    user.passwordHash = await hashPassword(changes.password);
  }
  await user.save();
  return user;
};

const deactivateUser = (id, actingUserId) => updateUser(id, { active: false }, actingUserId);

module.exports = {
  hashPassword,
  findUserOrFail,
  authenticate,
  createUser,
  listUsers,
  updateUser,
  deactivateUser,
};
