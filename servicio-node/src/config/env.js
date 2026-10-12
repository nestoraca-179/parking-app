const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
};

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must have at least 32 characters');
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: required('MONGO_URI'),
  jwtSecret,
  jwtExpiresInSeconds: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '28800', 10),
  adminUsername: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  adminFullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
  bcryptCost: 10,
  tokenIssuer: 'auth-service',
};
