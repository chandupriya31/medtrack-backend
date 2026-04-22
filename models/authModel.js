const db = require("../db");

const UserModel = {
  getByEmail: async (email) => {
    return await db("users").where({ email }).first();
  },

  create: async ({ name, email, hashedPassword, device_token }) => {
    const user = await db("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        device_token,
        is_verified: false,
      })
      .returning(["user_id", "name", "email", "device_token"]);

    return user[0];
  },

  storeOtp: async (email, hashedOtp, expiryTime) => {
    await db("users").where({ email }).update({
      reset_token: hashedOtp,
      reset_token_expiry: expiryTime,
    });
  },

  verifyOtp: async (email, hashedOtp) => {
    return await db("users")
      .where({
        email,
        reset_token: hashedOtp,
      })
      .andWhere("reset_token_expiry", ">", db.fn.now())
      .first();
  },

  markVerified: async (email) => {
    return await db("users").where({ email }).update({
      is_verified: true,
      reset_token: null,
      reset_token_expiry: null,
    });
  },

  storeResetToken: async (email, hashedToken, expiryTime) => {
    await db("users").where({ email }).update({
      reset_token: hashedToken,
      reset_token_expiry: expiryTime,
    });
  },

  getByResetToken: async (hashedToken) => {
    return await db("users")
      .where("reset_token", hashedToken)
      .andWhere("reset_token_expiry", ">", db.fn.now())
      .first();
  },

  updatePassword: async (hashedPassword, hashedToken) => {
    await db("users").where({ reset_token: hashedToken }).update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    });
  },
};

module.exports = UserModel;
