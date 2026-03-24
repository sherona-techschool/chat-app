
const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login',            authController.login);
router.post('/register',         authController.register);
router.put('/profile/:userId',   authController.updateProfile);


router.post('/forgot-password',  authController.forgotPassword);  // Step 1: send OTP
router.post('/verify-otp',       authController.verifyOtp);       // Step 2: verify OTP
router.post('/reset-password',   authController.resetPassword);   // Step 3: set new password

module.exports = router;