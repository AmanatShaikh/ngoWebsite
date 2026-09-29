/* =========================================================
   ANJUMAN BASHINDGAN-E-BIHAR
   Authentication Frontend

   IMPORTANT:
   This file does not store fake accounts in localStorage.

   When the backend is created, these forms communicate with:

   POST /api/auth/register
   POST /api/auth/login

   Authentication will use HttpOnly cookies.
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const AUTH_API_BASE_URL = "/api";

/* =========================================================
   ELEMENT HELPERS
========================================================= */

function getElement(id) {
  return document.getElementById(id);
}


function getAuthAlert() {
  return getElement("auth-alert");
}


/* =========================================================
   ALERT
========================================================= */

function showAuthAlert(message, type = "error") {
  const alert = getAuthAlert();

  if (!alert) {
    return;
  }

  alert.className = `auth-alert auth-alert--${type} is-visible`;

  alert.textContent = message;

  alert.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}


function clearAuthAlert() {
  const alert = getAuthAlert();

  if (!alert) {
    return;
  }

  alert.className = "auth-alert";

  alert.textContent = "";
}


/* =========================================================
   FIELD ERRORS
========================================================= */

function setFieldError(input, errorElement, message) {
  if (!input || !errorElement) {
    return;
  }

  input.setAttribute("aria-invalid", "true");

  errorElement.textContent = message;

  errorElement.classList.add("is-visible");
}


function clearFieldError(input, errorElement) {
  if (!input || !errorElement) {
    return;
  }

  input.removeAttribute("aria-invalid");

  errorElement.textContent = "";

  errorElement.classList.remove("is-visible");
}


/* =========================================================
   VALIDATION HELPERS
========================================================= */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function isValidUsername(username) {
  return /^[a-zA-Z0-9._-]{3,30}$/.test(username);
}


function isValidIndianMobile(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function initializePasswordToggles() {
  const buttons = document.querySelectorAll(
    "[data-password-toggle]"
  );

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const inputId = button.dataset.passwordToggle;

      const input = getElement(inputId);

      if (!input) {
        return;
      }

      const shouldShow =
        input.type === "password";

      input.type = shouldShow
        ? "text"
        : "password";

      button.textContent = shouldShow
        ? "Hide"
        : "Show";

      button.setAttribute(
        "aria-label",
        shouldShow
          ? "Hide password"
          : "Show password"
      );
    });
  });
}


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

function calculatePasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password)
  ) {
    score += 1;
  }

  if (
    /\d/.test(password) ||
    /[^a-zA-Z0-9]/.test(password)
  ) {
    score += 1;
  }

  return Math.min(score, 4);
}


function initializePasswordStrength() {
  const passwordInput =
    getElement("signup-password");

  const strength =
    getElement("password-strength");

  const label =
    getElement("password-strength-label");

  if (
    !passwordInput ||
    !strength ||
    !label
  ) {
    return;
  }


  passwordInput.addEventListener(
    "input",
    () => {
      const password =
        passwordInput.value;

      if (!password) {
        strength.classList.remove(
          "is-visible"
        );

        strength.dataset.level = "0";

        return;
      }


      strength.classList.add(
        "is-visible"
      );


      const level =
        calculatePasswordStrength(
          password
        );


      strength.dataset.level =
        String(level);


      const labels = {
        0: "Very weak password",
        1: "Weak password",
        2: "Fair password",
        3: "Good password",
        4: "Strong password",
      };


      label.textContent =
        labels[level];
    }
  );
}


/* =========================================================
   BUTTON LOADING STATE
========================================================= */

function setSubmitLoading(
  button,
  isLoading
) {
  if (!button) {
    return;
  }

  button.disabled = isLoading;

  button.classList.toggle(
    "is-loading",
    isLoading
  );
}


/* =========================================================
   API REQUEST
========================================================= */

async function authRequest(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${AUTH_API_BASE_URL}${endpoint}`,
    {
      ...options,

      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",

        ...(options.headers || {}),
      },
    }
  );


  let data = null;


  try {
    data = await response.json();
  } catch {
    data = {
      message:
        "The server returned an invalid response.",
    };
  }


  if (!response.ok) {
    const error =
      new Error(
        data?.message ||
        "Something went wrong."
      );

    error.status = response.status;

    error.data = data;

    throw error;
  }


  return data;
}


/* =========================================================
   LOGIN VALIDATION
========================================================= */

function validateLoginForm() {
  let valid = true;


  const identifier =
    getElement("login-identifier");

  const password =
    getElement("login-password");


  const identifierError =
    getElement(
      "login-identifier-error"
    );

  const passwordError =
    getElement(
      "login-password-error"
    );


  clearFieldError(
    identifier,
    identifierError
  );

  clearFieldError(
    password,
    passwordError
  );


  const identifierValue =
    identifier?.value.trim() || "";

  const passwordValue =
    password?.value || "";


  if (!identifierValue) {
    setFieldError(
      identifier,
      identifierError,
      "Enter your username or email address."
    );

    valid = false;
  }


  if (!passwordValue) {
    setFieldError(
      password,
      passwordError,
      "Enter your password."
    );

    valid = false;
  }


  return valid;
}


/* =========================================================
   LOGIN
========================================================= */

function initializeLoginForm() {
  const form =
    getElement("login-form");

  if (!form) {
    return;
  }


  const submitButton =
    getElement("login-submit");


  const params =
    new URLSearchParams(
      window.location.search
    );


  if (
    params.get("registered") === "1"
  ) {
    showAuthAlert(
      "Your account has been created. You can now sign in.",
      "success"
    );
  }


  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      clearAuthAlert();


      if (!validateLoginForm()) {
        return;
      }


      const identifier =
        getElement(
          "login-identifier"
        ).value.trim();


      const password =
        getElement(
          "login-password"
        ).value;


      const remember =
        getElement(
          "login-remember"
        )?.checked || false;


      setSubmitLoading(
        submitButton,
        true
      );


      try {
        const response =
          await authRequest(
            "/auth/login",
            {
              method: "POST",

              body: JSON.stringify({
                identifier,
                password,
                remember,
              }),
            }
          );


        showAuthAlert(
          "Login successful. Redirecting to your dashboard...",
          "success"
        );


        window.setTimeout(() => {
          const role =
            response?.user?.role;


          if (role === "ADMIN") {
            window.location.href =
              "admin.html";

            return;
          }


          window.location.href =
            "dashboard.html";

        }, 600);

      } catch (error) {

        if (
          error instanceof TypeError
        ) {
          showAuthAlert(
            "The authentication server is not running yet. Your frontend form is working correctly; login will become active when we build and connect the backend.",
            "info"
          );

          return;
        }


        if (
          error.status === 401
        ) {
          showAuthAlert(
            "The username/email or password is incorrect.",
            "error"
          );

          return;
        }


        if (
          error.status === 429
        ) {
          showAuthAlert(
            "Too many login attempts. Please wait before trying again.",
            "error"
          );

          return;
        }


        showAuthAlert(
          error.message ||
          "Unable to sign in.",
          "error"
        );

      } finally {
        setSubmitLoading(
          submitButton,
          false
        );
      }
    }
  );
}


/* =========================================================
   SIGNUP VALIDATION
========================================================= */

function validateSignupForm() {
  let valid = true;


  const name =
    getElement("signup-name");

  const username =
    getElement("signup-username");

  const phone =
    getElement("signup-phone");

  const email =
    getElement("signup-email");

  const password =
    getElement("signup-password");

  const confirmPassword =
    getElement(
      "signup-confirm-password"
    );

  const terms =
    getElement("signup-terms");


  const nameError =
    getElement("signup-name-error");

  const usernameError =
    getElement(
      "signup-username-error"
    );

  const phoneError =
    getElement("signup-phone-error");

  const emailError =
    getElement("signup-email-error");

  const passwordError =
    getElement(
      "signup-password-error"
    );

  const confirmError =
    getElement(
      "signup-confirm-password-error"
    );

  const termsError =
    getElement("signup-terms-error");


  clearFieldError(
    name,
    nameError
  );

  clearFieldError(
    username,
    usernameError
  );

  clearFieldError(
    phone,
    phoneError
  );

  clearFieldError(
    email,
    emailError
  );

  clearFieldError(
    password,
    passwordError
  );

  clearFieldError(
    confirmPassword,
    confirmError
  );


  if (termsError) {
    termsError.textContent = "";

    termsError.classList.remove(
      "is-visible"
    );
  }


  const nameValue =
    name?.value.trim() || "";

  const usernameValue =
    username?.value.trim() || "";

  const phoneValue =
    phone?.value.trim() || "";

  const emailValue =
    email?.value.trim() || "";

  const passwordValue =
    password?.value || "";

  const confirmValue =
    confirmPassword?.value || "";


  if (nameValue.length < 2) {
    setFieldError(
      name,
      nameError,
      "Enter your full name."
    );

    valid = false;
  }


  if (
    !isValidUsername(
      usernameValue
    )
  ) {
    setFieldError(
      username,
      usernameError,
      "Use 3–30 letters, numbers, dots, underscores or hyphens."
    );

    valid = false;
  }


  if (
    phoneValue &&
    !isValidIndianMobile(
      phoneValue
    )
  ) {
    setFieldError(
      phone,
      phoneError,
      "Enter a valid 10-digit Indian mobile number."
    );

    valid = false;
  }


  if (
    !isValidEmail(emailValue)
  ) {
    setFieldError(
      email,
      emailError,
      "Enter a valid email address."
    );

    valid = false;
  }


  if (
    passwordValue.length < 8
  ) {
    setFieldError(
      password,
      passwordError,
      "Password must contain at least 8 characters."
    );

    valid = false;
  }


  if (
    confirmValue !==
    passwordValue
  ) {
    setFieldError(
      confirmPassword,
      confirmError,
      "The passwords do not match."
    );

    valid = false;
  }


  if (!terms?.checked) {
    if (termsError) {
      termsError.textContent =
        "You must confirm this before creating your account.";

      termsError.classList.add(
        "is-visible"
      );
    }

    valid = false;
  }


  return valid;
}


/* =========================================================
   SIGNUP
========================================================= */

function initializeSignupForm() {
  const form =
    getElement("signup-form");

  if (!form) {
    return;
  }


  const submitButton =
    getElement("signup-submit");


  const usernameInput =
    getElement("signup-username");


  const phoneInput =
    getElement("signup-phone");


  usernameInput?.addEventListener(
    "input",
    () => {
      usernameInput.value =
        usernameInput.value
          .replace(/\s+/g, "")
          .slice(0, 30);
    }
  );


  phoneInput?.addEventListener(
    "input",
    () => {
      phoneInput.value =
        phoneInput.value
          .replace(/\D/g, "")
          .slice(0, 10);
    }
  );


  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      clearAuthAlert();


      if (!validateSignupForm()) {
        return;
      }


      const payload = {
        name:
          getElement(
            "signup-name"
          ).value.trim(),

        username:
          getElement(
            "signup-username"
          ).value
            .trim()
            .toLowerCase(),

        email:
          getElement(
            "signup-email"
          ).value
            .trim()
            .toLowerCase(),

        phone:
          getElement(
            "signup-phone"
          ).value.trim() || null,

        password:
          getElement(
            "signup-password"
          ).value,
      };


      setSubmitLoading(
        submitButton,
        true
      );


      try {
        await authRequest(
          "/auth/register",
          {
            method: "POST",

            body: JSON.stringify(
              payload
            ),
          }
        );


        showAuthAlert(
          "Account created successfully. Redirecting you to login...",
          "success"
        );


        form.reset();


        window.setTimeout(() => {
          window.location.href =
            "login.html?registered=1";
        }, 800);

      } catch (error) {

        if (
          error instanceof TypeError
        ) {
          showAuthAlert(
            "The backend is not running yet. Your signup form and frontend validation are working correctly. Registration will become active when we connect the Express API.",
            "info"
          );

          return;
        }


        if (
          error.status === 409
        ) {
          showAuthAlert(
            error.message ||
            "That username or email is already registered.",
            "error"
          );

          return;
        }


        if (
          error.status === 422 ||
          error.status === 400
        ) {
          showAuthAlert(
            error.message ||
            "Please check the information you entered.",
            "error"
          );

          return;
        }


        showAuthAlert(
          error.message ||
          "Unable to create your account.",
          "error"
        );

      } finally {
        setSubmitLoading(
          submitButton,
          false
        );
      }
    }
  );
}


/* =========================================================
   CLEAR ERRORS WHILE EDITING
========================================================= */

function initializeLiveErrorClearing() {
  const inputs =
    document.querySelectorAll(
      ".auth-input"
    );


  inputs.forEach((input) => {
    input.addEventListener(
      "input",
      () => {
        input.removeAttribute(
          "aria-invalid"
        );


        const error =
          getElement(
            `${input.id}-error`
          );


        if (error) {
          error.textContent = "";

          error.classList.remove(
            "is-visible"
          );
        }
      }
    );
  });
}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeAuth() {
  initializePasswordToggles();

  initializePasswordStrength();

  initializeLiveErrorClearing();

  initializeLoginForm();

  initializeSignupForm();
}


document.addEventListener(
  "DOMContentLoaded",
  initializeAuth
);