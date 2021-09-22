const User = require("../../models/user");

// Auth Middlewares
async function isLoggedIn(req, res, next) {
  if (req.signedCookies.user_id) {
    // console.log("is logged in");
    next();
  } else {
    let error = new Error("Unauthorised");
    res.status(401);
    next(error);
  }
}

async function isAuth(req, res, next) {
  let username = req.params.username;
  let user_id = req.signedCookies.user_id;
  // Find username with user id
  // if username !== username.fromId return 401
  try {
    let user = await User.findOne({ _id: user_id }).exec();
    if (user.username == username) {
      // console.log("is auth");
      next();
    } else {
      let error = new Error("Unauthorised");
      res.status(401);
      next(error);
      // res.redirect(`/user/${user.username}`);
    }
  } catch (err) {
    res.status(500);
    //res.redirect("/");
    next(err);
  }
}

module.exports = {
  isLoggedIn,
  isAuth,
};
