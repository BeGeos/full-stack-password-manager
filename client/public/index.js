// TODO
// [] Tmp DB for user data when loading page. Set under id == userId and use info for
// [] Tmp DB for shown passwords. Use Redis Store. Read only!
// [] Search functionalities for input

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
    try {
      let request = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      return request;
    } catch (err) {
      console.error(err);
      return;
    }
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

  // Global variables
  let USERNAME = parseUserFromURL();

  // User actions
  const openUserInfoBtn = document.getElementById("open-user-info-btn");
  const actionsContainer = document.querySelector(".actions-container");
  const openUpdateUserBtn = document.getElementById("open-update-user");
  const userInfo = document.querySelector(".user-nav-list");
  const updateUserInfo = document.querySelector(".update-user__form");
  const updateUserInfoForm = document.getElementById("update-user");
  const openDeleteUserBtn = document.getElementById("delete-account-trashcan");
  const deleteUser = document.querySelector(".confirm-user-delete");
  const deleteUserBtn = document.getElementById("delete-account-btn");
  const goBackToUserInfo = document.querySelectorAll(".go-back-to-info");

  openUserInfoBtn.addEventListener("click", (e) => {
    actionsContainer.classList.toggle("open");
  });

  openUpdateUserBtn.addEventListener("click", (e) => {
    userInfo.classList.remove("show");
    updateUserInfo.classList.add("show");
  });

  updateUserInfoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Send info to API and display response if error else back to info
    console.log("Sent!");
  });

  // Go back to user info
  function goBackToInfo(target) {
    target.closest(".show").classList.remove("show");
    userInfo.classList.add("show");
  }

  goBackToUserInfo.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      goBackToInfo(e.target);
    });
  });

  openDeleteUserBtn.addEventListener("click", (e) => {
    deleteUser.classList.add("show");
    userInfo.classList.remove("show");
  });

  deleteUserBtn.addEventListener("click", (e) => {
    // Send request to delete user and after confirm logout user
    console.log("Deleted!");
  });

  // Helper functions
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
  confirmDeleteBtn.addEventListener("click", async (e) => {
    let _id = e.target.closest(".delete-modal").getAttribute("dataset");
    // console.log(_id);
    // Send request to API to delete record. In body userId and password id == _id
    try {
      let request = await fetch(API_URL + `delete/${USERNAME}?id=${_id}`, {
        method: "DELETE",
      });
      if (request.status == 200) {
        showSuccessDeleteView();
        listAllRecords(USERNAME);
      } else {
        // Display error message
        let response = await request.json();
        console.error(response.message);
        return;
      }
    } catch (err) {
      console.error(err);
      return;
    }
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
    newPasswordInput.value = "********";
  }

  // Parse window path
  function parseUserFromURL() {
    let path = window.location.pathname;
    let splitURL = path.split("/");
    let user = splitURL[splitURL.length - 1];
    return user;
  }

  // Request for all records when page loads
  // Store in tmp DB (Redis) first response under id == user_id
  async function listAllRecords(username) {
    try {
      let request = await fetch(API_URL + `account/${username}`);
      if (request.status == 200) {
        let response = await request.json();
        // console.log(response.passwords);
        putRecordsOnPage(response);
      } else {
        console.error(request.error);
        return;
      }
    } catch (err) {
      console.error(err);
      return;
    }
  }

  // Request passwords for users
  async function requestPassById(id, username) {
    try {
      let request = await fetch(API_URL + `account/${username}?pass=${id}`);
      let response = await request.json();
      return response;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  async function requestPassByAccount(account, username) {
    try {
      let request = await fetch(
        API_URL + `account/${username}?account=${account}`
      );
      let response = await request.json();
      return response;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  // Date format for humans
  function formatDate(date) {
    let source = new Date(date);
    let day = source.getDate();
    let month = source.getMonth() + 1;
    let year = source.getFullYear();

    return `${day}/${month}/${year}`;
  }

  // Input event for search bar
  const searchBar = document.getElementById("read-search-bar");

  searchBar.addEventListener("input", async (e) => {
    // Check in tmp storage Redis Store then make request in case
    if (searchBar.value.length % 3 == 0) {
      // Send request and put data into table every 3 characters
      try {
        let matches = await requestPassByAccount(searchBar.value, USERNAME);
        putRecordsOnPage(matches);
      } catch (err) {
        console.error(err);
        return;
      }
    }
  });

  // Select the table body
  const tableBody = document.querySelector(".table-body");

  // Put data in table
  function putRecordsOnPage(data) {
    // Clear Div
    tableBody.innerHTML = "";

    if (data.passwords.length == 0) {
      let noRecordMsg = document.createElement("h3");
      noRecordMsg.textContent = "No Record Here!";
      tableBody.appendChild(noRecordMsg);
      return;
    } else {
      // Create a single row + id of password
      let passwords = data.passwords;
      passwords.forEach((pass) => {
        // Format the date
        let correctDate = formatDate(pass.createdAt);

        // Create Row
        let tableRow = document.createElement("div");
        tableRow.classList.add("table-row");
        tableRow.setAttribute("id", pass._id);

        // Create account column
        let accountP = document.createElement("p");
        let mobileAccountSpan = document.createElement("span");
        let accountText = document.createElement("span");
        mobileAccountSpan.classList.add("mobile-table-row");
        mobileAccountSpan.textContent = "Account";
        accountText.textContent = pass.account;
        accountP.appendChild(mobileAccountSpan);
        accountP.appendChild(accountText);
        tableRow.appendChild(accountP);

        // Create name column
        let nameP = document.createElement("p");
        let mobileNameSpan = document.createElement("span");
        let nameText = document.createElement("span");
        mobileNameSpan.classList.add("mobile-table-row");
        mobileNameSpan.textContent = "Name";
        nameText.textContent = pass.name;
        nameP.appendChild(mobileNameSpan);
        nameP.appendChild(nameText);
        tableRow.appendChild(nameP);

        // Create password column
        let passwordDiv = document.createElement("div");
        let passMobileSpan = document.createElement("span");
        let passContainer = document.createElement("div");
        passContainer.classList.add("password-container");
        let passSlot = document.createElement("div");
        passSlot.classList.add("password-slot");
        let passSpan = document.createElement("span");
        passSpan.classList.add("password");
        passSpan.textContent = "********";
        let clipboard = document.createElement("span");
        clipboard.classList.add("password-clipboard");
        let clipboardImg = document.createElement("img");
        clipboardImg.src = "../public/images/clipboard.svg";
        clipboardImg.alt = "copy password to clipboard";
        clipboard.appendChild(clipboardImg);
        passSlot.appendChild(passSpan);
        passContainer.appendChild(passSlot);
        passContainer.appendChild(clipboard);
        passwordDiv.appendChild(passMobileSpan);
        passwordDiv.appendChild(passContainer);
        tableRow.appendChild(passwordDiv);

        // Create date column
        let dateP = document.createElement("p");
        let dateMobileSpan = document.createElement("span");
        dateMobileSpan.classList.add("mobile-table-row");
        dateMobileSpan.textContent = "Created";
        let dateText = document.createElement("span");
        dateText.textContent = correctDate;
        dateP.appendChild(dateMobileSpan);
        dateP.appendChild(dateText);
        tableRow.appendChild(dateP);

        // Create Action Buttons
        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("record-btn");
        let updateButton = document.createElement("button");
        updateButton.classList.add("update-btn");
        let deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-btn");
        buttonContainer.appendChild(updateButton);
        buttonContainer.appendChild(deleteButton);
        tableRow.appendChild(buttonContainer);

        // Append row to Table Body
        tableBody.appendChild(tableRow);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // TODO show spinning gif when loading then data
    // await listAllRecords(USERNAME);
  });

  // request password for single user
  async function getPasswordForUser(id, username) {
    try {
      let request = await fetch(API_URL + `read/${username}?id=${id}`);
      let response = await request.json();
      return response;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  // TODO Put in tmp database all records for user for update form better than keep requesting

  // Add event listener to document because elements are loaded async
  document.addEventListener("click", async (e) => {
    // Event for showing password clicking spans
    if (
      e.target.matches("span") &&
      (e.target.getAttribute("class") == "password" ||
        e.target.getAttribute("class") == "password show")
    ) {
      // Check if show
      let showState = e.target.getAttribute("class");
      let _id = e.target.closest("div .table-row").id;

      if (showState == "password") {
        // TODO put response in tmp storage Redis for id passwords
        // make Request for specific password by ID
        try {
          let data = await getPasswordForUser(_id, USERNAME);
          // After response put state as shown and text content as password
          e.target.textContent = data.password;
          e.target.classList.add("show");
        } catch (err) {
          console.error(err);
          return;
        }
      } else if (showState == "password show") {
        // Set text content as ********* and set state as hidden
        e.target.textContent = "********";
        e.target.classList.remove("show");
      }
      e.target.closest("div").classList.toggle("open");
    } else if (
      // Event for open update modal when clicking update button
      e.target.matches("button") &&
      e.target.getAttribute("class") == "update-btn"
    ) {
      overlay.classList.toggle("open");
      updateModal.classList.toggle("show");
      updateForm.style.display = "flex";
      let _id = e.target.closest("div .table-row").id;
      updateModal.setAttribute("dataset", _id);
      // Request to API via ID + userID
      try {
        let data = await requestPassById(_id, USERNAME);
        let account = data.passwords.account;
        let name = data.passwords.name;
        setValuesToUpdate(account, name);
      } catch (err) {
        console.error(err);
        return;
      }
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
  async function sendUpdate(id, payload) {
    // Sent PUT request to API for updating records
    try {
      let request = await fetch(API_URL + `update/${USERNAME}?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return request;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  // Success view when update is sent
  function successUpdate() {
    updateForm.style.display = "none";
    updateSuccessView.style.display = "block";
    setTimeout(closeUpdateModal, 1500);
  }

  // Event listener to the update form
  updateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let recordId = e.target.closest("div").getAttribute("dataset");
    let updateFormData = new FormData(updateForm);
    let newAccount = updateFormData.get("update-account");
    let newName = updateFormData.get("update-name");
    let newPassword = updateFormData.get("update-password");

    let updateRequest = {
      account: newAccount,
      name: newName,
    };

    if (!newPassword.match(/\*+/)) {
      updateRequest.password = newPassword;
    }
    try {
      // Send request
      let request = await sendUpdate(recordId, updateRequest);

      if (request.status == 201) {
        // if status code == 200 --> hide form, display success view and wait 1s to close modal
        successUpdate();
        await listAllRecords(USERNAME);
      } else {
        let response = await request.json();
        closeUpdateModal();
        composeErrorMessage(response.message);
        displayErrorMessage();
        console.error(response.message);
        return;
      }
    } catch (err) {
      composeErrorMessage(err);
      displayErrorMessage();
      return;
    }
  });

  // Event listener for create record form
  const createRecordForm = document.querySelector(".create-form");

  createRecordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Send POST request to /create/:username with account, password required and name not required
    let formData = new FormData(createRecordForm);
    let payload = {
      account: formData.get("create-account"),
      password: formData.get("create-password"),
      name: formData.get("create-name") || "-",
    };

    try {
      let request = await fetch(API_URL + `create/${USERNAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (request.status == 201) {
        window.location = `/user/${USERNAME}`;
      } else {
        let response = await request.json();
        composeErrorMessage(response.message);
        displayErrorMessage();
        console.error(response.message);
        return;
      }
    } catch (err) {
      composeErrorMessage(response.message);
      displayErrorMessage();
      console.error(err);
      return;
    }
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
