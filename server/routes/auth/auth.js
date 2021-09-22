const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Router Middlewares
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// [*] Import models for users and passwords
const User = require("../../models/user");
const Password = require("../../models/passwords");

// Routes for login and logout user

// Validate user information
function isValidUser(user) {
  const isValidName =
    typeof user.username == "string" && user.username.trim() != "";
  const isValidPassword =
    typeof user.password == "string" &&
    user.password.trim() != "" &&
    user.password.trim().length >= 4 &&
    user.password.trim().length <= 32;

  return isValidName && isValidPassword;
}

// [*] Find user by username
// [*] Compare input password with stored hashed password in DB, via bcrypt compare()
// [*] Set a cookie
router.post("/login", async (req, res, next) => {
  // console.log(req.body);
  if (isValidUser(req.body)) {
    try {
      // Find user by username in DB
      let user = await User.findOne({ username: req.body.username }).exec();

      if (user) {
        // Compare passwords
        let match = await bcrypt.compare(req.body.password, user.password);
        if (match) {
          // Set the user_id cookie to session and log user in
          res.cookie("user_id", user._id, {
            httpOnly: true,
            signed: true,
          });
          res.status(200);
          res.json({ message: "Logged in...🔓" });
          return;
        }
      }
      // Throw error
      const error = new Error("Invalid credentials");
      res.status(401);
      next(error);
    } catch (err) {
      console.error(err);
      res.status(500);
      next(err);
    }
  } else {
    // Throw error
    const error = new Error("Invalid Login");
    res.status(422);
    next(error);
  }
});

router.get("/logout", (req, res, next) => {
  // Delete the cookie on the browser
  res.clearCookie("user_id", {
    httpOnly: true,
    signed: true,
  });
  // [*] Redirect from the frontend
  res.end();
});

module.exports = router;
