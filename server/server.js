const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");

// Import routers
const api = require("./routes/api/apiV1");
const auth = require("./routes/auth/auth");
const user = require("./routes/user/views");

const app = express();

// Whitelist Sites
const WHITELIST = "http://localhost:3000";

// Directory names and URI
const STATIC_URI = path.join(__dirname, "..", "client", "public");
const VIEWS_URI = path.join(__dirname, "..", "client", "views");

// Environment & Global Variables
const PORT = process.env.PORT || 3000;

// Open DB connection
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Connected to DB")
);

// Router Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use("/public", express.static(STATIC_URI));
app.use(
  cors({
    // origin: WHITELIST,
    credentials: true,
  })
);
// View Middlewares
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", VIEWS_URI);

// Routing Middlewares
app.use("/api/v1", api); // API - signup, read, delete user & update user & passwords
app.use("/auth", auth); // Auth routes Login and Logout ONLY!!
app.use("/user", user); // For dashboard main page and user's info

// Client-Side Routes
app.get("/", (req, res) => {
  let loginVisible = "login";
  let signUpVisible = "sign-up visible";
  if (req.query.login == "true") {
    loginVisible = "login visible";
    signUpVisible = "sign-up";
  }
  res.render("index.html", {
    loginVisible,
    signUpVisible,
  });
});

// Error Handling for API and Auth --> JSON response
function notFound(req, res, next) {
  res.status(404);
  const error = new Error("Not found - " + req.originalUrl);
  next(error);
}

function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    error: {
      status: res.statusCode,
      stack: process.env.ENV === "dev" ? err.stack : undefined,
    },
  });
}

// Error handling for users --> HTML views
function displayErrorView(err, req, res, next) {
  res.status(res.statusCode || 500);

  res.send(`<h1>${res.statusCode} - ${err.message}</h1>`);
}

app.use(notFound);

// Only for API and Auth JSON response
app.use("/auth", errorHandler);
app.use("/api/v1", errorHandler);

// [*] Display error as HTML
app.use(displayErrorView);

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
