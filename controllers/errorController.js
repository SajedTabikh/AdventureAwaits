const AppError = require('./../utils/AppError'); // Importing the 'AppError' class.

const handleDuplicateError = (err) => {
  // Handling duplicate key error.
  const duplicateField = Object.keys(err.keyValue)[0]; // Extracting the duplicate field name.
  const duplicateValue = err.keyValue[duplicateField]; // Extracting the duplicate field value.
  const errorMessage = `The ${duplicateField} '${duplicateValue}' already exists. Please use a different ${duplicateField}.`; // Creating an error message.
  return new AppError(errorMessage, 400); // Creating and returning an instance of 'AppError' with the error message and status code.
};

const handleCastErrorDB = (err) => {
  // Handling cast error for database operations.
  const message = `Invalid ${err.path}: ${err.value}.`; // Creating an error message.
  return new AppError(message, 400); // Creating and returning an instance of 'AppError' with the error message and status code.
};

const handleValidatorErrorDB = (err) => {
  // Handling validation error for database operations.
  const errors = Object.values(err.errors).map((el) => el.message); // Extracting error messages from the validation errors.
  const message = `Invalid input data. ${errors.join('. ')}`; // Creating an error message.
  return new AppError(message, 400); // Creating and returning an instance of 'AppError' with the error message and status code.
};

const handleJWTError = (err) => new AppError('Invalid token please login again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE

  // console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  // Global error handling middleware.
  err.statusCode = err.statusCode || 500; // Setting the status code of the error.
  err.status = err.status || 'error'; // Setting the status of the error.

  if (process.env.NODE_ENV === 'development') {
    // Handling errors in the development environment.
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(Object.getPrototypeOf(err), Object.getOwnPropertyDescriptors(err));

    if (error.name === 'CastError') error = handleCastErrorDB(error); // Handling cast error.
    if (error.code === 11000) error = handleDuplicateError(error); // Handling duplicate key error.
    if (error.name === 'ValidationError') error = handleValidatorErrorDB(error); // Handling validation error.
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res); // Sending the error response to the client.
  }
};
