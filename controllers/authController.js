const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken'); // Importing the 'jsonwebtoken' library.
const User = require('./../models/userModel'); // Importing the user model.
const catchAsync = require('./../utils/catchAsync'); // Importing the 'catchAsync' utility function.
const AppError = require('./../utils/AppError'); // Importing the 'AppError' class.
const Email = require('./../utils/email'); // Importing the 'email' class

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};
// Function for signing a token using the provided user ID, JWT secret, and expiration time.

// const createSendToken = (user, statusCode, res) => {
//   const token = signToken(user._id);
//   const cookieOptions = {
//     expires: new Date(
//       Date.now() + 3 * 60 * 60 * 1000 + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
//   };

//   res.cookie('jwt', token, cookieOptions);

//   user.password = undefined;
//   res.status(statusCode).json({
//     status: 'success',
//     token,
//     data: {
//       user,
//     },
//   });
// };

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + 3 * 60 * 60 * 1000 + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body; // Retrieve the name value from req.body

  // Check if the email already exists in the database
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already exists. Please use a different email.', 400));
  }

  const newUser = {
    name,
    email,
    password,
    passwordConfirm,
    role: role || 'user', // Set the role to 'user' if not provided
  };

  newUser.passwordChangeAt = req.body.passwordChangeAt;
  const createdUser = await User.create(newUser);

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  res.status(200).json({
    status: 'success',
    message: 'Signup Successful. Please login with your credentials.',
    data: {
      user: createdUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  // Clear the "jwt" cookie by setting it to an empty value and setting the expiration to a past date
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() - 1000), // Setting the expiration to a past date will clear the cookie
    httpOnly: true,
  });

  // Optionally, you can send a logout message in the response
  res.status(200).json({ status: 'success' });
};

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.restrictTo = function () {
  var roles = Array.prototype.slice.call(arguments);

  return function (req, res, next) {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on Posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;
    // const resetURL = `${req.protocol}://${req.get(
    //   'host'
    // )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token send to the email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was a error to sending the email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is not valid or has expired'), 400);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  if (user.isModified('password')) {
    user.passwordChangedAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  }

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from the database
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('The current password is not correct'), 401);
  }

  // 3) Update the user's password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  //4) make the changedPasswordat Appear and add 3 hours of the delay
  const currentDate = new Date();
  user.passwordChangedAt = new Date(currentDate.getTime() + 3 * 60 * 60 * 1000); // Add 3 hours to the current date/time
  await user.save();

  // 4) Send the response with the updated token
  createSendToken(user, 200, req, res);
});
