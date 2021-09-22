require("dotenv").config();
const nodemailer = require("nodemailer");

// Email server Setup
let mailOptions = {
  pool: true,
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_MAIL_ADDRESS,
    pass: process.env.USER_MAIL_PASSWORD,
  },
};

let transporter = nodemailer.createTransport(mailOptions);
transporter.verify((err, success) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Server is ready to take our message");
  }
});

function composeTextMessage(username, link) {
  return `Hello there ${username}\nThis is the recovery link for your password\n
      ${link}\n\nIf you didn't ask for a new password than someone used your username and email address
      to recover a password. No data was leaked, however you might want to change your password.\n
      Go to your account and update it or go to this link for further information\n
      http://localhost:3000/account/security\n\nThanks, BeGeos`;
}

function composeHTMLMessage(username, link) {
  return `<h3>Hello there, ${username}</h3>
      <p>This is the recovery link for your password</p>
      <a href="${link}">${link}</a><br>
      <p>If you didn't ask for a new password than someone used your username and email address
      to recover a password. No data was leaked, however you might want to change your password.
      Go to your account and update it or go to this link for further information.
      </p>
      <a href="http://localhost:3000/account/security">http://localhost:3000/account/security</a><br><br>
      <p>Thanks</p>
      <p>BeGeos</p>`;
}

async function sendEmail(user, link) {
  let text = composeTextMessage(user.username, link);
  let html = composeHTMLMessage(user.username, link);
  let message = {
    from: process.env.USER_MAIL_ADDRESS,
    to: user.email,
    subject: "Elephunk - Recovery Link",
    text: text,
    html: html,
  };

  // Send email
  try {
    await transporter.sendMail(message);
    return;
  } catch (err) {
    return err;
  }
}

module.exports = { sendEmail };
