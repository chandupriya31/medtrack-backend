const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "20d" }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};