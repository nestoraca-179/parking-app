const express = require('express');
const helmet = require('helmet');
const env = require('./src/config/env');
const { connectWithRetry, isConnected, disconnect } = require('./src/db/connection');
const { User } = require('./src/models/User');
const { seedAdmin } = require('./src/services/seedService');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const internalRoutes = require('./src/routes/internalRoutes');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  return next();
});

app.get('/health', (req, res) => {
  if (!isConnected()) {
    return res.status(503).json({ status: 'unavailable' });
  }
  return res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/users', userRoutes);
app.use('/internal', internalRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectWithRetry();
  await User.createIndexes();
  await seedAdmin();
  const server = app.listen(env.port, () => {
    console.log(`auth-service listening on port ${env.port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await disconnect();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
});
