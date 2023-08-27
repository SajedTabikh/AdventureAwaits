const crypto = require('crypto'); // Importing the crypto module for generating random bytes and creating hash
const mongoose = require('mongoose'); // Importing the mongoose module for creating schema and model
const validator = require('validator'); // Importing the validator module for data validation
const bcrypt = require('bcryptjs'); // Importing the bcryptjs module for password hashing
const { DateTime } = require('luxon');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'], // Name is required
  },
  email: {
    type: String,
    required: [true, 'Please provide your email address'], // Email is required
    unique: true,
    lowercase: true,
    validate: [{ validator: validator.isEmail, msg: 'Please provide a valid email address' }],
  },
  photo: {
    type: String,
    default: 'default.jpg', // User photo
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // Role should be one of the provided values
    default: 'user', // Default role is 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'], // Password is required
    minlength: 8, // Minimum length of password is 8 characters
    select: false, // Password should not be selected by default in query results
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide your password confirmation'], // Password confirmation is required
    validate: {
      validator: function (value) {
        return value === this.password; // Check if password confirmation matches the password
      },
      message: 'Password confirmation does not match', // Error message if password confirmation does not match
    },
  },
  passwordChangedAt: {
    type: Date,
    select: false, // Password changed date should not be selected by default in query results
  },
  passwordResetToken: String, // Password reset token
  passwordResetExpires: Date, // Password reset token expiration date

  active: {
    type: Boolean,
    default: true, // User is active by default
    select: false, // Active status should not be selected by default in query results
  },

  verified: {
    type: Boolean,
    default: false,
  },

  otp_valid: { type: Boolean, default: false },

  otp_enabled: { type: Boolean, default: false },
  otp_verified: { type: Boolean, default: false },
  otp_ascii: String,
  otp_hex: String,
  otp_base32: String,
  otp_auth_url: String,
  qrCodeImage: String,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Skip if password is not modified

  this.password = await bcrypt.hash(this.password, 12); // Hash the password with bcrypt

  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  this.passwordChangedAt = new Date(now - offset - 1000); // Set the password change date

  this.passwordConfirm = undefined; // Clear the password confirmation field
  next();
});

userSchema.pre(/^find/, async function (next) {
  // Middleware to exclude inactive users from find queries
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  // Method to compare candidate password with user password
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // Method to check if the password was changed after a given timestamp
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp; // Return true if the password was changed after the given timestamp
  }
  return false; // Return false if passwordChangedAt is not defined
};

userSchema.methods.createPasswordResetToken = function () {
  // Method to create a password reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const expirationTime = DateTime.local().plus({ minutes: 10 }).plus({ hours: 3 });
  this.passwordResetExpires = expirationTime.toJSDate();

  return resetToken;
};

userSchema.pre(/^find/, function (next) {
  this.find().select('-passwordChangedAt -passwordConfirm'); // Exclude passwordChangedAt and passwordConfirm fields from find queries
  next();
});

const User = mongoose.model('User', userSchema); // Create User model using userSchema

module.exports = User; // Export the User model
