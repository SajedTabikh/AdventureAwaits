const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');

router.use(viewsController.alerts);

router.get('/All-Tours', authController.protect, viewsController.getOverview);
router.get('/', viewsController.getPerview);
router.get(
  '/tour/:slug',
  authController.isLoggedIn,
  authController.protect,
  viewsController.getTour
);
router.get('/login', viewsController.getLoginForm);

router.get('/signup', viewsController.getSignUpForm);
router.get('/verifying/:id/:token', authController.verify);

// router.get('/verify', );
// router.get('/generate', );
router.get('/validate', viewsController.getValidateForm);
// router.get('/disable', );

router.get('/forgotPassword', viewsController.getForgotPasswordForm);
router.get('/resetPassword/:token', viewsController.getResetForm);

router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

module.exports = router;
