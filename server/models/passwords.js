const mongoose = require("mongoose");

// Password schema
const PasswordSchema = new mongoose.Schema(
  {
    account: {
      type: String,
      required: true,
    },
    alias: String,
    password: {
      type: String,
      required: true,
    },
    name: String,
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Password Model
const Password = mongoose.model("Password", PasswordSchema);

module.exports = Password;
