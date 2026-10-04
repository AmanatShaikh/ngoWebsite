/* =========================================================
   ANJUMAN BASHINDGAN-E-BIHAR
   Shared Frontend JavaScript
========================================================= */


const SITE_CONFIG = {
  name: "Anjuman Bashindgan-E-Bihar",

  logo: "./assets/images/branding/logo.png",

  navigation: [
    {
      label: "Home",
      href: "index.html",
    },
    {
      label: "About",
      href: "about.html",
    },
    {
      label: "Services",
      href: "services.html",
    },
    {
      label: "Gallery",
      href: "gallery.html",
    },
    {
      label: "Contact",
      href: "contact.html",
    },
  ],
};


/* =========================================================
   HELPERS
========================================================= */

function getCurrentPage() {
  const path = window.location.pathname;

  const page = path.split("/").pop();

  return page || "index.html";
}


function isCurrentPage(href) {
  return getCurrentPage() === href;
}


function createNavigationLinks(className) {
  return SITE_CONFIG.navigation
    .map((item) => {
      const activeClass = isCurrentPage(item.href)
        ? "is-active"
        : "";

      const ariaCurrent = isCurrentPage(item.href)
        ? 'aria-current="page"'
        : "";

      return `
        <li>
          <a
            href="${item.href}"
            class="${className} ${activeClass}"
            ${ariaCurrent}
          >
            ${item.label}
          </a>
        </li>
      `;
    })
    .join("");
}


/* =========================================================
   AUTH HELPERS
========================================================= */

async function getCurrentUser() {
  try {
    const response = await fetch(
      "/api/auth/me",
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      }
    );


    if (!response.ok) {
      return null;
    }


    const data =
      await response.json();


    return (
      data?.user ||
      data ||
      null
    );

  } catch (error) {
    console.error(
      "Unable to load current user:",
      error
    );

    return null;
  }
}


async function logoutCurrentUser() {
  try {
    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      }
    );

  } catch (error) {
    console.error(
      "Logout request failed:",
      error
    );

  } finally {
    window.location.href =
      "login.html";
  }
}


function getUserDisplayName(user) {
  return (
    user?.name ||
    user?.username ||
    user?.email ||
    "Account"
  );
}


function getUserInitial(user) {
  return getUserDisplayName(user)
    .trim()
    .charAt(0)
    .toUpperCase();
}


/* =========================================================
   AUTH UI
========================================================= */

function createLoggedOutDesktopAuth() {
  return `
    <div class="site-auth site-auth--guest">

      <a
        href="login.html"
        class="site-header__login"
      >
        Login
      </a>

      <a
        href="signup.html"
        class="btn btn--outline site-auth__signup"
      >
        Sign Up
      </a>

    </div>
  `;
}


function createLoggedInDesktopAuth(user) {
  const displayName =
    getUserDisplayName(user);

  const initial =
    getUserInitial(user);

  const portalHref =
    user.role === "ADMIN"
      ? "admin.html"
      : "dashboard.html";

  const portalLabel =
    user.role === "ADMIN"
      ? "Admin Portal"
      : "My Dashboard";


  return `
    <div
      class="site-profile"
      id="site-profile"
    >

      <button
        type="button"
        class="site-profile__button"
        id="site-profile-button"
        aria-expanded="false"
        aria-controls="site-profile-menu"
      >

        <span
          class="site-profile__avatar"
          aria-hidden="true"
        >
          ${initial}
        </span>

        <span class="site-profile__name">
          ${displayName}
        </span>

        <span
          class="site-profile__chevron"
          aria-hidden="true"
        >
          ▾
        </span>

      </button>


      <div
        class="site-profile__menu"
        id="site-profile-menu"
      >

        <div class="site-profile__summary">

          <span class="site-profile__summary-name">
            ${displayName}
          </span>

          <span class="site-profile__summary-role">
            ${
              user.role === "ADMIN"
                ? "Administrator"
                : "Member"
            }
          </span>

        </div>


        <a
          href="${portalHref}"
          class="site-profile__menu-item"
        >
          ${portalLabel}
        </a>


        ${
          user.role !== "ADMIN"
            ? `
              <a
                href="apply.html"
                class="site-profile__menu-item"
              >
                Apply for Assistance
              </a>
            `
            : ""
        }


        <button
          type="button"
          class="
            site-profile__menu-item
            site-profile__menu-item--danger
          "
          id="site-logout-button"
        >
          Logout
        </button>

      </div>

    </div>
  `;
}


function createLoggedOutMobileAuth() {
  return `
    <a
      href="login.html"
      class="btn btn--secondary"
    >
      Login
    </a>

    <a
      href="signup.html"
      class="btn btn--outline"
    >
      Sign Up
    </a>
  `;
}


function createLoggedInMobileAuth(user) {
  const displayName =
    getUserDisplayName(user);

  const portalHref =
    user.role === "ADMIN"
      ? "admin.html"
      : "dashboard.html";

  const portalLabel =
    user.role === "ADMIN"
      ? "Admin Portal"
      : "My Dashboard";


  return `
    <div class="mobile-account-summary">

      <span class="mobile-account-summary__avatar">
        ${getUserInitial(user)}
      </span>

      <div>

        <strong>
          ${displayName}
        </strong>

        <span>
          ${
            user.role === "ADMIN"
              ? "Administrator"
              : "Member"
          }
        </span>

      </div>

    </div>


    <a
      href="${portalHref}"
      class="btn btn--secondary"
    >
      ${portalLabel}
    </a>


    ${
      user.role !== "ADMIN"
        ? `
          <a
            href="apply.html"
            class="btn btn--outline"
          >
            Apply for Assistance
          </a>
        `
        : ""
    }


    <button
      type="button"
      class="
        btn
        btn--outline
        mobile-logout-button
      "
      id="mobile-logout-button"
    >
      Logout
    </button>
  `;
}


/* =========================================================
   HEADER
========================================================= */

function renderHeader() {
  const headerRoot =
    document.querySelector(
      "#site-header"
    );


  if (!headerRoot) {
    return;
  }


  headerRoot.innerHTML = `
    <a
      href="#main-content"
      class="skip-link"
    >
      Skip to main content
    </a>


    <header class="site-header">

      <div class="container site-header__inner">

        <a
          href="index.html"
          class="site-brand"
          aria-label="${SITE_CONFIG.name} home"
        >

          <img
            src="${SITE_CONFIG.logo}"
            alt=""
            class="site-brand__logo"
            width="56"
            height="56"
          />

          <span class="site-brand__text">

            <span class="site-brand__name">
              ${SITE_CONFIG.name}
            </span>

            <span class="site-brand__tagline">
              Service • Support • Community
            </span>

          </span>

        </a>


        <nav
          class="site-nav"
          aria-label="Primary navigation"
        >

          <ul class="site-nav__list">
            ${createNavigationLinks(
              "site-nav__link"
            )}
          </ul>

        </nav>


        <div class="site-header__actions">

          <div
            id="desktop-auth-area"
            class="site-header__auth"
          >
            ${createLoggedOutDesktopAuth()}
          </div>


          <a
            href="apply.html"
            class="btn btn--outline"
          >
            Apply for Assistance
          </a>


          <a
            href="donate.html"
            class="btn btn--primary"
          >
            Donate
          </a>

        </div>


        <button
          type="button"
          class="mobile-menu-button"
          id="mobile-menu-button"
          aria-expanded="false"
          aria-controls="mobile-navigation"
          aria-label="Open navigation menu"
        >

          <span
            class="mobile-menu-button__icon"
            aria-hidden="true"
          >
            <span></span>
            <span></span>
            <span></span>
          </span>

        </button>

      </div>


      <div
        class="mobile-navigation"
        id="mobile-navigation"
      >

        <div class="
          container
          mobile-navigation__inner
        ">

          <nav
            aria-label="Mobile navigation"
          >

            <ul class="
              mobile-navigation__list
            ">
              ${createNavigationLinks(
                "mobile-navigation__link"
              )}
            </ul>

          </nav>


          <div
            id="mobile-auth-area"
            class="
              mobile-navigation__actions
              mobile-auth-area
            "
          >

            ${createLoggedOutMobileAuth()}

          </div>


          <div
            class="
              mobile-navigation__primary-actions
            "
          >

            <a
              href="apply.html"
              class="btn btn--outline"
            >
              Apply for Assistance
            </a>


            <a
              href="donate.html"
              class="btn btn--primary"
            >
              Donate
            </a>

          </div>

        </div>

      </div>

    </header>
  `;
}


/* =========================================================
   AUTH NAVBAR RENDERING
========================================================= */

async function renderAuthenticationState() {
  const desktopRoot =
    document.querySelector(
      "#desktop-auth-area"
    );

  const mobileRoot =
    document.querySelector(
      "#mobile-auth-area"
    );


  if (
    !desktopRoot &&
    !mobileRoot
  ) {
    return;
  }


  const user =
    await getCurrentUser();


  if (!user) {

    if (desktopRoot) {
      desktopRoot.innerHTML =
        createLoggedOutDesktopAuth();
    }


    if (mobileRoot) {
      mobileRoot.innerHTML =
        createLoggedOutMobileAuth();
    }


    return;
  }


  if (desktopRoot) {
    desktopRoot.innerHTML =
      createLoggedInDesktopAuth(
        user
      );
  }


  if (mobileRoot) {
    mobileRoot.innerHTML =
      createLoggedInMobileAuth(
        user
      );
  }


  initializeProfileMenu();


  const desktopLogout =
    document.querySelector(
      "#site-logout-button"
    );


  const mobileLogout =
    document.querySelector(
      "#mobile-logout-button"
    );


  desktopLogout?.addEventListener(
    "click",
    logoutCurrentUser
  );


  mobileLogout?.addEventListener(
    "click",
    logoutCurrentUser
  );
}


/* =========================================================
   PROFILE MENU
========================================================= */

function initializeProfileMenu() {
  const profile =
    document.querySelector(
      "#site-profile"
    );

  const button =
    document.querySelector(
      "#site-profile-button"
    );


  if (
    !profile ||
    !button
  ) {
    return;
  }


  function closeProfileMenu() {
    profile.classList.remove(
      "is-open"
    );

    button.setAttribute(
      "aria-expanded",
      "false"
    );
  }


  function toggleProfileMenu() {
    const isOpen =
      profile.classList.contains(
        "is-open"
      );


    if (isOpen) {
      closeProfileMenu();

      return;
    }


    profile.classList.add(
      "is-open"
    );

    button.setAttribute(
      "aria-expanded",
      "true"
    );
  }


  button.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      toggleProfileMenu();
    }
  );


  document.addEventListener(
    "click",
    (event) => {

      if (
        !profile.contains(
          event.target
        )
      ) {
        closeProfileMenu();
      }
    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Escape"
      ) {
        closeProfileMenu();
      }
    }
  );
}


/* =========================================================
   FOOTER
========================================================= */

function renderFooter() {
  const footerRoot =
    document.querySelector(
      "#site-footer"
    );


  if (!footerRoot) {
    return;
  }


  const year =
    new Date().getFullYear();


  footerRoot.innerHTML = `
    <footer class="site-footer">

      <div class="
        container
        site-footer__main
      ">

        <div class="footer-brand">

          <div class="footer-brand__top">

            <img
              src="${SITE_CONFIG.logo}"
              alt=""
              class="footer-brand__logo"
              width="58"
              height="58"
              loading="lazy"
            />


            <div class="footer-brand__name">
              ${SITE_CONFIG.name}
            </div>

          </div>


          <p class="
            footer-brand__description
          ">
            Supporting individuals and families
            through medical assistance, education,
            livelihood opportunities and essential
            travel support.
          </p>

        </div>


        <div class="footer-column">

          <h2 class="footer-column__title">
            Organization
          </h2>


          <ul class="footer-links">

            <li>
              <a
                href="about.html"
                class="footer-link"
              >
                About us
              </a>
            </li>

            <li>
              <a
                href="services.html"
                class="footer-link"
              >
                Our services
              </a>
            </li>

            <li>
              <a
                href="gallery.html"
                class="footer-link"
              >
                Gallery
              </a>
            </li>

            <li>
              <a
                href="contact.html"
                class="footer-link"
              >
                Contact
              </a>
            </li>

          </ul>

        </div>


        <div class="footer-column">

          <h2 class="footer-column__title">
            Assistance
          </h2>


          <ul class="footer-links">

            <li>
              <a
                href="apply.html?service=medical"
                class="footer-link"
              >
                Medical assistance
              </a>
            </li>

            <li>
              <a
                href="apply.html?service=scholarship"
                class="footer-link"
              >
                Education support
              </a>
            </li>

            <li>
              <a
                href="apply.html?service=livelihood"
                class="footer-link"
              >
                Livelihood support
              </a>
            </li>

            <li>
              <a
                href="apply.html?service=travel"
                class="footer-link"
              >
                Travel assistance
              </a>
            </li>

          </ul>

        </div>


        <div class="footer-column">

          <h2 class="footer-column__title">
            Get involved
          </h2>


          <ul class="footer-links">

            <li>
              <a
                href="donate.html"
                class="footer-link"
              >
                Donate
              </a>
            </li>

            <li>
              <a
                href="signup.html"
                class="footer-link"
              >
                Create account
              </a>
            </li>

            <li>
              <a
                href="login.html"
                class="footer-link"
              >
                Login
              </a>
            </li>

            <li>
              <a
                href="contact.html"
                class="footer-link"
              >
                Contact us
              </a>
            </li>

          </ul>

        </div>

      </div>


      <div class="
        container
        site-footer__bottom
      ">

        <p class="
          site-footer__copyright
        ">
          © ${year} ${SITE_CONFIG.name}.
          All rights reserved.
        </p>

        <p class="
          site-footer__note
        ">
          Serving communities with dignity
          and care.
        </p>

      </div>

    </footer>
  `;
}


/* =========================================================
   MOBILE MENU
========================================================= */

function initializeMobileMenu() {
  const button =
    document.querySelector(
      "#mobile-menu-button"
    );

  const navigation =
    document.querySelector(
      "#mobile-navigation"
    );


  if (
    !button ||
    !navigation
  ) {
    return;
  }


  function openMenu() {
    navigation.classList.add(
      "is-open"
    );

    button.setAttribute(
      "aria-expanded",
      "true"
    );

    button.setAttribute(
      "aria-label",
      "Close navigation menu"
    );
  }


  function closeMenu() {
    navigation.classList.remove(
      "is-open"
    );

    button.setAttribute(
      "aria-expanded",
      "false"
    );

    button.setAttribute(
      "aria-label",
      "Open navigation menu"
    );
  }


  function toggleMenu() {
    const isOpen =
      button.getAttribute(
        "aria-expanded"
      ) === "true";


    if (isOpen) {
      closeMenu();

    } else {
      openMenu();
    }
  }


  button.addEventListener(
    "click",
    toggleMenu
  );


  navigation.addEventListener(
    "click",
    (event) => {

      const link =
        event.target.closest(
          "a"
        );


      if (link) {
        closeMenu();
      }
    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Escape"
      ) {
        closeMenu();
      }
    }
  );


  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth >
        920
      ) {
        closeMenu();
      }
    }
  );
}


/* =========================================================
   EXTERNAL LINKS
========================================================= */

function initializeExternalLinks() {
  const links =
    document.querySelectorAll(
      'a[target="_blank"]'
    );


  links.forEach(
    (link) => {

      const currentRel =
        link.getAttribute(
          "rel"
        ) || "";


      if (
        !currentRel.includes(
          "noopener"
        )
      ) {
        link.setAttribute(
          "rel",
          `${
            currentRel
          } noopener noreferrer`
            .trim()
        );
      }
    }
  );
}


/* =========================================================
   INITIALIZE SITE
========================================================= */

async function initializeSite() {
  renderHeader();
  renderFooter();

  initializeMobileMenu();
  initializeExternalLinks();

  await renderAuthenticationState();
}


document.addEventListener(
  "DOMContentLoaded",
  initializeSite
);