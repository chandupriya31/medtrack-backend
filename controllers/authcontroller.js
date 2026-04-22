const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db");

const UserModel = require("../models/authModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/utils");


async function sendMail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to,
    subject,
    html: `<p>${text}</p>`,
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

    await UserModel.create({
      name,
      email,
      hashedPassword,
      device_token,
    });

    res.json({ message: "User registered successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.getByEmail(email);

    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

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
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.getByEmail(email);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const token = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.storeResetToken(email, hashedToken, expiryTime);

    await sendMail(
      email,
      "Password Reset OTP",
      `Your OTP is: ${token}`
    );

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await UserModel.getByResetToken(hashedToken);

    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserModel.updatePassword(hashedPassword, hashedToken);

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};