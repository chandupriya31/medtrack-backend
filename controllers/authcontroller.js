const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db");

const UserModel = require("../models/authModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/utils");




async function sendMail(to, subject, otp) {
  try {
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

    const info = await transporter.sendMail({
      from: `"HealthMate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("MAIL SENT:", info.response);

  } catch (err) {
    console.log("MAIL ERROR:", err);
    throw err;
  }
}

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

const otpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

exports.register = async (req, res) => {
  try {
    const { name, email, password, device_token } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await UserModel.getByEmail(email);
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      device_token,
      otp_hash: otpHash,
      otp_expiry: otpExpiry(),
      otp_type: "verify",
    });

    await sendMail(email, "Verify your account", otp);

    res.json({ message: "OTP sent" });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.getByEmail(email);

    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.is_verified)
      return res.status(403).json({ message: "Verify email first" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await UserModel.storeRefreshToken(email, refreshToken);

    res.json({ accessToken, refreshToken });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.verifyEmail = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     console.log("INPUT OTP:", otp);
//     console.log("HASHED INPUT:", hashOtp(otp));
//     const debugUser = await db("users").where({ email }).first();
//     console.log("DB OTP HASH:", debugUser?.otp_hash);
//     console.log("DB EXPIRY:", debugUser?.otp_expiry);
//     console.log("DB TYPE:", debugUser?.otp_type);

//     const user = await UserModel.verifyOtp(
//       email,
//       hashOtp(otp),
//       "verify"
//     );

//     if (!user)
//       return res.status(400).json({ message: "Invalid or expired OTP" });

//     await UserModel.markVerified(email);

//     res.json({ message: "Email verified" });

//   } catch (err) {
//     console.log("VERIFY ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.verifyEmail = async (req, res) => {
  try {
    let { email, otp } = req.body;

    otp = otp.toString().trim();

    const user = await db("users")
      .where({
        email,
        otp_hash: hashOtp(otp),
        otp_type: "verify",
      })
      .andWhere("otp_expiry", ">", new Date())
      .first();

    if (!user) {
      console.log("OTP FAIL:", email, otp);
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await UserModel.markVerified(email);

    res.json({ message: "Email verified" });

  } catch (err) {
    console.log("VERIFY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    const user = await UserModel.getByEmail(email);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();

    await UserModel.updateOtp(
      email,
      hashOtp(otp),
      otpExpiry(),
      type
    );

    await sendMail(email, "OTP", otp);

    res.json({ message: "OTP resent" });

  } catch (err) {
    console.log("RESEND ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpHash = hashOtp(otp);

    const user = await db("users")
      .where({
        email,
        otp_hash: otpHash,
        otp_type: "reset",
      })
      .andWhere("otp_expiry", ">", db.fn.now())
      .first();

    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    res.json({ message: "OTP verified" });

  } catch (err) {
    console.log("VERIFY RESET OTP ERROR:", err);
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

    const otp = generateOtp();

    await UserModel.updateOtp(
      email,
      hashOtp(otp),
      otpExpiry(),
      "reset"
    );

    await sendMail(email, "Reset OTP", otp);

    res.json({ message: "OTP sent" });

  } catch (err) {
    console.log("FORGOT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await UserModel.verifyOtp(
      email,
      hashOtp(otp),
      "reset"
    );

    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserModel.updatePassword(email, hashedPassword);

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.log("RESET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};