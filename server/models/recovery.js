const mongoose = require("mongoose");

// User schema
const RecoverySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    expireOn: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Recovery Model
const Recovery = mongoose.model("Recovery", RecoverySchema);

module.exports = Recovery;
