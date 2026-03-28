/**
 * Global Error Handler Middleware
 * Handles all errors and returns consistent error responses
 */

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Default error status and message
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // MariaDB specific errors
  if (err.code) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      statusCode = 400;
      message = 'Database table not found';
    } else if (err.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      message = 'Duplicate entry';
    } else if (err.code === 'ER_BAD_FIELD_ERROR') {
      statusCode = 400;
      message = 'Invalid field';
    }
  }

  // Mongoose validation errors (if used later)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
