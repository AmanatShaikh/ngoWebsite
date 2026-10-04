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

const ADMIN_STATUS_TRANSITIONS = {
  PENDING: [
    "UNDER_REVIEW",
    "REJECTED",
  ],

  UNDER_REVIEW: [
    "APPROVED",
    "REJECTED",
  ],

  APPROVED: [
    "COMPLETED",
  ],

  REJECTED: [],

  COMPLETED: [],
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


function renderAdminLoading(
  root,
  message = "Loading..."
) {
  if (!root) {
    return;
  }

  root.className =
    "admin-state admin-state--loading";

  root.textContent = "";

  const text =
    document.createElement(
      "p"
    );

  text.textContent =
    message;

  root.append(text);
}


function renderAdminError(
  root,
  {
    title =
    "Something went wrong",

    message =
    "Unable to load this information.",

    retry = null,
  } = {}
) {
  if (!root) {
    return;
  }

  root.className =
    "admin-state admin-state--error";

  root.textContent = "";

  const heading =
    document.createElement(
      "strong"
    );

  heading.className =
    "admin-state__title";

  heading.textContent =
    title;


  const description =
    document.createElement(
      "p"
    );

  description.className =
    "admin-state__message";

  description.textContent =
    message;


  root.append(
    heading,
    description
  );


  if (
    typeof retry ===
    "function"
  ) {
    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "btn btn--outline admin-state__action";

    button.textContent =
      "Try Again";

    button.addEventListener(
      "click",
      retry
    );

    root.append(button);
  }
}


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
    `Review application ${application.referenceNumber ||
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


  renderAdminLoading(
    root,
    "Loading applications..."
  );


  try {
    const response =
      await adminApi(
        `/admin/applications${createApplicationQuery()}`
      );


    const applications =
      Array.isArray(response)
        ? response
        : response?.applications ||
          [];


    renderAdminApplications(
      applications
    );

  } catch (error) {

    updateAdminApplicationCount(
      0
    );


    if (
      error instanceof TypeError
    ) {
      renderAdminError(
        root,
        {
          title:
            "Unable to load applications",

          message:
            "We could not connect to the server. Check your connection and try again.",

          retry:
            loadAdminApplications,
        }
      );

      return;
    }


    renderAdminError(
      root,
      {
        title:
          "Unable to load applications",

        message:
          error.message ||
          "Something went wrong while loading applications.",

        retry:
          loadAdminApplications,
      }
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

function renderRecentApplications(
  applications
) {
  const root =
    adminGet(
      "admin-recent-applications"
    );


  if (!root) {
    return;
  }


  if (
    !Array.isArray(
      applications
    ) ||
    !applications.length
  ) {
    renderAdminEmpty(
      root,
      "No recent applications",
      "New assistance applications will appear here."
    );

    return;
  }


  root.className =
    "";


  root.textContent =
    "";


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


  root.append(
    wrapper
  );
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

function adminFormatFileSize(
  bytes
) {
  const size =
    Number(bytes);


  if (
    !Number.isFinite(size) ||
    size <= 0
  ) {
    return "Size unavailable";
  }


  if (size < 1024) {
    return `${size} B`;
  }


  if (
    size <
    1024 * 1024
  ) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }


  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


function getAdminDocumentFileLabel(
  documentData
) {
  const mimeType =
    documentData?.mimeType ||
    "";


  const fileName =
    documentData
      ?.originalName
      ?.toLowerCase() ||
    "";


  if (
    mimeType.includes("pdf") ||
    fileName.endsWith(".pdf")
  ) {
    return "PDF";
  }


  if (
    mimeType.includes("png") ||
    fileName.endsWith(".png")
  ) {
    return "PNG";
  }


  if (
    mimeType.includes("jpeg") ||
    mimeType.includes("jpg") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg")
  ) {
    return "JPG";
  }


  return "FILE";
}


function getAdminDocumentTypeLabel(
  type
) {
  const labels = {
    IDENTITY:
      "Identity Document",

    SUPPORTING:
      "Supporting Document",

    MEDICAL:
      "Medical Document",

    EDUCATION:
      "Education Document",

    INCOME:
      "Income Document",

    TRAVEL:
      "Travel Document",

    OTHER:
      "Other Document",
  };


  return (
    labels[type] ||
    "Document"
  );
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


  openAdminDrawer();


  renderAdminLoading(
    body,
    "Loading application details..."
  );


  try {
    const response =
      await adminApi(
        `/admin/applications/${encodeURIComponent(
          id
        )}`
      );


    const application =
      response?.application ||
      response;


    renderAdminApplicationDetail(
      application
    );

  } catch (error) {

    renderAdminError(
      body,
      {
        title:
          "Unable to load application",

        message:
          error instanceof TypeError
            ? "We could not connect to the server."
            : error.message ||
              "Something went wrong while loading this application.",

        retry: () => {
          openAdminApplication(
            id
          );
        },
      }
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


  body.textContent =
    "";


  /* =======================================================
     DRAWER HEADER
  ======================================================= */

  if (title) {
    title.textContent =
      ADMIN_SERVICE_NAMES[
      application.type
      ] ||
      application.type ||
      "Application Details";
  }


  if (reference) {
    reference.textContent =
      application.referenceNumber ||
      application.id ||
      "Application";
  }


  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary =
    document.createElement(
      "div"
    );


  summary.className =
    "admin-detail-summary";


  const summaryStatus =
    document.createElement(
      "div"
    );


  summaryStatus.className =
    "admin-detail-summary__status";


  summaryStatus.append(
    createAdminStatusBadge(
      application.status
    )
  );


  const summaryMeta =
    document.createElement(
      "div"
    );


  summaryMeta.className =
    "admin-detail-summary__meta";


  const branchSummary =
    document.createElement(
      "span"
    );


  branchSummary.textContent =
    ADMIN_BRANCH_NAMES[
    application.branch
    ] ||
    application.branch ||
    "—";


  const submittedSummary =
    document.createElement(
      "span"
    );


  submittedSummary.textContent =
    `Submitted ${adminFormatDate(
      application.createdAt
    )}`;


  summaryMeta.append(
    branchSummary,
    submittedSummary
  );


  summary.append(
    summaryStatus,
    summaryMeta
  );


  body.append(
    summary
  );


  /* =======================================================
     APPLICANT INFORMATION
  ======================================================= */

  const applicantSection =
    document.createElement(
      "section"
    );


  applicantSection.className =
    "admin-detail-section";


  const applicantHeading =
    document.createElement(
      "h3"
    );


  applicantHeading.textContent =
    "Applicant information";


  const applicantGrid =
    document.createElement(
      "dl"
    );


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
      "City",
      application.city
    ),


    createAdminDetailField(
      "PIN Code",
      application.pincode
    ),


    createAdminDetailField(
      "Account Username",
      application.user
        ?.username
    )
  );


  applicantSection.append(
    applicantHeading,
    applicantGrid
  );


  body.append(
    applicantSection
  );


  /* =======================================================
     APPLICATION INFORMATION
  ======================================================= */

  const requestSection =
    document.createElement(
      "section"
    );


  requestSection.className =
    "admin-detail-section";


  const requestHeading =
    document.createElement(
      "h3"
    );


  requestHeading.textContent =
    "Application information";


  const requestGrid =
    document.createElement(
      "dl"
    );


  requestGrid.className =
    "admin-detail-grid";


  requestGrid.append(
    createAdminDetailField(
      "Reference",
      application.referenceNumber
    ),


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
      "Last Updated",
      adminFormatDate(
        application.updatedAt
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


  /* =======================================================
     SERVICE DETAILS
  ======================================================= */

  const details =
    application.details ||
    {};


  if (
    Object.keys(
      details
    ).length
  ) {
    const detailSection =
      document.createElement(
        "section"
      );


    detailSection.className =
      "admin-detail-section";


    const heading =
      document.createElement(
        "h3"
      );


    heading.textContent =
      "Service details";


    const grid =
      document.createElement(
        "dl"
      );


    grid.className =
      "admin-detail-grid";


    Object.entries(
      details
    ).forEach(
      ([key, value]) => {

        grid.append(
          createAdminDetailField(
            humanizeAdminKey(
              key
            ),

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


  /* =======================================================
     APPLICATION DESCRIPTION
  ======================================================= */

  const descriptionSection =
    document.createElement(
      "section"
    );


  descriptionSection.className =
    "admin-detail-section";


  const descriptionHeading =
    document.createElement(
      "h3"
    );


  descriptionHeading.textContent =
    "Application description";


  const description =
    document.createElement(
      "p"
    );


  description.textContent =
    application.description ||
    "No description provided.";


  descriptionSection.append(
    descriptionHeading,
    description
  );


  body.append(
    descriptionSection
  );


  /* =======================================================
     DOCUMENTS
  ======================================================= */

  const documentsSection =
    document.createElement(
      "section"
    );


  documentsSection.className =
    "admin-detail-section";


  const documents =
    Array.isArray(
      application.documents
    )
      ? application.documents
      : [];


  const documentsHeader =
    document.createElement(
      "div"
    );


  documentsHeader.className =
    "documents-header";


  const documentsHeadingWrap =
    document.createElement(
      "div"
    );


  const documentsHeading =
    document.createElement(
      "h3"
    );


  documentsHeading.textContent =
    "Supporting documents";


  const documentsDescription =
    document.createElement(
      "p"
    );


  documentsDescription.className =
    "documents-header__description";


  documentsDescription.textContent =
    "Documents uploaded with this application.";


  documentsHeadingWrap.append(
    documentsHeading,
    documentsDescription
  );


  const documentCount =
    document.createElement(
      "span"
    );


  documentCount.className =
    "documents-count";


  documentCount.textContent =
    `${documents.length} ${documents.length === 1
      ? "file"
      : "files"
    }`;


  documentsHeader.append(
    documentsHeadingWrap,
    documentCount
  );


  documentsSection.append(
    documentsHeader
  );


  if (!documents.length) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "documents-empty";


    const emptyTitle =
      document.createElement(
        "strong"
      );


    emptyTitle.textContent =
      "No documents attached";


    const emptyText =
      document.createElement(
        "p"
      );


    emptyText.textContent =
      "The applicant did not upload any documents with this request.";


    empty.append(
      emptyTitle,
      emptyText
    );


    documentsSection.append(
      empty
    );

  } else {

    const documentList =
      document.createElement(
        "div"
      );


    documentList.className =
      "document-list";


    documents.forEach(
      (documentData) => {

        const item =
          document.createElement(
            "article"
          );


        item.className =
          "document-card";


        /* File type */

        const fileBadge =
          document.createElement(
            "div"
          );


        fileBadge.className =
          "document-card__type";


        fileBadge.textContent =
          getAdminDocumentFileLabel(
            documentData
          );


        /* Information */

        const info =
          document.createElement(
            "div"
          );


        info.className =
          "document-card__info";


        const name =
          document.createElement(
            "strong"
          );


        name.className =
          "document-card__name";


        name.textContent =
          documentData.originalName ||
          "Uploaded document";


        name.title =
          documentData.originalName ||
          "Uploaded document";


        const meta =
          document.createElement(
            "div"
          );


        meta.className =
          "document-card__meta";


        const documentType =
          document.createElement(
            "span"
          );


        documentType.textContent =
          getAdminDocumentTypeLabel(
            documentData.type
          );


        const separator =
          document.createElement(
            "span"
          );


        separator.textContent =
          "•";


        separator.setAttribute(
          "aria-hidden",
          "true"
        );


        const fileSize =
          document.createElement(
            "span"
          );


        fileSize.textContent =
          adminFormatFileSize(
            documentData.size
          );


        meta.append(
          documentType,
          separator,
          fileSize
        );


        info.append(
          name,
          meta
        );


        /* Download */

        const actions =
          document.createElement(
            "div"
          );


        actions.className =
          "document-card__actions";


        const download =
          document.createElement(
            "a"
          );


        download.className =
          "btn btn--outline document-download-button";


        download.href =
          `/api/admin/applications/${encodeURIComponent(
            application.id
          )}/documents/${encodeURIComponent(
            documentData.id
          )}/download`;


        download.textContent =
          "Download";


        download.setAttribute(
          "aria-label",
          `Download ${documentData.originalName ||
          "document"
          }`
        );


        actions.append(
          download
        );


        item.append(
          fileBadge,
          info,
          actions
        );


        documentList.append(
          item
        );

      }
    );


    documentsSection.append(
      documentList
    );
  }


  body.append(
    documentsSection
  );


  /* =======================================================
     STATUS HISTORY
  ======================================================= */

  const historySection =
    document.createElement(
      "section"
    );


  historySection.className =
    "admin-detail-section";


  const historyHeading =
    document.createElement(
      "h3"
    );


  historyHeading.textContent =
    "Status history";


  const timeline =
    document.createElement(
      "div"
    );


  timeline.className =
    "status-timeline";


  const statusHistory =
    Array.isArray(
      application.statusHistory
    )
      ? [
        ...application.statusHistory,
      ]
      : [];


  statusHistory.sort(
    (a, b) =>
      new Date(
        a.createdAt ||
        0
      ) -
      new Date(
        b.createdAt ||
        0
      )
  );


  if (
    !statusHistory.length
  ) {
    const empty =
      document.createElement(
        "p"
      );


    empty.className =
      "status-timeline__empty";


    empty.textContent =
      "No status history is available.";


    timeline.append(
      empty
    );

  } else {

    statusHistory.forEach(
      (
        history,
        index
      ) => {

        const isCurrent =
          index ===
          statusHistory.length - 1;


        const item =
          document.createElement(
            "article"
          );


        item.className =
          `status-timeline__item ${isCurrent
            ? "is-current"
            : "is-complete"
          }`;


        /* Marker */

        const marker =
          document.createElement(
            "div"
          );


        marker.className =
          "status-timeline__marker";


        marker.textContent =
          isCurrent
            ? "●"
            : "✓";


        /* Content */

        const content =
          document.createElement(
            "div"
          );


        content.className =
          "status-timeline__content";


        const heading =
          document.createElement(
            "div"
          );


        heading.className =
          "status-timeline__heading";


        const statusName =
          document.createElement(
            "strong"
          );


        statusName.textContent =
          ADMIN_STATUS_NAMES[
          history.toStatus
          ] ||
          history.toStatus ||
          "Status update";


        heading.append(
          statusName
        );


        if (isCurrent) {

          const currentBadge =
            document.createElement(
              "span"
            );


          currentBadge.className =
            "status-timeline__current";


          currentBadge.textContent =
            "Current";


          heading.append(
            currentBadge
          );
        }


        content.append(
          heading
        );


        /* Transition */

        if (
          history.fromStatus
        ) {
          const transition =
            document.createElement(
              "p"
            );


          transition.className =
            "admin-status-transition";


          transition.textContent =
            `${ADMIN_STATUS_NAMES[
            history.fromStatus
            ] ||
            history.fromStatus} → ${ADMIN_STATUS_NAMES[
            history.toStatus
            ] ||
            history.toStatus
            }`;


          content.append(
            transition
          );
        }


        /* Note */

        if (
          history.note
        ) {
          const note =
            document.createElement(
              "p"
            );


          note.className =
            "status-timeline__note";


          note.textContent =
            history.note;


          content.append(
            note
          );
        }


        /* Meta */

        const meta =
          document.createElement(
            "span"
          );


        meta.className =
          "status-timeline__date";


        const changedBy =
          history.changedBy
            ?.name ||
          history.changedBy
            ?.username ||
          null;


        meta.textContent =
          changedBy
            ? `${adminFormatDate(
              history.createdAt
            )} • Updated by ${changedBy}`
            : adminFormatDate(
              history.createdAt
            );


        content.append(
          meta
        );


        item.append(
          marker,
          content
        );


        timeline.append(
          item
        );

      }
    );
  }


  historySection.append(
    historyHeading,
    timeline
  );


  body.append(
    historySection
  );


  /* =======================================================
     STATUS MANAGEMENT
  ======================================================= */

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
    document.createElement(
      "h3"
    );


  heading.textContent =
    "Manage application status";


  /* =======================================================
     CURRENT STATUS
  ======================================================= */

  const current =
    document.createElement(
      "div"
    );


  current.className =
    "admin-status-current";


  const currentLabel =
    document.createElement(
      "span"
    );


  currentLabel.textContent =
    "Current status";


  const currentBadge =
    createAdminStatusBadge(
      application.status
    );


  current.append(
    currentLabel,
    currentBadge
  );


  section.append(
    heading,
    current
  );


  /* =======================================================
     ALLOWED TRANSITIONS
  ======================================================= */

  const allowedStatuses =
    ADMIN_STATUS_TRANSITIONS[
    application.status
    ] ||
    [];


  /*
   * REJECTED and COMPLETED are terminal.
   */

  if (!allowedStatuses.length) {
    const terminal =
      document.createElement(
        "div"
      );


    terminal.className =
      "admin-status-terminal";


    const terminalTitle =
      document.createElement(
        "strong"
      );


    terminalTitle.textContent =
      "No further status changes";


    const terminalText =
      document.createElement(
        "p"
      );


    terminalText.textContent =
      application.status ===
        "COMPLETED"
        ? "This application has been completed and the workflow is closed."
        : "This application has been rejected and the workflow is closed.";


    terminal.append(
      terminalTitle,
      terminalText
    );


    section.append(
      terminal
    );


    return section;
  }


  /* =======================================================
     FORM
  ======================================================= */

  const form =
    document.createElement(
      "form"
    );


  form.className =
    "admin-status-form";


  /* Status label */

  const statusLabel =
    document.createElement(
      "label"
    );


  statusLabel.className =
    "admin-status-label";


  statusLabel.textContent =
    "New status";


  /* Status select */

  const select =
    document.createElement(
      "select"
    );


  select.className =
    "admin-filter-control";


  select.setAttribute(
    "aria-label",
    "New application status"
  );


  const placeholder =
    document.createElement(
      "option"
    );


  placeholder.value =
    "";


  placeholder.textContent =
    "Select next status";


  placeholder.disabled =
    true;


  placeholder.selected =
    true;


  select.append(
    placeholder
  );


  allowedStatuses.forEach(
    (status) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        status;


      option.textContent =
        ADMIN_STATUS_NAMES[
        status
        ] ||
        status;


      select.append(
        option
      );

    }
  );


  /* Note label */

  const noteLabel =
    document.createElement(
      "label"
    );


  noteLabel.className =
    "admin-status-label";


  noteLabel.textContent =
    "Status note visible to applicant";


  /* Note textarea */

  const note =
    document.createElement(
      "textarea"
    );


  note.className =
    "application-control";


  note.rows =
    4;


  note.placeholder =
    "Add a clear update for the applicant (optional unless rejecting).";


  note.setAttribute(
    "aria-label",
    "Status note visible to applicant"
  );


  /* Hint */

  const hint =
    document.createElement(
      "p"
    );


  hint.className =
    "admin-status-hint";


  hint.textContent =
    "Select the next status. A note is required when rejecting an application.";


  /* Actions */

  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "admin-status-actions";


  const save =
    document.createElement(
      "button"
    );


  save.type =
    "submit";


  save.className =
    "btn btn--primary";


  save.textContent =
    "Update Status";


  save.disabled =
    true;


  actions.append(
    save
  );


  form.append(
    statusLabel,
    select,
    noteLabel,
    note,
    hint,
    actions
  );


  /* =======================================================
     SELECTION BEHAVIOUR
  ======================================================= */

  select.addEventListener(
    "change",
    () => {

      const selectedStatus =
        select.value;


      save.disabled =
        !selectedStatus;


      const rejection =
        selectedStatus ===
        "REJECTED";


      note.required =
        rejection;


      hint.textContent =
        rejection
          ? "A note is required because this rejection reason will be shown to the applicant."
          : "The note is optional and will be visible to the applicant.";

    }
  );


  /* =======================================================
     SUBMIT
  ======================================================= */

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();


      const nextStatus =
        select.value;


      const noteValue =
        note.value.trim();


      if (!nextStatus) {
        showAdminAlert(
          "Select the next application status.",
          "error"
        );


        select.focus();


        return;
      }


      if (
        nextStatus ===
        "REJECTED" &&
        !noteValue
      ) {
        showAdminAlert(
          "Enter a reason before rejecting the application.",
          "error"
        );


        note.focus();


        return;
      }


      save.disabled =
        true;


      try {
        await adminApi(
          `/admin/applications/${encodeURIComponent(
            application.id
          )}/status`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify({
                status:
                  nextStatus,

                note:
                  noteValue ||
                  null,
              }),
          }
        );


        showAdminAlert(
          "Application status updated successfully.",
          "success"
        );


        /*
         * Refresh dashboard/table first.
         */
        await Promise.all([
          loadAdminOverview(),
          loadAdminApplications(),
        ]);


        /*
         * Reload the same drawer so the admin
         * immediately sees:
         *
         * - new status
         * - new history event
         * - new allowed transition
         */
        await openAdminApplication(
          application.id
        );

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
        save.disabled =
          false;
      }
    }
  );


  section.append(
    form
  );


  return section;
}


/* =========================================================
   USERS
========================================================= */

function getAdminUserFilters() {
  return {
    search:
      adminGet(
        "admin-user-search"
      )
        ?.value
        ?.trim() ||
      "",

    role:
      adminGet(
        "admin-user-role-filter"
      )
        ?.value ||
      "",

    status:
      adminGet(
        "admin-user-status-filter"
      )
        ?.value ||
      "",
  };
}


function updateAdminUserCount(
  count
) {
  const element =
    adminGet(
      "admin-user-filter-count"
    );


  if (!element) {
    return;
  }


  element.textContent =
    `${count} ${count === 1
      ? "user"
      : "users"
    }`;
}


async function loadAdminUsers() {
  const root =
    adminGet(
      "admin-users-root"
    );


  if (!root) {
    return;
  }


  renderAdminLoading(
    root,
    "Loading users..."
  );


  const {
    search,
    role,
    status,
  } =
    getAdminUserFilters();


  const params =
    new URLSearchParams();


  if (search) {
    params.set(
      "search",
      search
    );
  }


  if (role) {
    params.set(
      "role",
      role
    );
  }


  if (status) {
    params.set(
      "status",
      status
    );
  }


  const query =
    params.toString();


  try {
    const response =
      await adminApi(
        `/admin/users${query
          ? `?${query}`
          : ""
        }`
      );


    const users =
      Array.isArray(response)
        ? response
        : response?.users ||
        [];


    updateAdminUserCount(
      users.length
    );


    renderAdminUsers(
      users
    );

  } catch (error) {
    updateAdminUserCount(
      0
    );

    renderAdminError(
      root,
      {
        title:
          "Unable to load users",

        message:
          error instanceof TypeError
            ? "We could not connect to the server. Check your connection and try again."
            : error.message ||
            "Something went wrong while loading users.",

        retry:
          loadAdminUsers,
      }
    );
  }
}


function renderAdminUsers(
  users
) {
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
      "No registered accounts match the selected filters."
    );

    return;
  }


  root.className =
    "";


  root.textContent =
    "";


  const {
    wrapper,
    tbody,
  } =
    createAdminTable([
      "User",
      "Phone",
      "Role",
      "Account",
      "Applications",
      "Donations",
      "Joined",
      "Action",
    ]);


  users.forEach(
    (user) => {

      const row =
        document.createElement(
          "tr"
        );


      /* USER */

      const userCell =
        document.createElement(
          "td"
        );


      const name =
        document.createElement(
          "span"
        );


      name.className =
        "admin-table__primary";


      name.textContent =
        adminText(
          user.name
        );


      const email =
        document.createElement(
          "span"
        );


      email.className =
        "admin-table__secondary";


      email.textContent =
        adminText(
          user.email
        );


      const username =
        document.createElement(
          "span"
        );


      username.className =
        "admin-table__secondary";


      username.textContent =
        user.username
          ? `@${user.username}`
          : "—";


      userCell.append(
        name,
        email,
        username
      );


      /* PHONE */

      const phone =
        document.createElement(
          "td"
        );


      phone.textContent =
        adminText(
          user.phone
        );


      /* ROLE */

      const roleCell =
        document.createElement(
          "td"
        );


      const role =
        document.createElement(
          "span"
        );


      role.className =
        `admin-user-role ${user.role ===
          "ADMIN"
          ? "admin-user-role--admin"
          : ""
        }`;


      role.textContent =
        user.role ===
          "ADMIN"
          ? "Admin"
          : "User";


      roleCell.append(
        role
      );


      /* ACCOUNT STATUS */

      const statusCell =
        document.createElement(
          "td"
        );


      const accountStatus =
        document.createElement(
          "span"
        );


      accountStatus.className =
        `admin-user-status ${user.isActive
          ? "is-active"
          : "is-disabled"
        }`;


      accountStatus.textContent =
        user.isActive
          ? "Active"
          : "Disabled";


      statusCell.append(
        accountStatus
      );


      /* APPLICATION COUNT */

      const applications =
        document.createElement(
          "td"
        );


      applications.textContent =
        String(
          user._count
            ?.applications ??
          0
        );


      /* DONATION COUNT */

      const donations =
        document.createElement(
          "td"
        );


      donations.textContent =
        String(
          user._count
            ?.donations ??
          0
        );


      /* JOINED */

      const created =
        document.createElement(
          "td"
        );


      created.textContent =
        adminFormatDate(
          user.createdAt
        );


      /* ACTION */

      const actionCell =
        document.createElement(
          "td"
        );


      actionCell.className =
        "admin-table__action-cell";


      if (
        user.role ===
        "ADMIN"
      ) {
        const protectedText =
          document.createElement(
            "span"
          );


        protectedText.className =
          "admin-user-protected";


        protectedText.textContent =
          "Protected";


        actionCell.append(
          protectedText
        );

      } else {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          user.isActive
            ? "btn btn--outline admin-user-toggle admin-user-toggle--disable"
            : "btn btn--outline admin-user-toggle admin-user-toggle--enable";


        button.textContent =
          user.isActive
            ? "Disable"
            : "Activate";


        button.addEventListener(
          "click",
          async () => {

            const nextActive =
              !user.isActive;


            const confirmed =
              window.confirm(
                nextActive
                  ? `Activate ${user.name}'s account?`
                  : `Disable ${user.name}'s account? They will no longer be able to access protected pages.`
              );


            if (!confirmed) {
              return;
            }


            button.disabled =
              true;


            try {
              await adminApi(
                `/admin/users/${encodeURIComponent(
                  user.id
                )}/status`,
                {
                  method:
                    "PATCH",

                  body:
                    JSON.stringify({
                      isActive:
                        nextActive,
                    }),
                }
              );


              showAdminAlert(
                nextActive
                  ? "User account activated successfully."
                  : "User account disabled successfully.",
                "success"
              );


              await loadAdminUsers();

            } catch (error) {

              showAdminAlert(
                error.message ||
                "Unable to update user account.",
                "error"
              );


              button.disabled =
                false;
            }
          }
        );


        actionCell.append(
          button
        );
      }


      row.append(
        userCell,
        phone,
        roleCell,
        statusCell,
        applications,
        donations,
        created,
        actionCell
      );


      tbody.append(
        row
      );
    }
  );


  root.append(
    wrapper
  );
}


function initializeUserFilters() {
  const search =
    adminGet(
      "admin-user-search"
    );


  const role =
    adminGet(
      "admin-user-role-filter"
    );


  const status =
    adminGet(
      "admin-user-status-filter"
    );


  const clear =
    adminGet(
      "admin-user-clear-filters"
    );


  let timer =
    null;


  search?.addEventListener(
    "input",
    () => {
      window.clearTimeout(
        timer
      );


      timer =
        window.setTimeout(
          loadAdminUsers,
          350
        );
    }
  );


  search?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }


      search.value =
        "";


      window.clearTimeout(
        timer
      );


      loadAdminUsers();
    }
  );


  [
    role,
    status,
  ].forEach(
    (element) => {
      element?.addEventListener(
        "change",
        loadAdminUsers
      );
    }
  );


  clear?.addEventListener(
    "click",
    () => {

      if (search) {
        search.value =
          "";
      }


      if (role) {
        role.value =
          "";
      }


      if (status) {
        status.value =
          "";
      }


      window.clearTimeout(
        timer
      );


      loadAdminUsers();
    }
  );
}



/* =========================================================
   DONATIONS
========================================================= */

const ADMIN_DONATION_STATUS_NAMES = {
  PENDING:
    "Pending",

  VERIFIED:
    "Verified",

  FAILED:
    "Failed",

  REFUNDED:
    "Refunded",
};


const ADMIN_DONATION_METHOD_NAMES = {
  UPI:
    "UPI",

  RAZORPAY:
    "Razorpay",
};


function getAdminDonationFilters() {
  return {
    search:
      adminGet(
        "admin-donation-search"
      )
        ?.value
        ?.trim() ||
      "",

    method:
      adminGet(
        "admin-donation-method-filter"
      )
        ?.value ||
      "",

    status:
      adminGet(
        "admin-donation-status-filter"
      )
        ?.value ||
      "",
  };
}


function updateAdminDonationCount(
  count
) {
  const element =
    adminGet(
      "admin-donation-filter-count"
    );


  if (!element) {
    return;
  }


  element.textContent =
    `${count} ${count === 1
      ? "donation"
      : "donations"
    }`;
}


function createAdminDonationStatusBadge(
  status
) {
  const badge =
    document.createElement(
      "span"
    );


  badge.className =
    `admin-donation-status admin-donation-status--${String(
      status ||
      "unknown"
    ).toLowerCase()
    }`;


  badge.textContent =
    ADMIN_DONATION_STATUS_NAMES[
    status
    ] ||
    adminText(
      status
    );


  return badge;
}


async function loadAdminDonations() {
  const root =
    adminGet(
      "admin-donations-root"
    );


  if (!root) {
    return;
  }


renderAdminLoading(
  root,
  "Loading donations..."
);


  const {
    search,
    method,
    status,
  } =
    getAdminDonationFilters();


  const params =
    new URLSearchParams();


  if (search) {
    params.set(
      "search",
      search
    );
  }


  if (method) {
    params.set(
      "method",
      method
    );
  }


  if (status) {
    params.set(
      "status",
      status
    );
  }


  const query =
    params.toString();


  try {
    const response =
      await adminApi(
        `/admin/donations${query
          ? `?${query}`
          : ""
        }`
      );


    const donations =
      Array.isArray(response)
        ? response
        : response?.donations ||
        [];


    updateAdminDonationCount(
      donations.length
    );


    renderAdminDonations(
      donations
    );

  } catch (error) {
  updateAdminDonationCount(
    0
  );

  renderAdminError(
    root,
    {
      title:
        "Unable to load donations",

      message:
        error instanceof TypeError
          ? "We could not connect to the server. Check your connection and try again."
          : error.message ||
            "Something went wrong while loading donations.",

      retry:
        loadAdminDonations,
    }
  );
}
}


async function updateAdminUpiDonation(
  donation,
  nextStatus,
  button
) {
  const actionName =
    nextStatus ===
      "VERIFIED"
      ? "verify"
      : "mark as failed";


  const confirmed =
    window.confirm(
      `Are you sure you want to ${actionName} this ${adminFormatCurrency(
        donation.amount
      )} UPI donation?`
    );


  if (!confirmed) {
    return;
  }


  button.disabled =
    true;


  try {
    await adminApi(
      `/admin/donations/${encodeURIComponent(
        donation.id
      )}/status`,
      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            status:
              nextStatus,
          }),
      }
    );


    showAdminAlert(
      nextStatus ===
        "VERIFIED"
        ? "UPI donation verified successfully."
        : "UPI donation marked as failed.",
      "success"
    );


    await Promise.all([
      loadAdminDonations(),
      loadAdminOverview(),
    ]);

  } catch (error) {

    showAdminAlert(
      error.message ||
      "Unable to update the donation.",
      "error"
    );


    button.disabled =
      false;
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
      "No donation records match the selected filters."
    );


    return;
  }


  root.className =
    "";


  root.textContent =
    "";


  const {
    wrapper,
    tbody,
  } =
    createAdminTable([
      "Donor",
      "Amount",
      "Method",
      "Transaction",
      "Status",
      "Date",
      "Action",
    ]);


  donations.forEach(
    (donation) => {

      const row =
        document.createElement(
          "tr"
        );


      /* =====================================================
         DONOR
      ===================================================== */

      const donor =
        document.createElement(
          "td"
        );


      const donorName =
        document.createElement(
          "span"
        );


      donorName.className =
        "admin-table__primary";


      donorName.textContent =
        adminText(
          donation.donorName ||
          donation.user?.name ||
          "Anonymous"
        );


      const donorContact =
        document.createElement(
          "span"
        );


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


      /* =====================================================
         AMOUNT
      ===================================================== */

      const amount =
        document.createElement(
          "td"
        );


      amount.className =
        "admin-donation-amount";


      amount.textContent =
        adminFormatCurrency(
          donation.amount
        );


      /* =====================================================
         METHOD
      ===================================================== */

      const method =
        document.createElement(
          "td"
        );


      const methodBadge =
        document.createElement(
          "span"
        );


      methodBadge.className =
        `admin-donation-method admin-donation-method--${String(
          donation.method
        ).toLowerCase()
        }`;


      methodBadge.textContent =
        ADMIN_DONATION_METHOD_NAMES[
        donation.method
        ] ||
        adminText(
          donation.method
        );


      method.append(
        methodBadge
      );


      /* =====================================================
         TRANSACTION REFERENCE
      ===================================================== */

      const transaction =
        document.createElement(
          "td"
        );


      const transactionValue =
        document.createElement(
          "span"
        );


      transactionValue.className =
        "admin-table__primary admin-donation-reference";


      const transactionLabel =
        document.createElement(
          "span"
        );


      transactionLabel.className =
        "admin-table__secondary";


      if (
        donation.method ===
        "UPI"
      ) {
        transactionValue.textContent =
          adminText(
            donation.upiReference
          );


        transactionLabel.textContent =
          "UPI reference";

      } else {

        transactionValue.textContent =
          adminText(
            donation.razorpayPaymentId ||
            donation.razorpayOrderId
          );


        transactionLabel.textContent =
          donation.razorpayPaymentId
            ? "Razorpay payment ID"
            : "Razorpay order ID";
      }


      transaction.append(
        transactionValue,
        transactionLabel
      );


      /* =====================================================
         STATUS
      ===================================================== */

      const status =
        document.createElement(
          "td"
        );


      status.append(
        createAdminDonationStatusBadge(
          donation.status
        )
      );


      /* =====================================================
         DATE
      ===================================================== */

      const date =
        document.createElement(
          "td"
        );


      date.textContent =
        adminFormatDate(
          donation.createdAt
        );


      /* =====================================================
         ACTIONS
      ===================================================== */

      const action =
        document.createElement(
          "td"
        );


      action.className =
        "admin-table__action-cell";


      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "admin-donation-actions";


      if (
        donation.method ===
        "UPI" &&
        donation.status ===
        "PENDING"
      ) {
        const verify =
          document.createElement(
            "button"
          );


        verify.type =
          "button";


        verify.className =
          "btn btn--primary admin-donation-action";


        verify.textContent =
          "Verify";


        verify.addEventListener(
          "click",
          () => {
            updateAdminUpiDonation(
              donation,
              "VERIFIED",
              verify
            );
          }
        );


        const fail =
          document.createElement(
            "button"
          );


        fail.type =
          "button";


        fail.className =
          "btn btn--outline admin-donation-action";


        fail.textContent =
          "Mark Failed";


        fail.addEventListener(
          "click",
          () => {
            updateAdminUpiDonation(
              donation,
              "FAILED",
              fail
            );
          }
        );


        actions.append(
          verify,
          fail
        );

      } else if (
        donation.method ===
        "UPI" &&
        donation.status ===
        "FAILED"
      ) {
        const verify =
          document.createElement(
            "button"
          );


        verify.type =
          "button";


        verify.className =
          "btn btn--primary admin-donation-action";


        verify.textContent =
          "Verify";


        verify.addEventListener(
          "click",
          () => {
            updateAdminUpiDonation(
              donation,
              "VERIFIED",
              verify
            );
          }
        );


        actions.append(
          verify
        );

      } else {

        const locked =
          document.createElement(
            "span"
          );


        locked.className =
          "admin-donation-locked";


        locked.textContent =
          donation.method ===
            "RAZORPAY"
            ? "Automatic"
            : "Final";


        actions.append(
          locked
        );
      }


      action.append(
        actions
      );


      row.append(
        donor,
        amount,
        method,
        transaction,
        status,
        date,
        action
      );


      tbody.append(
        row
      );
    }
  );


  root.append(
    wrapper
  );
}


function initializeDonationFilters() {
  const search =
    adminGet(
      "admin-donation-search"
    );


  const method =
    adminGet(
      "admin-donation-method-filter"
    );


  const status =
    adminGet(
      "admin-donation-status-filter"
    );


  const clear =
    adminGet(
      "admin-donation-clear-filters"
    );


  let timer =
    null;


  search?.addEventListener(
    "input",
    () => {

      window.clearTimeout(
        timer
      );


      timer =
        window.setTimeout(
          loadAdminDonations,
          350
        );
    }
  );


  search?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }


      search.value =
        "";


      window.clearTimeout(
        timer
      );


      loadAdminDonations();
    }
  );


  [
    method,
    status,
  ].forEach(
    (element) => {

      element?.addEventListener(
        "change",
        loadAdminDonations
      );

    }
  );


  clear?.addEventListener(
    "click",
    () => {

      if (search) {
        search.value =
          "";
      }


      if (method) {
        method.value =
          "";
      }


      if (status) {
        status.value =
          "";
      }


      window.clearTimeout(
        timer
      );


      loadAdminDonations();
    }
  );
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

  initializeUserFilters();

  initializeDonationFilters();

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


