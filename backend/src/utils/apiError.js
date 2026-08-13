class ApiError extends Error {
  constructor(statusCode = 500, message = 'Internal Server Error', isOperational = true, details = null, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
