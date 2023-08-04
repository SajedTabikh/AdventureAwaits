class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Call the parent class (Error) constructor and pass the error message

    this.statusCode = statusCode; // Set the status code for the error
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // Determine the status ('fail' for 4xx status codes, 'error' for others)
    this.isOperational = true; // Flag to indicate if the error is operational

    Error.captureStackTrace(this, this.constructor); // Capture the stack trace for debugging
  }
}

module.exports = AppError; // Export the AppError class as a module
