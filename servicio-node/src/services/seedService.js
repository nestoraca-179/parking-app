const env = require('../config/env');
const { User } = require('../models/User');
const { hashPassword } = require('./userService');

const seedAdmin = async () => {
  const existing = await User.estimatedDocumentCount();
  if (existing > 0) {
    return;
  }
  await User.create({
    username: env.adminUsername,
    passwordHash: await hashPassword(env.adminPassword),
    fullName: env.adminFullName,
    role: 'ADMIN',
    active: true,
  });
  console.log(`Seeded administrator ${env.adminUsername}`);
};

module.exports = { seedAdmin };
