const mongoose = require("mongoose");

// User schema
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      require: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// User Model
const User = mongoose.model("User", UserSchema);

module.exports = User;
