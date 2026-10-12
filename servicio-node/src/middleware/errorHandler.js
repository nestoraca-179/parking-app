const { ZodError } = require('zod');
const { AppError } = require('../errors/AppError');

const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Resource not found' });
};

const describeZodError = (error) => {
  const issue = error.issues[0];
  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
};

const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.code, message: error.message });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: describeZodError(error) });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'INVALID_JSON', message: 'Request body is not valid JSON' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'USERNAME_TAKEN', message: 'Username is already in use' });
  }
  console.error(`Unhandled error: ${error.message}`);
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Unexpected server error' });
};

module.exports = { notFoundHandler, errorHandler };
