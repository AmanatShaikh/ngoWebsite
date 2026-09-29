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
   HEADER
========================================================= */

function renderHeader() {
  const headerRoot = document.querySelector("#site-header");

  if (!headerRoot) {
    return;
  }

  headerRoot.innerHTML = `
    <a href="#main-content" class="skip-link">
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
            ${createNavigationLinks("site-nav__link")}
          </ul>
        </nav>


        <div class="site-header__actions">

          <a
            href="login.html"
            class="site-header__login"
          >
            Login
          </a>

          <a
            href="apply.html"
            class="btn btn--outline"
          >
            Request Assistance
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
        <div class="container mobile-navigation__inner">

          <nav aria-label="Mobile navigation">

            <ul class="mobile-navigation__list">
              ${createNavigationLinks(
                "mobile-navigation__link"
              )}
            </ul>

          </nav>


          <div class="mobile-navigation__actions">

            <a
              href="login.html"
              class="btn btn--secondary"
            >
              Login
            </a>

            <a
              href="apply.html"
              class="btn btn--outline"
            >
              Request Assistance
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
   FOOTER
========================================================= */

function renderFooter() {
  const footerRoot = document.querySelector("#site-footer");

  if (!footerRoot) {
    return;
  }

  const year = new Date().getFullYear();

  footerRoot.innerHTML = `
    <footer class="site-footer">

      <div class="container site-footer__main">

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


          <p class="footer-brand__description">
            Supporting individuals and families through
            medical assistance, education, livelihood
            opportunities and essential travel support.
          </p>

        </div>


        <div class="footer-column">

          <h2 class="footer-column__title">
            Organization
          </h2>

          <ul class="footer-links">

            <li>
              <a href="about.html" class="footer-link">
                About us
              </a>
            </li>

            <li>
              <a href="services.html" class="footer-link">
                Our services
              </a>
            </li>

            <li>
              <a href="gallery.html" class="footer-link">
                Gallery
              </a>
            </li>

            <li>
              <a href="contact.html" class="footer-link">
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
              <a href="donate.html" class="footer-link">
                Donate
              </a>
            </li>

            <li>
              <a href="signup.html" class="footer-link">
                Create account
              </a>
            </li>

            <li>
              <a href="login.html" class="footer-link">
                Login
              </a>
            </li>

            <li>
              <a href="contact.html" class="footer-link">
                Contact us
              </a>
            </li>

          </ul>

        </div>

      </div>


      <div class="container site-footer__bottom">

        <p class="site-footer__copyright">
          © ${year} ${SITE_CONFIG.name}.
          All rights reserved.
        </p>

        <p class="site-footer__note">
          Serving communities with dignity and care.
        </p>

      </div>

    </footer>
  `;
}


/* =========================================================
   MOBILE MENU
========================================================= */

function initializeMobileMenu() {
  const button = document.querySelector(
    "#mobile-menu-button"
  );

  const navigation = document.querySelector(
    "#mobile-navigation"
  );

  if (!button || !navigation) {
    return;
  }


  function openMenu() {
    navigation.classList.add("is-open");

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
    navigation.classList.remove("is-open");

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
      button.getAttribute("aria-expanded") ===
      "true";

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
      const link = event.target.closest("a");

      if (link) {
        closeMenu();
      }
    }
  );


  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    }
  );


  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 920) {
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

  links.forEach((link) => {
    const currentRel =
      link.getAttribute("rel") || "";

    if (!currentRel.includes("noopener")) {
      link.setAttribute(
        "rel",
        `${currentRel} noopener noreferrer`.trim()
      );
    }
  });
}


/* =========================================================
   INITIALIZE SITE
========================================================= */

function initializeSite() {
  renderHeader();
  renderFooter();

  initializeMobileMenu();
  initializeExternalLinks();
}


document.addEventListener(
  "DOMContentLoaded",
  initializeSite
);

