const express = require("express");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");

// Email Handler
const { sendEmail } = require("./emailHandler");

const router = express.Router();

// Auth middlewares
const { isLoggedIn, isAuth } = require("../user/middlewares");

// [*] Import models for users and passwords
const User = require("../../models/user");
const Password = require("../../models/passwords");
const Recovery = require("../../models/recovery");

// Global Variables
const RECOVERY_URL = "http://localhost:3000/user/recovery";
const KEY_ALPHA =
  "abcdefghjkilmnopqrstuvwyxzABCDEFGHJKILMNOPQRSTUVWYXZ0123456789-_*?!][()!£$%&/";
const URL_ALPHA =
  "abcdefghjkilmnopqrstuvwyxzABCDEFGHJKILMNOPQRSTUVWYXZ0123456789";

// Routes for [*]creating, [*]reading, [*]updating and [*]deleting passwords for 1 user
// Same routes for users - [*]create, [*]read, [*]delete and []update

// Validate user information
function isValidUser(user) {
  const isValidEmail = typeof user.email == "string" && user.email.trim() != "";
  const isValidName =
    typeof user.username == "string" && user.username.trim() != "";
  const isValidPassword =
    typeof user.password == "string" &&
    user.password.trim() != "" &&
    user.password.trim().length >= 4 &&
    user.password.trim().length <= 32;

  return isValidName && isValidPassword && isValidEmail;
}

// Validate fields when creating a record
function isValidCreateRecord(record) {
  let isAccount = record.account && record.account.trim() != "";
  let isPassword = record.password && record.password.trim() != "";

  return isAccount && isPassword;
}

// Validate password
function isValidPassword(password) {
  return (
    typeof password == "string" &&
    password.trim() != "" &&
    password.trim().length >= 4 &&
    password.trim().length <= 32
  );
}

// Helper functions
function getRandomString(alphabet, len = 24) {
  let code = new Array();

  for (let i = 0; i < len; i++) {
    let index = Math.floor(Math.random() * alphabet.length);
    code.push(alphabet.charAt(index));
  }

  code = code.join("");
  return code;
}

// ----- User API ------
// [*] Create user/signup
// [*] Read information about users --> for dashboard. No password is given
// [*] Delete User
// [*] Update User -- TODO see what's coming from frontend
// [*] Forgot password --> private route

router.post("/signup", async (req, res, next) => {
  // Steps for SignUp route
  // [*] Email for signup --> recovery password, etc
  // [*] Validate User
  // [*] Check if user already exists
  // [*] Hash password - bcrypt
  // [*] Insert user with username and password and email
  // [*] Give encrytion key to user for enc/dec stored passwords
  // [] Rate limiting for no brute force approach

  if (isValidUser(req.body)) {
    let user = await User.findOne({ username: req.body.username }).exec();

    if (!user) {
      try {
        // Hash the password and save new user
        let salt = await bcrypt.genSalt(10);
        let hashed = await bcrypt.hash(req.body.password, salt);
        let secretKey = getRandomString(KEY_ALPHA);

        // Save username + hashed password to DB
        await User.create({
          username: req.body.username,
          email: req.body.email,
          password: hashed,
          secretKey: secretKey,
        });

        // Response
        res.status(201);
        res.json({
          username: req.body.username,
          email: req.body.email,
        });
      } catch (err) {
        console.error(err);
        res.status(500);
        next(err);
      }
    } else {
      // throw error
      const error = new Error("Username in use");
      res.status(422);
      next(error);
    }
  } else {
    let error = new Error("Invalid User");
    res.status(400);
    next(error);
  }
});

router.get("/account/:username", isLoggedIn, isAuth, async (req, res, next) => {
  try {
    let account = req.query.account;
    let passId = req.query.pass;
    let user = await User.findOne(
      { username: req.params.username },
      "username email createdAt isActive"
    ).exec();
    let passwords;
    if (user && account) {
      let regex = new RegExp(`${account}`, "i");
      passwords = await Password.find(
        { userId: user._id, account: regex },
        "account name createdAt"
      ).exec();
    } else if (user && passId) {
      passwords = await Password.findById(
        passId,
        "account name createdAt"
      ).exec();
    } else if (user) {
      passwords = await Password.find(
        { userId: user._id },
        "account name createdAt"
      ).exec();
    } else {
      next();
    }
    // Send response
    res.json({
      user,
      passwords,
    });
  } catch (err) {
    console.error(err);
    res.status(500);
    next(err);
  }
});

router.delete(
  "/account/:username/delete",
  isLoggedIn,
  isAuth,
  async (req, res, next) => {
    try {
      let _id = req.signedCookies.user_id;
      await User.deleteOne({ _id: _id });
      await Password.deleteMany({ userId: _id });
      res.json({ message: "Deleted ✅" });
    } catch (err) {
      res.status(500);
      next(err);
    }
  }
);

router.put(
  "/account/:username/update",
  isLoggedIn,
  isAuth,
  async (req, res, next) => {
    // [*] Save changes

    try {
      let user = await User.findOne({ username: req.params.username }).exec();

      // If user wants to change username there must be a check for duplicates
      // In case is different user is trying to change username, hence CHECK
      let checkUser;
      if (req.body.username !== user.username) {
        checkUser = await User.findOne({
          username: req.body.username,
        }).exec();
      }

      if (!checkUser) {
        if (req.body.password) {
          if (!isValidPassword(req.body.password)) {
            // throw error
            const error = new Error("Invalid Password");
            res.status(422);
            next(error);
          }
        }

        let salt = await bcrypt.genSalt(10);
        let newPassword = req.body.password
          ? await bcrypt.hash(req.body.password, salt)
          : user.password;
        let changes = {
          username: req.body.username || user.username,
          password: newPassword,
          email: req.body.email || user.email,
        };

        // Save changes
        await User.updateOne({ _id: user._id }, changes, {
          timestamps: true,
        });

        // Response
        res.json({
          message: "Updated ✅",
        });
      } else {
        // throw error
        const error = new Error("Username in use");
        res.status(422);
        next(error);
      }

      // res.json({ changes });
    } catch (err) {
      res.status(500);
      next(err);
    }
  }
);

// ----- Passwords -----
// API for Passwords
// [*] isLoggedIn and isAuth
// [*] Create password
// [*] Read password
// [*] Update password
// [*] Delete password

router.post("/create/:username", isLoggedIn, isAuth, async (req, res, next) => {
  try {
    if (isValidCreateRecord(req.body)) {
      let user = await User.findOne({ username: req.params.username }).exec();
      // [*] Encrypt password --> not plain text
      let cipherText = CryptoJS.AES.encrypt(req.body.password, user.secretKey);

      let newRecord = {
        account: req.body.account,
        name: req.body.name || "-",
        password: cipherText,
        userId: user._id,
      };

      await Password.create(newRecord);
      res.status(201);
      res.json({
        message: "Password created ✅",
      });
    } else {
      let error = new Error("Invalid Request - Arguments Missing ❎");
      res.status(400);
      next(error);
    }
  } catch (err) {
    res.status(500);
    next(err);
  }
});

router.get("/read/:username", isLoggedIn, isAuth, async (req, res, next) => {
  try {
    let record = await Password.findOne({ _id: req.query.id }).exec();
    let user = await User.findOne({ username: req.params.username }).exec();

    if (record.userId != user._id) {
      let error = new Error("Un-authorised");
      res.status(401);
      next(error);
    } else {
      let bytes = CryptoJS.AES.decrypt(record.password, user.secretKey);
      let password = bytes.toString(CryptoJS.enc.Utf8);
      res.json({
        account: record.account,
        password: password,
        createdAt: record.createdAt,
        name: record.name,
      });
    }
  } catch (err) {
    res.status(500);
    next(err);
  }
});

router.put("/update/:username", isLoggedIn, isAuth, async (req, res, next) => {
  try {
    // Check if authorised to change password
    let record = await Password.findOne({ _id: req.query.id }).exec();
    let user = await User.findOne({ username: req.params.username }).exec();

    if (record.userId != user._id) {
      let error = new Error("Un-authorised");
      res.status(401);
      next(error);
    } else {
      let newPassword = req.body.password
        ? CryptoJS.AES.encrypt(req.body.password, user.secretKey)
        : record.password;

      // Atomic changes to DB
      record.account = req.body.account || record.account;
      record.name = req.body.name || record.name;
      record.password = newPassword;
      await record.save();

      res.status(201);
      res.json({
        message: "Updated ✅",
      });
    }
  } catch (err) {
    res.status(500);
    next(err);
  }
});

router.delete(
  "/delete/:username",
  isLoggedIn,
  isAuth,
  async (req, res, next) => {
    try {
      let record =
        (await Password.findOne({ _id: req.query.id }).exec()) || false;
      let user = await User.findOne({ username: req.params.username }).exec();

      if (record.userId != user._id) {
        let error = new Error("Un-authorised");
        res.status(401);
        next(error);
      } else {
        await Password.deleteOne({ _id: record._id });
        res.json({
          message: "Deleted 🗑",
        });
      }
    } catch (err) {
      res.status(500);
      next(err);
    }
  }
);

// ------ Recovery API -------

const oneDayInMS = 1000 * 60 * 60 * 24;

// [*] PUT request with username and email
// [*] Check if email and username are valid -- record has same information if not 400 Invalid User
// [*] Generate slug and save it to Recovery
// [] Send recovery link to user email address
router.put("/recovery", async (req, res, next) => {
  try {
    if (req.body.username && req.body.email) {
      let user = await User.findOne({ username: req.body.username }).exec();

      if (!user) {
        let error = new Error("Invalid User");
        res.status(422);
        next(error);
      } else if (user.email != req.body.email) {
        let error = new Error("Invalid User");
        res.status(422);
        next(error);
      } else {
        // Create slug
        let code = getRandomString(URL_ALPHA);
        let expiration = Date.now() + oneDayInMS;
        let recovery = await Recovery.create({
          slug: code,
          userId: user._id,
          expireOn: expiration,
        });
        // Send via email link, and expiration date
        let link = RECOVERY_URL + `/${recovery.slug}`;
        await sendEmail(user, link);
        res.json({
          expiration,
        });
      }
    } else {
      let error = new Error("Invalid User");
      res.status(400);
      next(error);
    }
  } catch (err) {
    res.status(500);
    next(err);
  }
});

module.exports = router;
