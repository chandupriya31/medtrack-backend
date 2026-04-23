const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db");

const UserModel = require("../models/authModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/utils");


async function sendMail(to, subject, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
  <div style="font-family: Arial; background:#f4f6f8; padding:20px;">
    <div style="max-width:500px; margin:auto; background:#fff; padding:25px; border-radius:10px;">
      
      <h2 style="color:#333;">Verify Your Account</h2>

      <p>Use the OTP below to continue:</p>

      <div style="
        font-size:28px;
        letter-spacing:6px;
        font-weight:bold;
        text-align:center;
        background:#f1f1f1;
        padding:15px;
        border-radius:8px;
        margin:20px 0;">
        ${otp}
      </div>

      <p style="font-size:13px; color:#777;">
        This OTP is valid for 10 minutes.
      </p>

      <p style="font-size:13px; color:#777;">
        If you didn’t request this, ignore this email.
      </p>

      <hr/>

      <p style="font-size:12px; color:#aaa;">
        © 2026 medtrack
      </p>

    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"HealthMate" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, device_token } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existingUser = await UserModel.getByEmail(email);
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    await db("users").insert({
      name,
      email,
      password: hashedPassword,
      device_token,
      is_verified: false,
      reset_token: hashedOtp,
      reset_token_expiry: expiryTime,
      email_otp: otp,
    });
    await sendMail(email, "Verify your account", otp);

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.getByEmail(email);
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const accessToken = generateAccessToken({
      user_id: user.user_id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      user_id: user.user_id,
      email: user.email,
    });

    res.json({
      accessToken,
      refreshToken,
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const hashedToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await db("users")
      .where({ email, reset_token: hashedToken })
      .andWhere("reset_token_expiry", ">", db.fn.now())
      .first();

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await db("users").where({ email }).update({
      is_verified: true,
      reset_token: null,
      reset_token_expiry: null,
    });

    res.json({ message: "Email verified successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.getByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.storeOtp(email, hashedOtp, expiryTime);

    await sendMail(email, "Verify your account", otp);

    res.json({ message: "OTP resent successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await db("users")
      .where({ email, reset_token: hashedToken })
      .andWhere("reset_token_expiry", ">", db.fn.now())
      .first();

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const newToken = generateAccessToken({
      user_id: decoded.user_id,
      email: decoded.email,
    });

    res.json({ accessToken: newToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.getByEmail(email);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const token = crypto.randomInt(100000, 999999).toString();

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.storeResetToken(email, hashedToken, expiryTime);

    await sendMail(email, "Password Reset OTP", token);
    res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await db("users")
      .where({ email, reset_token: hashedToken })
      .andWhere("reset_token_expiry", ">", db.fn.now())
      .first();

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db("users").where({ email }).update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    });

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.log(" RESET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};