const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const UserModel = require("../models/authModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/utils");

exports.register = async (req, res) => {
  try {
    const { name, email, password , device_token } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await UserModel.getByEmail(email);

    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      name,
      email,
      hashedPassword,
      device_token
    });

    res.status(201).json(newUser);

  } catch (err) {
    console.error(err);
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      user_id: user.user_id,
      email: user.email,
      device_token: user.device_token,
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.log(err, 'in login');
    res.status(500).json({ message: "Server error" });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const newAccessToken = generateAccessToken(decoded);
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email required" });

  const user = await UserModel.getByEmail(email);

  if (!user)
    return res.status(404).json({ message: "User not found" });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

  await UserModel.storeResetToken(email, hashedToken, expiryTime);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: "Password Reset",
    html: `<a href="${resetLink}">${resetLink}</a>`
  });

  res.json({ message: "Reset link sent" });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ message: "Token and password required" });

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await UserModel.getByResetToken(hashedToken);

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await UserModel.updatePassword(hashedPassword, hashedToken);

  res.json({ message: "Password reset successful" });
};
