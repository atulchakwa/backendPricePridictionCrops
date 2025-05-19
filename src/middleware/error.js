const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Zod validation error
  if (err.name === 'ZodError') {
    statusCode = 400;
    errors = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message
    }));
    message = 'Validation failed';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    message = 'Validation failed';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    errors = [{
      field,
      message: `${field} already exists`
    }];
    message = 'Duplicate field value entered';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler; 