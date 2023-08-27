const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.get('/verifying/:id/:token', authController.verify);

router.post('/login', authController.login);
router.get('/logout', authController.protect, authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.post('/verify', authController.protect, authController.VerifyOTP);
// router.post('/generate', authController.protect, authController.GenerateOTP);
router.post('/validate', authController.ValidateOTP);
router.post('/disable', authController.protect, authController.DisableOTP);
router.get('/check-2fa-status', authController.protect, authController.check2FAStatus);

router.use(authController.protect); // Apply the protect middleware to all routes below this line
router.patch('/updateMyPassword', authController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin')); // Apply the restrictTo middleware to all routes below this line

router.route('/').get(userController.getAllUsers).post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
