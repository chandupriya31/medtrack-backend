const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const authenticateToken = require("../middileware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);

router.get("/forgot-password-page", (req, res) => {
    res.render("forgot-password");
});


router.get("/reset-password-page", (req, res) => {
    res.render("reset-password");
});
router.post("/resend-otp", authController.resendOtp);
router.post("/verify-reset-otp", authController.verifyResetOtp);
module.exports = router;