const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ALLOWED_ROLES = ['ADMIN', 'OPERATOR', 'SERVICE'];

const signUserToken = (user) =>
  jwt.sign({ username: user.username, role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    subject: user.id,
    issuer: env.tokenIssuer,
    expiresIn: env.jwtExpiresInSeconds,
  });

const verifyToken = (token) => {
  const claims = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  if (!ALLOWED_ROLES.includes(claims.role)) {
    throw new Error('Unknown role');
  }
  return { sub: claims.sub, username: claims.username, role: claims.role };
};

module.exports = { signUserToken, verifyToken };
