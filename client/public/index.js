// Global variables
const BASE_URL = "http://localhost:3000";
const API_URL = "http://localhost:3000/api/v1/";
const AUTH_URL = "http://localhost:3000/auth/";

// Global Error elements
const errorMessage = document.querySelector(".error-message");
const innerErrorMessage = document.getElementById("message");
const closeErrorMessageBtn = document.getElementById("close-error-message");

// Global Helper functions
function composeErrorMessage(message) {
  let messageText = document.createElement("p");
  messageText.textContent = message;
  innerErrorMessage.appendChild(messageText);
}

function displayErrorMessage() {
  errorMessage.classList.add("visible");
}

function removeError() {
  innerErrorMessage.innerHTML = "";
  errorMessage.classList.remove("visible");
}

closeErrorMessageBtn.addEventListener("click", (e) => {
  removeError(errorMessage);
});

// Hero page features
const heroPage = document.querySelector(".hero-page");

if (heroPage) {
  const redirectToLogin = document.getElementById("redirect-to-login");
  const redirectToSignUp = document.getElementById("redirect-to-signup");
  const signUp = document.querySelector(".sign-up");
  const login = document.querySelector(".login");

  // Show either login or register form when prompt
  redirectToLogin.addEventListener("click", (e) => {
    signUp.classList.remove("visible");
    login.classList.add("visible");
  });

  redirectToSignUp.addEventListener("click", (e) => {
    login.classList.remove("visible");
    signUp.classList.add("visible");
  });

  // Validation for login and singUp forms
  const signUpForm = document.querySelector(".register-form");
  const loginForm = document.querySelector(".login-form");

  // Helper functions for validation
  // Validate registration and login form if they are empty strings
  function isRegisterValid(data) {
    return (
      data.get("sign-up-username").trim() !== "" &&
      data.get("sign-up-password").trim() !== "" &&
      data.get("sign-up-confirm-password") !== "" &&
      data.get("sign-up-email").trim() !== ""
    );
  }

  function isLoginValid(data) {
    return (
      data.get("login-username").trim() !== "" &&
      data.get("login-password").trim() !== ""
    );
  }

  // Check whether password contain spaces, is shorter than 8 characters or passwords don't match
  function checkPassword(password1, password2) {
    let errorLenght = false;
    let errorMatch = false;
    if (
      // Check length
      password1.match(/\s+/) ||
      password1.trim().length < 4 ||
      password1.trim().lenght > 32
    ) {
      // Add message to error messages
      composeErrorMessage(
        "Invalid Password - Must be longer than 4 characters and shorter than 32"
      );
      errorLenght = true;
    }

    if (password1.trim() !== password2.trim()) {
      // Check if passwords match - if not
      // Add unmatch message
      composeErrorMessage("Passwords don't match");
      errorMatch = true;
    }

    // If there is just one error than display it
    if (errorLenght || errorMatch) {
      displayErrorMessage(errorMessage);
    }
    return errorLenght || errorMatch;
  }

  // Test DB for Users verification --> no duplicate
  let users = ["marco"];

  // function isUsernameValid(username) {
  //   // Check if username already exists
  //   // The style addition belongs to the helper functions
  //   if (users.includes(username)) {
  //     addSignUpUsernameError(true);
  //     return false;
  //   } else {
  //     addSignUpUsernameError(false);
  //     return true;
  //   }
  // }

  const REGISTER_URL = API_URL + "signup";
  const LOGIN_URL = AUTH_URL + "login";

  // Add an event listener to the register form
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Remove all the errors
    removeError();

    let formData = new FormData(signUpForm);
    // Check that input fields are not empty strings
    if (isRegisterValid(formData)) {
      let username = formData.get("sign-up-username");
      let password = formData.get("sign-up-password");
      let email = formData.get("sign-up-email");
      let confirmPassword = formData.get("sign-up-confirm-password");

      if (!checkPassword(password, confirmPassword)) {
        try {
          let request = await fetch(REGISTER_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username,
              email,
              password,
            }),
          });

          let signUpResponse = await request.json();
          if (request.status == 201) {
            // Login immediately - request to login for cookie
            let logIn = await loginUser(username, password);
            let loginResponse = await logIn.json();

            if (logIn.status == 200) {
              // [*] Redirect to user dashboard
              window.location = `/user/${username}`;
            } else {
              // display error
              composeErrorMessage(loginResponse.message);
              displayErrorMessage();
              return;
            }
          } else {
            // Display error
            composeErrorMessage(signUpResponse.message);
            displayErrorMessage();
            return;
          }
        } catch (err) {
          // Display error message
          composeErrorMessage(err.message);
          displayErrorMessage();
          signUpForm.reset();
          console.error(err);
        }
      }
    }
    return;
  });

  async function loginUser(username, password) {
    let requestBody = {
      username,
      password,
    };

    let request = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    return request;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    removeError();
    let formData = new FormData(loginForm);
    // Check that input fields are not empty strings
    if (isLoginValid(formData)) {
      // Request to auth/login route
      let username = formData.get("login-username");
      let password = formData.get("login-password");

      try {
        let logIn = await loginUser(username, password);
        let response = await logIn.json();
        if (logIn.status == 200) {
          // Redirect to dashboard
          window.location = `user/${username}`;
        } else {
          // display error
          composeErrorMessage(response.message);
          displayErrorMessage();
          console.error(response.message);
        }
      } catch (err) {
        console.error(err);
        return;
      }
    } else {
      composeErrorMessage("Invalid Login");
      displayErrorMessage();
    }
    return;
  });
}

// JS for the dashboard
const dashboardPage = document.querySelector(".dashboard");

if (dashboardPage) {
  // Navigation events
  const dashboardNavigation = document.querySelector(".dashboard-navigation");
  const dashboardNavBtns = document.querySelectorAll(
    ".dashboard-navigation [dataset]"
  );

  // Hide section if not visible
  function hideSection(section) {
    section.classList.remove("visible");
  }

  // Show section
  function showSection(section) {
    section.classList.add("visible");
  }

  dashboardNavBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      let btnDataset = e.target.getAttribute("dataset");
      // Select current active button
      let currentActiveBtn = document.querySelector(
        ".dashboard-navigation .active"
      );

      // Select current visible section
      let currentVisibleSection = document.querySelector("section.visible");
      if (btnDataset == currentVisibleSection.id) {
        return;
      }
      currentActiveBtn.classList.remove("active");
      hideSection(currentVisibleSection);
      let sectionToShow = document.getElementById(btnDataset);
      sectionToShow.classList.add("visible");
      e.target.classList.add("active");
    });
  });

  // Modals and forms
  const overlay = document.querySelector(".overlay");
  const updateModal = document.querySelector(".update-modal");
  const closeUpdateModalBtn = document.querySelector(".close-update-modal");
  const updateSuccessView = document.querySelector(".update-success-view");

  // Input for update form
  const updateForm = document.querySelector(".update-form");
  const accountInput = document.getElementById("update-account");
  const nameInput = document.getElementById("update-name");
  const newPasswordInput = document.getElementById("update-password");

  // Delete modal
  const deleteModal = document.querySelector(".delete-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const deleteActions = document.querySelector(".delete-actions");
  const deleteSuccessView = document.querySelector(".delete-success-view");

  // Event for overlay when clicked it closes
  // overlay.addEventListener("click", (e) => {
  //   overlay.classList.remove("open");
  // });

  // Close update modal
  function closeUpdateModal() {
    updateModal.removeAttribute("dataset");
    updateSuccessView.style.display = "none";
    updateModal.classList.remove("show");
    overlay.classList.remove("open");
  }

  // Close delete modal
  function closeDeleteModal() {
    deleteModal.removeAttribute("dataset");
    deleteModal.classList.remove("show");
    deleteActions.classList.remove("show");
    deleteSuccessView.classList.remove("show");
    overlay.classList.remove("open");
  }

  // Event for closing update modal
  closeUpdateModalBtn.addEventListener("click", (e) => {
    closeUpdateModal();
  });

  // Event for closing Delete modal --> cancel button
  cancelDeleteBtn.addEventListener("click", (e) => {
    closeDeleteModal();
  });

  // Event for confirm delete button
  confirmDeleteBtn.addEventListener("click", (e) => {
    let _id = e.target.closest(".delete-modal").getAttribute("dataset");
    console.log(_id);
    // Send request to API to delete record. In body userId and password id == _id
    showSuccessDeleteView();
  });

  // Success View when record is deleted
  function showSuccessDeleteView() {
    deleteActions.classList.remove("show");
    deleteSuccessView.classList.add("show");
    setTimeout(closeDeleteModal, 1500);
  }

  // Helper function to put values into update form inputs
  function setValuesToUpdate(account, name) {
    accountInput.value = account;
    nameInput.value = name;
    newPasswordInput.value = "*****";
  }

  // Test DB for user record information --> test update modal form
  const DB = [
    {
      id: 1,
      account: "bank account",
      name: "-",
      password: "chimichanga",
    },
    {
      id: 2,
      account: "facebook",
      name: "facebook",
      password: "deadpool00",
    },
  ];

  // Add event listener to document because elements are loaded async
  document.addEventListener("click", (e) => {
    // Event for showing password clicking spans
    if (
      e.target.matches("span") &&
      e.target.getAttribute("class") == "password"
    ) {
      e.target.classList.add("show");
      e.target.closest("div").classList.add("open");
    } else if (
      e.target.matches("span") &&
      e.target.getAttribute("class") == "password show"
    ) {
      e.target.classList.remove("show");
      e.target.closest("div").classList.remove("open");
    } else if (
      // Event for open update modal when clicking update button
      e.target.matches("button") &&
      e.target.getAttribute("class") == "update-btn"
    ) {
      overlay.classList.add("open");
      updateModal.classList.add("show");
      updateForm.style.display = "flex";
      let _id = e.target.closest("div .table-row").id;
      updateModal.setAttribute("dataset", _id);
      // Request to API via ID + userID
      // Response with account, name, password
      // Test request to fake DB
      let data = DB.filter((record) => record.id == _id)[0];
      let account = data.account;
      let name = data.name;
      setValuesToUpdate(account, name);
    } else if (
      // Event for open delete confirmation modal when clicking update button
      e.target.matches("button") &&
      e.target.getAttribute("class") == "delete-btn"
    ) {
      overlay.classList.add("open");
      deleteModal.classList.add("show");
      deleteActions.classList.add("show");
      let _id = e.target.closest("div .table-row").id;
      deleteModal.setAttribute("dataset", _id);
    }
  });

  // Send update request to API
  function sendUpdate() {
    // Send object to API with {userId, recordId, account, name, password and date}
  }

  // Success view when update is sent
  function successUpdate() {
    updateForm.style.display = "none";
    updateSuccessView.style.display = "block";
    setTimeout(closeUpdateModal, 1500);
  }

  // Event listener to the update form
  updateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let recordId = e.target.closest("div").getAttribute("dataset");
    let updateFormData = new FormData(updateForm);
    let newAccount = updateFormData.get("update-account");
    let newName = updateFormData.get("update-name");
    let newPassword = updateFormData.get("update-password");

    // Sent PUT request to API for updating records
    // fetch ....

    // if status code == 200 --> hide form, display success view and wait 1s to close modal
    successUpdate();
  });

  // Event listener for create record form
  const createRecordForm = document.querySelector(".create-form");

  createRecordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("record created!");
  });

  // Generate random password
  function generateRandomPassword(len = 24) {
    // Letters upper and lowercase and numbers 0-9
    let alphanumeric =
      "abcdefghjkilmnopqrstuvwyxzABCDEFGHJKILMNOPQRSTUVWYXZ0123456789";

    let code = new Array();

    for (let i = 0; i < len; i++) {
      let index = Math.floor(Math.random() * alphanumeric.length);
      code.push(alphanumeric.charAt(index));
    }

    code = code.join("");
    return code;
  }

  // Event for generate password form
  const passwordLength = document.getElementById("password-gen-length");
  const randomPasswordText = document.querySelector(".random-password");
  const generatePasswordBtn = document.getElementById("generate-password-btn");

  generatePasswordBtn.addEventListener("click", (e) => {
    let length = passwordLength.value;

    if (length < 4 || length.trim() == "" || length > 32) {
      randomPasswordText.textContent =
        "Password cannot be empty, shorter than 4 characters or longer than 32";
      return;
    }

    let randomPassword = generateRandomPassword(length);
    randomPasswordText.textContent = "";
    randomPasswordText.textContent = randomPassword;
  });

  // Logout Btn event
  const logoutBtn = document.getElementById("logout-btn");

  logoutBtn.addEventListener("click", async (e) => {
    await fetch(AUTH_URL + "logout");
    window.location = "/";
  });
}

// Recovery View
const recoveryPage = document.getElementById("recovery-page");

// Fade Out popup
async function fadeOutPopUp(node, path) {
  setTimeout(() => {
    node.classList.remove("visible");
    window.location = path;
  }, 3500);
}

if (recoveryPage) {
  const recoveryForm = document.getElementById("recovery-form");
  const popupSuccess = document.querySelector(".success-popup");

  recoveryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    removeError();
    let formData = new FormData(recoveryForm);
    // Send data to API and await response
    let email = formData.get("recovery-email");
    let username = formData.get("recovery-username");

    try {
      let recoveryRequest = await fetch(API_URL + "recovery", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username }),
      });

      // If error than displayErrorMessage
      if (recoveryRequest.status == 200) {
        popupSuccess.classList.add("visible");
        recoveryForm.reset();
        console.log("Email Sent!");
        // Fade out
        await fadeOutPopUp(popupSuccess, "/");
      } else if (recoveryRequest.status == 500) {
        let response = await recoveryRequest.json();
        composeErrorMessage("Oops, something went wrong");
        displayErrorMessage();
      } else {
        let response = await recoveryRequest.json();
        composeErrorMessage(response.message);
        displayErrorMessage();
      }
    } catch (err) {
      console.error(err);
      composeErrorMessage(err.message);
      displayErrorMessage();
    }
  });
}

// Recovery Password Page
const recoveryPasswordPage = document.getElementById("recovery-password-page");

if (recoveryPasswordPage) {
  const actualRecoveryForm = document.getElementById("recovery-form");

  actualRecoveryForm.addEventListener("submit", async (e) => {
    removeError();
    let formData = new FormData(actualRecoveryForm);
    // Send request and await for response

    // Check if they match and longer than 4 chars and shorter than 32
    let newPassword = formData.get("recovery-password");
    let confirmNewPassword = formData.get("recovery-confirm-password");

    if (newPassword != confirmNewPassword) {
      e.preventDefault();
      composeErrorMessage("Passwords don't match");
      displayErrorMessage();
    } else if (
      newPassword.trim().length < 4 ||
      newPassword.trim().length > 32
    ) {
      e.preventDefault();
      composeErrorMessage(
        "Password must be longer than 4 characters and shorter than 32"
      );
      displayErrorMessage();
    } else {
      // Display success message and redirect to homepage
    }
  });
}
