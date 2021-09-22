const express = require("express");
const User = require("../../models/user");
const Password = require("../../models/passwords");
const Recovery = require("../../models/recovery");
const path = require("path");
const { isLoggedIn, isAuth } = require("./middlewares");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Middleware to check slug
async function isValidSlug(req, res, next) {
  // Import recovery model
  // Check if slug exists
  try {
    let slug = await Recovery.findOne({ slug: req.params.slug }).exec();
    if (!slug) {
      let error = new Error("Not found");
      res.status(404);
      next(error);
    } else {
      // Check if not expired --> 24h
      // TODO [*] put expiration date on record directly and avoid calculations
      let now = new Date();

      if (now > slug.expireOn) {
        let error = new Error("Link is expired 👻");
        // Remove slug link
        await Recovery.deleteOne({ _id: slug._id });
        res.status(422);
        next(error);
      } else {
        next();
      }
    }
  } catch (err) {
    res.status(500);
    next(err);
  }
}

// Recovery credentials View
router.get("/recovery", async (req, res, next) => {
  res.render("recovery.html");
});

// Recovery password -- [*] Input View
router.get("/recovery/:slug", isValidSlug, async (req, res, next) => {
  let slug = await Recovery.findOne({ slug: req.params.slug }).exec();
  let user = await User.findById(slug.userId).exec();
  res.render("new-password.html", { username: user.username });
});

// Password Recovery -- [*] Post Form
router.post("/recovery/:slug", isValidSlug, async (req, res, next) => {
  try {
    let slug = await Recovery.findOne({ slug: req.params.slug }).exec();
    let user = await User.findById(slug.userId).exec();

    // console.log(req);

    // Update password to user
    let newPassword = req.body["recovery-password"];
    let salt = await bcrypt.genSalt(10);
    let hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    user.save();

    await Recovery.deleteOne({ _id: slug._id });

    res.redirect("/?login=true");
  } catch (err) {
    // Display error
    res.status(500);
    console.error(err);
    next(err);
  }
});

router.get("/:username", isLoggedIn, isAuth, async (req, res, next) => {
  let user = await User.findOne({ username: req.params.username }).exec();

  if (user) {
    res.render("dashboard.html", { username: user.username });
  } else {
    next();
  }
});

module.exports = router;
