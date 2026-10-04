/* =========================================================
   ANJUMAN BASHINDGAN-E-BIHAR
   Admin Portal Frontend

   Admin API endpoints:

   GET   /api/admin/me
   GET   /api/admin/overview

   GET   /api/admin/applications
   GET   /api/admin/applications/:id
   PATCH /api/admin/applications/:id/status

   GET   /api/admin/users
   GET   /api/admin/donations

   POST  /api/auth/logout
========================================================= */


const ADMIN_API_BASE_URL =
  "/api";


const ADMIN_SERVICE_NAMES = {
  MEDICAL: "Medical Assistance",

  SCHOLARSHIP:
    "Scholarship / Education",

  LIVELIHOOD:
    "Livelihood / Work",

  TRAVEL:
    "Travel Assistance",
};


const ADMIN_BRANCH_NAMES = {
  NAGPADA:
    "Nagpada Head Office",

  DHARAVI:
    "Dharavi Branch",
};


const ADMIN_STATUS_NAMES = {
  PENDING:
    "Pending",

  UNDER_REVIEW:
    "Under Review",

  APPROVED:
    "Approved",

  REJECTED:
    "Rejected",

  COMPLETED:
    "Completed",
};


/* =========================================================
   BASIC HELPERS
========================================================= */

function adminGet(id) {
  return document.getElementById(id);
}


function adminText(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function adminFormatDate(value) {
  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }


  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}


function adminFormatCurrency(value) {
  const number =
    Number(value || 0);


  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isNaN(number)
      ? 0
      : number
  );
}


/* =========================================================
   ALERT
========================================================= */

function showAdminAlert(
  message,
  type = "error"
) {
  const alert =
    adminGet("admin-alert");


  if (!alert) {
    return;
  }


  alert.className =
    `application-alert application-alert--${type} is-visible`;


  alert.textContent =
    message;
}


function clearAdminAlert() {
  const alert =
    adminGet("admin-alert");


  if (!alert) {
    return;
  }


  alert.className =
    "application-alert";


  alert.textContent = "";
}


/* =========================================================
   API
========================================================= */

async function adminApi(
  endpoint,
  options = {}
) {
  const config = {
    credentials: "include",
    ...options,
  };


  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    config.headers = {
      "Content-Type":
        "application/json",

      ...(options.headers || {}),
    };
  }


  const response =
    await fetch(
      `${ADMIN_API_BASE_URL}${endpoint}`,
      config
    );


  let data = null;


  try {
    data =
      await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    const error =
      new Error(
        data?.message ||
        "The request could not be completed."
      );


    error.status =
      response.status;


    error.data =
      data;


    throw error;
  }


  return data;
}


/* =========================================================
   AUTHORIZATION
========================================================= */

async function verifyAdminAccess() {
  try {
    const response =
      await adminApi(
        "/auth/me"
      );


    const admin =
      response?.user ||
      response?.admin ||
      response;


    const role =
      admin?.role;


    if (
      role &&
      role !== "ADMIN"
    ) {
      window.location.href =
        "dashboard.html";

      return false;
    }


    const identity =
      adminGet(
        "admin-identity"
      );


    if (
      identity &&
      admin?.name
    ) {
      identity.textContent =
        `${admin.name} • Admin`;
    }


    return true;

  } catch (error) {

    if (
      error instanceof TypeError
    ) {
      showAdminAlert(
        "Unable to connect to the server. Please check your connection and try again.",
        "error"
      );


      return false;
    }


    if (
      error.status === 401
    ) {
      window.location.href =
        "login.html?redirect=admin.html";

      return false;
    }


    if (
      error.status === 403
    ) {
      window.location.href =
        "dashboard.html";

      return false;
    }


    showAdminAlert(
      error.message ||
      "Unable to verify admin access.",
      "error"
    );


    return false;
  }
}


/* =========================================================
   ADMIN NAVIGATION
========================================================= */

function activateAdminView(
  viewName
) {
  document
    .querySelectorAll(
      ".admin-view"
    )
    .forEach((view) => {
      view.classList.toggle(
        "is-active",
        view.id ===
        `admin-view-${viewName}`
      );
    });


  document
    .querySelectorAll(
      "[data-admin-view]"
    )
    .forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.adminView ===
        viewName
      );
    });


  if (
    viewName ===
    "applications"
  ) {
    loadAdminApplications();
  }


  if (
    viewName ===
    "users"
  ) {
    loadAdminUsers();
  }


  if (
    viewName ===
    "donations"
  ) {
    loadAdminDonations();
  }
}


function initializeAdminNavigation() {
  document
    .querySelectorAll(
      "[data-admin-view]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const view =
            button.dataset.adminView;


          if (!view) {
            return;
          }


          activateAdminView(
            view
          );
        }
      );
    });
}


/* =========================================================
   STATUS BADGE
========================================================= */

function adminStatusClass(status) {
  const classes = {
    PENDING:
      "status-badge--pending",

    UNDER_REVIEW:
      "status-badge--review",

    APPROVED:
      "status-badge--approved",

    REJECTED:
      "status-badge--rejected",

    COMPLETED:
      "status-badge--completed",
  };


  return (
    classes[status] ||
    "status-badge--pending"
  );
}


function createAdminStatusBadge(
  status
) {
  const badge =
    document.createElement("span");


  badge.className =
    `status-badge ${adminStatusClass(status)}`;


  badge.textContent =
    ADMIN_STATUS_NAMES[status] ||
    adminText(status);


  return badge;
}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderAdminEmpty(
  container,
  title,
  description
) {
  container.className =
    "admin-empty";


  container.textContent = "";


  const heading =
    document.createElement("h3");


  heading.textContent =
    title;


  const paragraph =
    document.createElement("p");


  paragraph.textContent =
    description;


  container.append(
    heading,
    paragraph
  );
}


/* =========================================================
   OVERVIEW
========================================================= */

function updateOverviewValue(
  id,
  value
) {
  const element =
    adminGet(id);


  if (element) {
    element.textContent =
      String(value ?? 0);
  }
}


function renderAdminOverview(
  data
) {
  const overview =
    data?.overview ||
    data ||
    {};


  const applications =
    overview.applications ||
    {};


  updateOverviewValue(
    "admin-stat-applications",
    applications.total ??
    0
  );


  updateOverviewValue(
    "admin-stat-pending",
    applications.pending ??
    0
  );


  updateOverviewValue(
    "admin-stat-review",
    applications.underReview ??
    0
  );


  updateOverviewValue(
    "admin-stat-approved",
    applications.approved ??
    0
  );


  updateOverviewValue(
    "admin-stat-users",
    overview?.users?.total ??
    0
  );


  const donations =
    adminGet(
      "admin-stat-donations"
    );


  if (donations) {
    donations.textContent =
      adminFormatCurrency(
        overview?.donations
          ?.totalAmount ??
        0
      );
  }


  const donationCount =
    adminGet(
      "admin-stat-donation-count"
    );


  if (donationCount) {
    const count =
      overview?.donations
        ?.verifiedCount ??
      0;


    donationCount.textContent =
      `${count} verified ${count === 1
        ? "transaction"
        : "transactions"
      }`;
  }


  const branches =
    overview.branches ||
    {};


  const nagpada =
    branches.NAGPADA ||
    {};


  const dharavi =
    branches.DHARAVI ||
    {};


  updateOverviewValue(
    "nagpada-total",
    nagpada.total ??
    0
  );


  updateOverviewValue(
    "nagpada-pending",
    nagpada.pending ??
    0
  );


  updateOverviewValue(
    "nagpada-review",
    nagpada.underReview ??
    0
  );


  updateOverviewValue(
    "nagpada-approved",
    nagpada.approved ??
    0
  );


  updateOverviewValue(
    "nagpada-completed",
    nagpada.completed ??
    0
  );


  updateOverviewValue(
    "nagpada-rejected",
    nagpada.rejected ??
    0
  );


  updateOverviewValue(
    "dharavi-total",
    dharavi.total ??
    0
  );


  updateOverviewValue(
    "dharavi-pending",
    dharavi.pending ??
    0
  );


  updateOverviewValue(
    "dharavi-review",
    dharavi.underReview ??
    0
  );


  updateOverviewValue(
    "dharavi-approved",
    dharavi.approved ??
    0
  );


  updateOverviewValue(
    "dharavi-completed",
    dharavi.completed ??
    0
  );


  updateOverviewValue(
    "dharavi-rejected",
    dharavi.rejected ??
    0
  );


  const recent =
    Array.isArray(
      overview.recentApplications
    )
      ? overview.recentApplications
      : [];


  renderRecentApplications(
    recent
  );
}


async function loadAdminOverview() {
  try {
    const response =
      await adminApi(
        "/admin/overview"
      );


    renderAdminOverview(
      response
    );

  } catch (error) {

    const recent =
      adminGet(
        "admin-recent-applications"
      );


    if (
      error instanceof TypeError
    ) {
      if (recent) {
        renderAdminEmpty(
          recent,
          "Unable to load overview",
          "We could not connect to the server. Please refresh and try again."
        );
      }

      return;
    }


    if (
      error.status === 401
    ) {
      window.location.href =
        "login.html?redirect=admin.html";

      return;
    }


    if (
      error.status === 403
    ) {
      window.location.href =
        "dashboard.html";

      return;
    }


    showAdminAlert(
      error.message ||
      "Unable to load the admin overview.",
      "error"
    );
  }
}


/* =========================================================
   TABLE HELPERS
========================================================= */

function createAdminTable(
  headers
) {
  const wrapper =
    document.createElement("div");


  wrapper.className =
    "admin-table-scroll";


  const table =
    document.createElement("table");


  table.className =
    "admin-table";


  const thead =
    document.createElement("thead");


  const row =
    document.createElement("tr");


  headers.forEach(
    (header) => {
      const th =
        document.createElement("th");


      th.textContent =
        header;


      row.append(th);
    }
  );


  thead.append(row);


  const tbody =
    document.createElement("tbody");


  table.append(
    thead,
    tbody
  );


  wrapper.append(table);


  return {
    wrapper,
    tbody,
  };
}


/* =========================================================
   RECENT APPLICATIONS
========================================================= */

function createApplicationTableRow(
  application
) {
  const row =
    document.createElement(
      "tr"
    );


  /* =======================================================
     APPLICANT
  ======================================================= */

  const applicantCell =
    document.createElement(
      "td"
    );


  const applicantName =
    document.createElement(
      "span"
    );


  applicantName.className =
    "admin-table__primary";


  applicantName.textContent =
    adminText(
      application.applicantName
    );


  const reference =
    document.createElement(
      "span"
    );


  reference.className =
    "admin-table__secondary";


  reference.textContent =
    application.referenceNumber ||
    application.id ||
    "—";


  const contact =
    document.createElement(
      "span"
    );


  contact.className =
    "admin-table__contact";


  const contactParts = [
    application.phone,
    application.email,
  ].filter(Boolean);


  contact.textContent =
    contactParts.length
      ? contactParts.join(" • ")
      : "No contact information";


  applicantCell.append(
    applicantName,
    reference,
    contact
  );


  /* =======================================================
     SERVICE
  ======================================================= */

  const serviceCell =
    document.createElement(
      "td"
    );


  const serviceName =
    document.createElement(
      "span"
    );


  serviceName.className =
    "admin-table__primary";


  serviceName.textContent =
    ADMIN_SERVICE_NAMES[
      application.type
    ] ||
    adminText(
      application.type
    );


  serviceCell.append(
    serviceName
  );


  /* =======================================================
     BRANCH
  ======================================================= */

  const branchCell =
    document.createElement(
      "td"
    );


  branchCell.textContent =
    ADMIN_BRANCH_NAMES[
      application.branch
    ] ||
    adminText(
      application.branch
    );


  /* =======================================================
     STATUS
  ======================================================= */

  const statusCell =
    document.createElement(
      "td"
    );


  statusCell.append(
    createAdminStatusBadge(
      application.status
    )
  );


  /* =======================================================
     DATES
  ======================================================= */

  const dateCell =
    document.createElement(
      "td"
    );


  const submitted =
    document.createElement(
      "span"
    );


  submitted.className =
    "admin-table__primary";


  submitted.textContent =
    adminFormatDate(
      application.createdAt
    );


  const updated =
    document.createElement(
      "span"
    );


  updated.className =
    "admin-table__secondary";


  updated.textContent =
    application.updatedAt
      ? `Updated ${adminFormatDate(
          application.updatedAt
        )}`
      : "Not updated";


  dateCell.append(
    submitted,
    updated
  );


  /* =======================================================
     ACTION
  ======================================================= */

  const actionCell =
    document.createElement(
      "td"
    );


  actionCell.className =
    "admin-table__action-cell";


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "admin-table__review-button";


  button.textContent =
    "Review";


  button.setAttribute(
    "aria-label",
    `Review application ${
      application.referenceNumber ||
      application.id ||
      ""
    }`
  );


  button.addEventListener(
    "click",
    () => {
      openAdminApplication(
        application.id
      );
    }
  );


  actionCell.append(
    button
  );


  row.append(
    applicantCell,
    serviceCell,
    branchCell,
    statusCell,
    dateCell,
    actionCell
  );


  return row;
}


/* =========================================================
   APPLICATION TABLE ROW
========================================================= */

function createApplicationTableRow(
  application
) {
  const row =
    document.createElement("tr");


  const applicantCell =
    document.createElement("td");


  const applicantName =
    document.createElement("span");


  applicantName.className =
    "admin-table__primary";


  applicantName.textContent =
    adminText(
      application.applicantName
    );


  const reference =
    document.createElement("span");


  reference.className =
    "admin-table__secondary";


  reference.textContent =
    application.referenceNumber ||
    application.id ||
    "—";


  applicantCell.append(
    applicantName,
    reference
  );


  const serviceCell =
    document.createElement("td");


  serviceCell.textContent =
    ADMIN_SERVICE_NAMES[
    application.type
    ] ||
    adminText(
      application.type
    );


  const branchCell =
    document.createElement("td");


  branchCell.textContent =
    ADMIN_BRANCH_NAMES[
    application.branch
    ] ||
    adminText(
      application.branch
    );


  const statusCell =
    document.createElement("td");


  statusCell.append(
    createAdminStatusBadge(
      application.status
    )
  );


  const dateCell =
    document.createElement("td");


  dateCell.textContent =
    adminFormatDate(
      application.createdAt
    );


  const actionCell =
    document.createElement("td");


  const button =
    document.createElement("button");


  button.type =
    "button";


  button.className =
    "admin-table__action";


  button.textContent =
    "Review";


  button.addEventListener(
    "click",
    () => {
      openAdminApplication(
        application.id
      );
    }
  );


  actionCell.append(button);


  row.append(
    applicantCell,
    serviceCell,
    branchCell,
    statusCell,
    dateCell,
    actionCell
  );


  return row;
}


/* =========================================================
   APPLICATION FILTERS
========================================================= */

function getApplicationFilters() {
  return {
    search:
      adminGet(
        "admin-application-search"
      )?.value.trim() || "",

    branch:
      adminGet(
        "admin-branch-filter"
      )?.value || "",

    type:
      adminGet(
        "admin-service-filter"
      )?.value || "",

    status:
      adminGet(
        "admin-status-filter"
      )?.value || "",
  };
}


function createApplicationQuery() {
  const filters =
    getApplicationFilters();


  const params =
    new URLSearchParams();


  Object.entries(filters)
    .forEach(
      ([key, value]) => {
        if (value) {
          params.set(
            key,
            value
          );
        }
      }
    );


  const query =
    params.toString();


  return query
    ? `?${query}`
    : "";
}


/* =========================================================
   LOAD APPLICATIONS
========================================================= */

async function loadAdminApplications() {
  const root =
    adminGet(
      "admin-applications-root"
    );


  if (!root) {
    return;
  }


  root.className =
    "admin-loading";


  root.textContent =
    "Loading applications...";


  try {
    const response =
      await adminApi(
        `/admin/applications${createApplicationQuery()}`
      );


    const applications =
      Array.isArray(response)
        ? response
        : response?.applications || [];


    renderAdminApplications(
      applications
    );

  } catch (error) {

    if (
      error instanceof TypeError
    ) {
      renderAdminEmpty(
        root,
        "Unable to load applications",
        "We could not connect to the server. Please refresh and try again."
      );

      return;
    }


    if (
      error.status === 401
    ) {
      window.location.href =
        "login.html?redirect=admin.html";

      return;
    }


    if (
      error.status === 403
    ) {
      window.location.href =
        "dashboard.html";

      return;
    }


    renderAdminEmpty(
      root,
      "Unable to load applications",
      error.message
    );
  }
}


function updateAdminApplicationCount(
  count
) {
  const element =
    adminGet(
      "admin-application-filter-count"
    );


  if (!element) {
    return;
  }


  element.textContent =
    `${count} ${count === 1
      ? "application"
      : "applications"
    }`;
}



function renderAdminApplications(
  applications
) {
  const root =
    adminGet(
      "admin-applications-root"
    );


  if (!root) {
    return;
  }

  updateAdminApplicationCount(
    applications.length
  );


  if (!applications.length) {
    renderAdminEmpty(
      root,
      "No matching applications",
      "Try changing your filters or search query."
    );

    return;
  }


  root.className = "";


  root.textContent = "";


  const {
    wrapper,
    tbody,
  } =
    createAdminTable([
      "Applicant",
      "Service",
      "Branch",
      "Status",
      "Dates",
      "Action",
    ]);



  applications.forEach(
    (application) => {
      tbody.append(
        createApplicationTableRow(
          application
        )
      );
    }
  );


  root.append(wrapper);
}




/* =========================================================
   FILTER EVENTS
========================================================= */

function initializeApplicationFilters() {
  const search =
    adminGet(
      "admin-application-search"
    );


  const branch =
    adminGet(
      "admin-branch-filter"
    );


  const service =
    adminGet(
      "admin-service-filter"
    );





    
  const status =
    adminGet(
      "admin-status-filter"
    );


  const clear =
    adminGet(
      "admin-application-clear-filters"
    );


  let searchTimer =
    null;


  /* Search with debounce */

  search?.addEventListener(
    "input",
    () => {
      window.clearTimeout(
        searchTimer
      );


      searchTimer =
        window.setTimeout(
          () => {
            loadAdminApplications();
          },
          350
        );
    }
  );


  /* Escape clears search */

  search?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      search.value =
        "";


      window.clearTimeout(
        searchTimer
      );


      loadAdminApplications();
    }
  );


  /* Dropdown filters */

  [
    branch,
    service,
    status,
  ].forEach(
    (element) => {

      element?.addEventListener(
        "change",
        loadAdminApplications
      );

    }
  );


  /* Clear all filters */

  clear?.addEventListener(
    "click",
    () => {

      if (search) {
        search.value =
          "";
      }


      if (branch) {
        branch.value =
          "";
      }


      if (service) {
        service.value =
          "";
      }


      if (status) {
        status.value =
          "";
      }


      window.clearTimeout(
        searchTimer
      );


      loadAdminApplications();
    }
  );
}

/* =========================================================
   APPLICATION DRAWER
========================================================= */

function openAdminDrawer() {
  const overlay =
    adminGet(
      "admin-application-overlay"
    );


  if (!overlay) {
    return;
  }


  overlay.classList.add(
    "is-open"
  );


  overlay.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";


  adminGet(
    "admin-drawer-close"
  )?.focus();
}


function closeAdminDrawer() {
  const overlay =
    adminGet(
      "admin-application-overlay"
    );


  if (!overlay) {
    return;
  }


  overlay.classList.remove(
    "is-open"
  );


  overlay.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";
}


function initializeAdminDrawer() {
  const overlay =
    adminGet(
      "admin-application-overlay"
    );


  const close =
    adminGet(
      "admin-drawer-close"
    );


  close?.addEventListener(
    "click",
    closeAdminDrawer
  );


  overlay?.addEventListener(
    "click",
    (event) => {
      if (
        event.target === overlay
      ) {
        closeAdminDrawer();
      }
    }
  );


  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape"
      ) {
        closeAdminDrawer();
      }
    }
  );
}


/* =========================================================
   DETAIL FIELD
========================================================= */

function createAdminDetailField(
  label,
  value
) {
  const wrapper =
    document.createElement("div");


  wrapper.className =
    "admin-detail-field";


  const term =
    document.createElement("dt");


  term.textContent =
    label;


  const description =
    document.createElement("dd");


  description.textContent =
    adminText(value);


  wrapper.append(
    term,
    description
  );


  return wrapper;
}


/* =========================================================
   APPLICATION DETAILS
========================================================= */

async function openAdminApplication(
  id
) {
  if (!id) {
    return;
  }


  const body =
    adminGet(
      "admin-drawer-body"
    );


  if (!body) {
    return;
  }


  body.className =
    "admin-drawer__body admin-loading";


  body.textContent =
    "Loading application...";


  openAdminDrawer();


  try {
    const response =
      await adminApi(
        `/admin/applications/${encodeURIComponent(id)}`
      );


    const application =
      response?.application ||
      response;


    renderAdminApplicationDetail(
      application
    );

  } catch (error) {

    body.className =
      "admin-drawer__body";


    if (
      error instanceof TypeError
    ) {
      renderAdminEmpty(
        body,
        "Unable to load application",
        "We could not connect to the server. Please close this panel and try again."
      );

      return;
    }


    renderAdminEmpty(
      body,
      "Unable to load application",
      error.message
    );
  }
}


function renderAdminApplicationDetail(
  application
) {
  const body =
    adminGet(
      "admin-drawer-body"
    );


  const title =
    adminGet(
      "admin-drawer-title"
    );


  const reference =
    adminGet(
      "admin-drawer-reference"
    );


  if (!body) {
    return;
  }


  body.className =
    "admin-drawer__body";


  body.textContent = "";


  if (title) {
    title.textContent =
      ADMIN_SERVICE_NAMES[
      application.type
      ] ||
      "Application Details";
  }


  if (reference) {
    reference.textContent =
      application.referenceNumber ||
      application.id ||
      "Application";
  }


  /* Applicant */

  const applicantSection =
    document.createElement(
      "section"
    );


  applicantSection.className =
    "admin-detail-section";


  const applicantHeading =
    document.createElement("h3");


  applicantHeading.textContent =
    "Applicant information";


  const applicantGrid =
    document.createElement("dl");


  applicantGrid.className =
    "admin-detail-grid";


  applicantGrid.append(
    createAdminDetailField(
      "Full Name",
      application.applicantName
    ),

    createAdminDetailField(
      "Phone",
      application.phone
    ),

    createAdminDetailField(
      "Email",
      application.email
    ),

    createAdminDetailField(
      "Age",
      application.age
    ),

    createAdminDetailField(
      "Address",
      application.address
    ),

    createAdminDetailField(
      "PIN Code",
      application.pincode
    )
  );


  applicantSection.append(
    applicantHeading,
    applicantGrid
  );


  body.append(
    applicantSection
  );


  /* Application */

  const requestSection =
    document.createElement(
      "section"
    );


  requestSection.className =
    "admin-detail-section";


  const requestHeading =
    document.createElement("h3");


  requestHeading.textContent =
    "Application information";


  const requestGrid =
    document.createElement("dl");


  requestGrid.className =
    "admin-detail-grid";


  requestGrid.append(
    createAdminDetailField(
      "Service",
      ADMIN_SERVICE_NAMES[
      application.type
      ] ||
      application.type
    ),

    createAdminDetailField(
      "Branch",
      ADMIN_BRANCH_NAMES[
      application.branch
      ] ||
      application.branch
    ),

    createAdminDetailField(
      "Submitted",
      adminFormatDate(
        application.createdAt
      )
    ),

    createAdminDetailField(
      "Current Status",
      ADMIN_STATUS_NAMES[
      application.status
      ] ||
      application.status
    )
  );


  requestSection.append(
    requestHeading,
    requestGrid
  );


  body.append(
    requestSection
  );


  /* Service details */

  const details =
    application.details || {};


  if (
    Object.keys(details).length
  ) {
    const detailSection =
      document.createElement(
        "section"
      );


    detailSection.className =
      "admin-detail-section";


    const heading =
      document.createElement("h3");


    heading.textContent =
      "Service details";


    const grid =
      document.createElement("dl");


    grid.className =
      "admin-detail-grid";


    Object.entries(details)
      .forEach(
        ([key, value]) => {
          grid.append(
            createAdminDetailField(
              humanizeAdminKey(key),
              formatAdminDetailValue(
                key,
                value
              )
            )
          );
        }
      );


    detailSection.append(
      heading,
      grid
    );


    body.append(
      detailSection
    );
  }


  /* Description */

  const descriptionSection =
    document.createElement(
      "section"
    );


  descriptionSection.className =
    "admin-detail-section";


  const descriptionHeading =
    document.createElement("h3");


  descriptionHeading.textContent =
    "Applicant explanation";


  const description =
    document.createElement("p");


  description.textContent =
    adminText(
      application.description
    );


  descriptionSection.append(
    descriptionHeading,
    description
  );


  body.append(
    descriptionSection
  );


  /* =========================================================
     DOCUMENTS
  ========================================================= */

  const documents =
    Array.isArray(
      application.documents
    )
      ? application.documents
      : [];


  if (
    documents.length
  ) {
    const documentSection =
      document.createElement(
        "section"
      );


    documentSection.className =
      "admin-detail-section";


    const heading =
      document.createElement(
        "h3"
      );


    heading.textContent =
      "Supporting documents";


    const list =
      document.createElement(
        "div"
      );


    list.className =
      "document-list";


    documents.forEach(
      (documentData) => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "document-item";


        const info =
          document.createElement(
            "div"
          );


        const name =
          document.createElement(
            "div"
          );


        name.className =
          "document-item__name";


        name.textContent =
          documentData.originalName;


        const type =
          document.createElement(
            "div"
          );


        type.className =
          "document-item__type";


        type.textContent =
          documentData.type;


        info.append(
          name,
          type
        );


        const download =
          document.createElement(
            "a"
          );


        download.className =
          "btn btn--outline";


        download.href =
          `/api/admin/applications/${encodeURIComponent(
            application.id
          )}/documents/${encodeURIComponent(
            documentData.id
          )}/download`;


        download.textContent =
          "Download";


        item.append(
          info,
          download
        );


        list.append(
          item
        );
      }
    );


    documentSection.append(
      heading,
      list
    );


    body.append(
      documentSection
    );
  }

  /* Status */

  body.append(
    createAdminStatusSection(
      application
    )
  );
}


/* =========================================================
   DETAIL LABELS
========================================================= */

function humanizeAdminKey(key) {
  const labels = {
    hospitalName:
      "Hospital / Clinic",

    estimatedCost:
      "Estimated Treatment Cost",

    medicalCondition:
      "Medical Condition",

    urgency:
      "Urgency",

    institution:
      "Institution",

    course:
      "Course / Class",

    academicYear:
      "Academic Year",

    fees:
      "Fees / Amount Requested",

    employmentStatus:
      "Employment Status",

    monthlyIncome:
      "Monthly Income",

    skills:
      "Skills / Experience",

    supportNeeded:
      "Support Needed",

    origin:
      "Travelling From",

    destination:
      "Destination",

    travelDate:
      "Travel Date",

    passengers:
      "Travellers",

    travelReason:
      "Reason for Travel",
  };


  return (
    labels[key] ||
    key
      .replace(
        /([A-Z])/g,
        " $1"
      )
      .replace(
        /^./,
        (char) =>
          char.toUpperCase()
      )
  );
}


function formatAdminDetailValue(
  key,
  value
) {
  const moneyKeys = [
    "estimatedCost",
    "fees",
    "monthlyIncome",
  ];


  if (
    moneyKeys.includes(key)
  ) {
    return adminFormatCurrency(
      value
    );
  }


  if (
    key === "travelDate"
  ) {
    return adminFormatDate(
      value
    );
  }


  return value;
}


/* =========================================================
   STATUS UPDATE UI
========================================================= */

function createAdminStatusSection(
  application
) {
  const section =
    document.createElement(
      "section"
    );


  section.className =
    "admin-detail-section";


  const heading =
    document.createElement("h3");


  heading.textContent =
    "Manage application status";


  const form =
    document.createElement("form");


  form.className =
    "admin-status-form";


  const select =
    document.createElement("select");


  select.className =
    "admin-filter-control";


  select.setAttribute(
    "aria-label",
    "Application status"
  );


  [
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
  ].forEach((status) => {
    const option =
      document.createElement("option");


    option.value =
      status;


    option.textContent =
      ADMIN_STATUS_NAMES[
      status
      ];


    option.selected =
      application.status ===
      status;


    select.append(option);
  });


  const note =
    document.createElement("textarea");


  note.className =
    "application-control";


  note.rows = 4;


  note.placeholder =
    "Status note visible to applicant (optional)";

  note.setAttribute(
    "aria-label",
    "Status note visible to applicant"
  );


  const actions =
    document.createElement("div");


  actions.className =
    "admin-status-actions";


  const save =
    document.createElement("button");


  save.type =
    "submit";


  save.className =
    "btn btn--primary";


  save.textContent =
    "Save Status";


  actions.append(save);


  form.append(
    select,
    note,
    actions
  );


  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();


      save.disabled = true;


      try {
        await adminApi(
          `/admin/applications/${encodeURIComponent(application.id)}/status`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify({
                status:
                  select.value,

                note:
                  note.value.trim() ||
                  null,
              }),
          }
        );


        showAdminAlert(
          "Application status updated successfully.",
          "success"
        );


        application.status =
          select.value;


        await Promise.all([
          loadAdminOverview(),
          loadAdminApplications(),
        ]);


        closeAdminDrawer();

      } catch (error) {

        if (
          error instanceof TypeError
        ) {
          showAdminAlert(
            "Unable to connect to the server. The application status was not changed.",
            "error"
          );


          return;
        }


        showAdminAlert(
          error.message ||
          "Unable to update application status.",
          "error"
        );

      } finally {
        save.disabled = false;
      }
    }
  );


  section.append(
    heading,
    form
  );


  return section;
}


/* =========================================================
   USERS
========================================================= */

async function loadAdminUsers() {
  const root =
    adminGet(
      "admin-users-root"
    );


  if (!root) {
    return;
  }


  root.className =
    "admin-loading";


  root.textContent =
    "Loading users...";


  try {
    const response =
      await adminApi(
        "/admin/users"
      );


    const users =
      Array.isArray(response)
        ? response
        : response?.users || [];


    renderAdminUsers(
      users
    );

  } catch (error) {

    if (
      error instanceof TypeError
    ) {
      renderAdminEmpty(
        root,
        "Unable to load users",
        "We could not connect to the server. Please refresh and try again."
      );

      return;
    }


    renderAdminEmpty(
      root,
      "Unable to load users",
      error.message
    );
  }
}


function renderAdminUsers(users) {
  const root =
    adminGet(
      "admin-users-root"
    );


  if (!root) {
    return;
  }


  if (!users.length) {
    renderAdminEmpty(
      root,
      "No users found",
      "Registered accounts will appear here."
    );

    return;
  }


  root.className = "";


  root.textContent = "";


  const {
    wrapper,
    tbody,
  } =
    createAdminTable([
      "User",
      "Username",
      "Phone",
      "Role",
      "Joined",
    ]);


  users.forEach((user) => {
    const row =
      document.createElement("tr");


    const userCell =
      document.createElement("td");


    const name =
      document.createElement("span");


    name.className =
      "admin-table__primary";


    name.textContent =
      adminText(user.name);


    const email =
      document.createElement("span");


    email.className =
      "admin-table__secondary";


    email.textContent =
      adminText(user.email);


    userCell.append(
      name,
      email
    );


    const username =
      document.createElement("td");


    username.textContent =
      adminText(
        user.username
      );


    const phone =
      document.createElement("td");


    phone.textContent =
      adminText(
        user.phone
      );


    const roleCell =
      document.createElement("td");


    const role =
      document.createElement("span");


    role.className =
      "admin-user-role";


    role.textContent =
      adminText(
        user.role || "USER"
      );


    roleCell.append(role);


    const created =
      document.createElement("td");


    created.textContent =
      adminFormatDate(
        user.createdAt
      );


    row.append(
      userCell,
      username,
      phone,
      roleCell,
      created
    );


    tbody.append(row);
  });


  root.append(wrapper);
}


/* =========================================================
   DONATIONS
========================================================= */

async function loadAdminDonations() {
  const root =
    adminGet(
      "admin-donations-root"
    );


  if (!root) {
    return;
  }


  root.className =
    "admin-loading";


  root.textContent =
    "Loading donations...";


  try {
    const response =
      await adminApi(
        "/admin/donations"
      );


    const donations =
      Array.isArray(response)
        ? response
        : response?.donations || [];


    renderAdminDonations(
      donations
    );

  } catch (error) {

    if (
      error instanceof TypeError
    ) {
      renderAdminEmpty(
        recent,
        "Unable to load overview",
        "We could not connect to the server. Please refresh and try again."
      );

      return;
    }


    renderAdminEmpty(
      root,
      "Unable to load donations",
      error.message
    );
  }
}


function renderAdminDonations(
  donations
) {
  const root =
    adminGet(
      "admin-donations-root"
    );


  if (!root) {
    return;
  }


  if (!donations.length) {
    renderAdminEmpty(
      root,
      "No donations found",
      "Verified donations will appear here."
    );

    return;
  }


  root.className = "";


  root.textContent = "";


  const {
    wrapper,
    tbody,
  } =
    createAdminTable([
      "Donor",
      "Amount",
      "Method",
      "Status",
      "Date",
    ]);


  donations.forEach(
    (donation) => {
      const row =
        document.createElement("tr");


      const donor =
        document.createElement("td");


      const donorName =
        document.createElement("span");


      donorName.className =
        "admin-table__primary";


      donorName.textContent =
        adminText(
          donation.donorName ||
          donation.name ||
          "Anonymous"
        );


      const donorContact =
        document.createElement("span");


      donorContact.className =
        "admin-table__secondary";


      donorContact.textContent =
        adminText(
          donation.email ||
          donation.phone
        );


      donor.append(
        donorName,
        donorContact
      );


      const amount =
        document.createElement("td");


      amount.className =
        "admin-donation-amount";


      amount.textContent =
        adminFormatCurrency(
          donation.amount
        );


      const method =
        document.createElement("td");


      method.textContent =
        adminText(
          donation.method
        );


      const status =
        document.createElement("td");


      status.textContent =
        adminText(
          donation.status
        );


      const date =
        document.createElement("td");


      date.textContent =
        adminFormatDate(
          donation.createdAt
        );


      row.append(
        donor,
        amount,
        method,
        status,
        date
      );


      tbody.append(row);
    }
  );


  root.append(wrapper);
}


/* =========================================================
   LOGOUT
========================================================= */

function initializeAdminLogout() {
  const button =
    adminGet(
      "admin-logout"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    async () => {
      button.disabled = true;


      try {
        await adminApi(
          "/auth/logout",
          {
            method: "POST",
          }
        );
      } catch {
        /*
          Session may already be expired.
          Redirect regardless.
        */
      } finally {
        window.location.href =
          "login.html";
      }
    }
  );
}


/* =========================================================
   INITIALIZE ADMIN
========================================================= */

async function initializeAdminPortal() {
  initializeAdminNavigation();

  initializeApplicationFilters();

  initializeAdminDrawer();

  initializeAdminLogout();


  const authorized =
    await verifyAdminAccess();


  if (!authorized) {
    return;
  }


  await loadAdminOverview();
}


document.addEventListener(
  "DOMContentLoaded",
  initializeAdminPortal
);


