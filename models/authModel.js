const db = require("../db");

const UserModel = {
  getByEmail: async (email) => {
    return await db("users").where({ email }).first();
  },

  create: async ({ name, email, password, device_token, otp_hash, otp_expiry, otp_type }) => {
    const [user] = await db("users")
      .insert({
        name,
        email,
        password,
        device_token,
        is_verified: false,
        otp_hash,
        otp_expiry,
        otp_type,
      })
      .returning(["user_id", "name", "email"]);

    return user;
  },

  updateOtp: async (email, otp_hash, otp_expiry, otp_type) => {
    await db("users").where({ email }).update({
      otp_hash,
      otp_expiry,
      otp_type,
    });
  },

  verifyOtp: async (email, otp_hash, otp_type) => {
    return await db("users")
      .where({ email, otp_hash, otp_type })
      .andWhere("otp_expiry", ">", db.fn.now())
      .first();
  },

  markVerified: async (email) => {
    await db("users").where({ email }).update({
      is_verified: true,
      otp_hash: null,
      otp_expiry: null,
      otp_type: null,
    });
  },

  updatePassword: async (email, password) => {
    await db("users").where({ email }).update({
      password,
      otp_hash: null,
      otp_expiry: null,
      otp_type: null,
    });
  },

  storeRefreshToken: async (email, token) => {
    await db("users").where({ email }).update({
      refresh_token: token,
    });
  },
};

module.exports = UserModel;