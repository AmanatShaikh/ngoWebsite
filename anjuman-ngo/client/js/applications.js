/* =========================================================
   ANJUMAN BASHINDGAN-E-BIHAR
   Application Portal Frontend

   Backend endpoints expected later:

   POST /api/applications
   GET  /api/applications/my
   GET  /api/applications/:id

   POST /api/auth/logout
========================================================= */


const APPLICATION_API_BASE_URL =
  "/api";


const SERVICE_NAMES = {
  MEDICAL: "Medical Assistance",
  SCHOLARSHIP: "Scholarship / Education Support",
  LIVELIHOOD: "Livelihood / Work Support",
  TRAVEL: "Travel Assistance",
};


const BRANCH_NAMES = {
  NAGPADA: "Nagpada Head Office",
  DHARAVI: "Dharavi Branch",
};


const STATUS_NAMES = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

const STATUS_DESCRIPTIONS = {
  PENDING:
    "Your application has been submitted and is waiting for review.",

  UNDER_REVIEW:
    "Your application is currently being reviewed by the organization.",

  APPROVED:
    "Your application has been approved.",

  COMPLETED:
    "Your assistance request has been completed.",

  REJECTED:
    "Your application was not approved. Review the latest update for more information.",
};

let dashboardApplications =
  [];


/* =========================================================
   BASIC HELPERS
========================================================= */


async function requireUserSession() {
  try {
    const response =
      await fetch(
        "/api/auth/me",
        {
          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        }
      );


    if (!response.ok) {
      throw new Error(
        "Unauthenticated"
      );
    }


    const data =
      await response.json();


    return (
      data?.user ||
      null
    );

  } catch {
    const currentPage =
      window.location.pathname
        .split("/")
        .pop() ||
      "dashboard.html";


    const redirect =
      currentPage +
      window.location.search;


    window.location.href =
      `login.html?redirect=${encodeURIComponent(
        redirect
      )}`;


    return null;
  }
}


function appGetElement(id) {
  return document.getElementById(id);
}


function escapeText(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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


function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(number);
}


function updateDashboardUser(
  user
) {
  if (!user) {
    return;
  }


  const displayName =
    user.fullName ||
    user.name ||
    user.username ||
    "Member";


  const username =
    user.username ||
    "—";


  const email =
    user.email ||
    "—";


  const initial =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "M";


  const welcomeName =
    appGetElement(
      "dashboard-user-name"
    );


  const profileName =
    appGetElement(
      "dashboard-profile-name"
    );


  const profileUsername =
    appGetElement(
      "dashboard-profile-username"
    );


  const profileEmail =
    appGetElement(
      "dashboard-profile-email"
    );


  const profileAvatar =
    appGetElement(
      "dashboard-profile-avatar"
    );


  if (welcomeName) {
    welcomeName.textContent =
      displayName;
  }


  if (profileName) {
    profileName.textContent =
      displayName;
  }


  if (profileUsername) {
    profileUsername.textContent =
      username;
  }


  if (profileEmail) {
    profileEmail.textContent =
      email;
  }


  if (profileAvatar) {
    profileAvatar.textContent =
      initial;
  }
}


/* =========================================================
   ALERT
========================================================= */

function showApplicationAlert(
  message,
  type = "error"
) {
  const alert =
    appGetElement(
      "application-alert"
    );

  if (!alert) {
    return;
  }

  alert.className =
    `application-alert application-alert--${type} is-visible`;

  alert.textContent = message;
}


function clearApplicationAlert() {
  const alert =
    appGetElement(
      "application-alert"
    );

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

async function applicationApi(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${APPLICATION_API_BASE_URL}${endpoint}`,
    {
      credentials: "include",
      ...options,
    }
  );


  let data = null;


  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    const error = new Error(
      data?.message ||
      "The request could not be completed."
    );

    error.status = response.status;

    error.data = data;

    throw error;
  }


  return data;
}


/* =========================================================
   STATUS
========================================================= */

function getStatusClass(status) {
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


function createStatusBadge(status) {
  const badge =
    document.createElement("span");

  badge.className =
    `status-badge ${getStatusClass(status)}`;

  badge.textContent =
    STATUS_NAMES[status] || status || "Pending";

  return badge;
}


/* =========================================================
   FIELD ERRORS
========================================================= */

function setApplicationFieldError(
  input,
  message
) {
  if (!input) {
    return;
  }


  input.setAttribute(
    "aria-invalid",
    "true"
  );


  const error =
    appGetElement(
      `${input.id}-error`
    );


  if (error) {
    error.textContent = message;

    error.classList.add(
      "is-visible"
    );
  }
}


function clearApplicationFieldError(
  input
) {
  if (!input) {
    return;
  }


  input.removeAttribute(
    "aria-invalid"
  );


  const error =
    appGetElement(
      `${input.id}-error`
    );


  if (error) {
    error.textContent = "";

    error.classList.remove(
      "is-visible"
    );
  }
}


/* =========================================================
   SELECT SERVICE FROM URL
========================================================= */

function getServiceFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );


  const service =
    params
      .get("service")
      ?.toUpperCase();


  const mapping = {
    MEDICAL: "MEDICAL",
    SCHOLARSHIP: "SCHOLARSHIP",
    EDUCATION: "SCHOLARSHIP",
    LIVELIHOOD: "LIVELIHOOD",
    TRAVEL: "TRAVEL",
  };


  return mapping[service] || null;
}


/* =========================================================
   SERVICE FORM VISIBILITY
========================================================= */

function updateServiceFields(
  serviceType
) {
  const groups =
    document.querySelectorAll(
      "[data-service-fields]"
    );


  groups.forEach((group) => {
    const matches =
      group.dataset.serviceFields ===
      serviceType;


    group.classList.toggle(
      "is-active",
      matches
    );
  });
}


/* =========================================================
   SERVICE SELECTION
========================================================= */

function initializeServiceSelection() {
  const serviceInputs =
    document.querySelectorAll(
      'input[name="serviceType"]'
    );


  if (!serviceInputs.length) {
    return;
  }


  const initialService =
    getServiceFromUrl();


  if (initialService) {
    const input =
      document.querySelector(
        `input[name="serviceType"][value="${initialService}"]`
      );


    if (input) {
      input.checked = true;

      updateServiceFields(
        initialService
      );
    }
  }


  serviceInputs.forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        if (!input.checked) {
          return;
        }


        updateServiceFields(
          input.value
        );


        const error =
          appGetElement(
            "service-type-error"
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
   FILE DISPLAY
========================================================= */

function initializeFileInputs() {
  const configurations = [
    {
      input:
        "identity-document",

      output:
        "identity-document-name",
    },

    {
      input:
        "supporting-document",

      output:
        "supporting-document-name",
    },
  ];


  configurations.forEach(
    ({ input, output }) => {
      const inputElement =
        appGetElement(input);

      const outputElement =
        appGetElement(output);


      if (
        !inputElement ||
        !outputElement
      ) {
        return;
      }


      inputElement.addEventListener(
        "change",
        () => {
          const file =
            inputElement.files?.[0];


          outputElement.textContent =
            file
              ? file.name
              : "";
        }
      );
    }
  );
}


/* =========================================================
   INPUT NORMALIZATION
========================================================= */

function initializeApplicationInputs() {
  const phone =
    appGetElement(
      "applicant-phone"
    );

  const pincode =
    appGetElement(
      "applicant-pincode"
    );


  phone?.addEventListener(
    "input",
    () => {
      phone.value =
        phone.value
          .replace(/\D/g, "")
          .slice(0, 10);
    }
  );


  pincode?.addEventListener(
    "input",
    () => {
      pincode.value =
        pincode.value
          .replace(/\D/g, "")
          .slice(0, 6);
    }
  );


  document
    .querySelectorAll(
      ".application-control"
    )
    .forEach((input) => {
      input.addEventListener(
        "input",
        () => {
          clearApplicationFieldError(
            input
          );
        }
      );


      input.addEventListener(
        "change",
        () => {
          clearApplicationFieldError(
            input
          );
        }
      );
    });
}


/* =========================================================
   VALIDATION
========================================================= */

function validateApplicationForm() {
  let valid = true;


  clearApplicationAlert();


  const serviceInput =
    document.querySelector(
      'input[name="serviceType"]:checked'
    );


  const serviceError =
    appGetElement(
      "service-type-error"
    );


  if (!serviceInput) {
    if (serviceError) {
      serviceError.textContent =
        "Select an assistance type.";

      serviceError.classList.add(
        "is-visible"
      );
    }

    valid = false;
  }


  const requiredIds = [
    "application-branch",
    "applicant-name",
    "applicant-phone",
    "applicant-address",
    "application-description",
  ];


  requiredIds.forEach((id) => {
    const field =
      appGetElement(id);

    if (!field) {
      return;
    }


    clearApplicationFieldError(
      field
    );


    if (!field.value.trim()) {
      setApplicationFieldError(
        field,
        "This field is required."
      );

      valid = false;
    }
  });


  const phone =
    appGetElement(
      "applicant-phone"
    );


  if (
    phone?.value &&
    !/^[6-9]\d{9}$/.test(
      phone.value
    )
  ) {
    setApplicationFieldError(
      phone,
      "Enter a valid 10-digit Indian mobile number."
    );

    valid = false;
  }


  const email =
    appGetElement(
      "applicant-email"
    );


  if (
    email?.value &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.value
    )
  ) {
    setApplicationFieldError(
      email,
      "Enter a valid email address."
    );

    valid = false;
  }


  const selectedService =
    serviceInput?.value;


  if (selectedService) {
    const serviceRequired =
      document.querySelectorAll(
        `[data-service-required="${selectedService}"]`
      );


    serviceRequired.forEach(
      (field) => {
        if (!field.value.trim()) {
          field.setAttribute(
            "aria-invalid",
            "true"
          );

          valid = false;
        }
      }
    );
  }


  const consent =
    appGetElement(
      "application-consent"
    );


  const consentError =
    appGetElement(
      "application-consent-error"
    );


  if (consentError) {
    consentError.textContent = "";

    consentError.classList.remove(
      "is-visible"
    );
  }


  if (!consent?.checked) {
    if (consentError) {
      consentError.textContent =
        "You must confirm the declaration before submitting.";

      consentError.classList.add(
        "is-visible"
      );
    }

    valid = false;
  }


  if (!valid) {
    showApplicationAlert(
      "Please check the highlighted fields before submitting.",
      "error"
    );


    const firstInvalid =
      document.querySelector(
        '[aria-invalid="true"]'
      );


    firstInvalid?.focus();
  }


  return valid;
}


/* =========================================================
   SERVICE DETAILS
========================================================= */

function collectServiceDetails(
  serviceType
) {
  const container =
    document.querySelector(
      `[data-service-fields="${serviceType}"]`
    );


  if (!container) {
    return {};
  }


  const details = {};


  container
    .querySelectorAll(
      "[data-detail]"
    )
    .forEach((field) => {
      const key =
        field.dataset.detail;

      const value =
        field.value.trim();


      if (value !== "") {
        details[key] = value;
      }
    });


  return details;
}


/* =========================================================
   APPLICATION FORM DATA
========================================================= */

function createApplicationFormData() {
  const serviceType =
    document.querySelector(
      'input[name="serviceType"]:checked'
    ).value;


  const formData =
    new FormData();


  formData.append(
    "type",
    serviceType
  );


  formData.append(
    "branch",
    appGetElement(
      "application-branch"
    ).value
  );


  formData.append(
    "applicantName",
    appGetElement(
      "applicant-name"
    ).value.trim()
  );


  formData.append(
    "phone",
    appGetElement(
      "applicant-phone"
    ).value.trim()
  );


  formData.append(
    "email",
    appGetElement(
      "applicant-email"
    ).value.trim()
  );


  formData.append(
    "age",
    appGetElement(
      "applicant-age"
    ).value
  );


  formData.append(
    "address",
    appGetElement(
      "applicant-address"
    ).value.trim()
  );


  formData.append(
    "city",
    appGetElement(
      "applicant-city"
    ).value.trim()
  );


  formData.append(
    "pincode",
    appGetElement(
      "applicant-pincode"
    ).value.trim()
  );


  formData.append(
    "description",
    appGetElement(
      "application-description"
    ).value.trim()
  );


  formData.append(
    "details",
    JSON.stringify(
      collectServiceDetails(
        serviceType
      )
    )
  );


  const identityDocument =
    appGetElement(
      "identity-document"
    )?.files?.[0];


  if (identityDocument) {
    formData.append(
      "identityDocument",
      identityDocument
    );
  }


  const supportingDocument =
    appGetElement(
      "supporting-document"
    )?.files?.[0];


  if (supportingDocument) {
    formData.append(
      "supportingDocument",
      supportingDocument
    );
  }


  return formData;
}


/* =========================================================
   SUBMIT LOADING
========================================================= */

function setApplicationLoading(
  button,
  loading
) {
  if (!button) {
    return;
  }


  button.disabled = loading;


  button.classList.toggle(
    "is-loading",
    loading
  );
}


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

function initializeApplicationForm() {
  const form =
    appGetElement(
      "application-form"
    );


  if (!form) {
    return;
  }


  const submit =
    appGetElement(
      "application-submit"
    );


  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();


      if (!validateApplicationForm()) {
        return;
      }


      setApplicationLoading(
        submit,
        true
      );


      try {
        const formData =
          createApplicationFormData();


        const response =
          await applicationApi(
            "/applications",
            {
              method: "POST",
              body: formData,
            }
          );


        const application =
          response?.application ||
          response;


        const applicationId =
          application?.id;


        showApplicationAlert(
          "Your application has been submitted successfully.",
          "success"
        );


        if (applicationId) {
          window.setTimeout(
            () => {
              window.location.href =
                `application.html?id=${encodeURIComponent(applicationId)}`;
            },
            700
          );

          return;
        }


        window.setTimeout(
          () => {
            window.location.href =
              "dashboard.html";
          },
          700
        );

      } catch (error) {

        if (
          error instanceof TypeError
        ) {
          showApplicationAlert(
            "The backend server is not running yet. Your application form is ready, but submissions will become active when the Express API is connected.",
            "info"
          );

          return;
        }


        if (error.status === 401) {
          window.location.href =
            `login.html?redirect=${encodeURIComponent(window.location.href)}`;

          return;
        }


        showApplicationAlert(
          error.message ||
          "Unable to submit the application.",
          "error"
        );

      } finally {
        setApplicationLoading(
          submit,
          false
        );
      }
    }
  );
}


/* =========================================================
   DASHBOARD EMPTY STATE
========================================================= */

function renderDashboardEmpty(
  container
) {
  container.textContent = "";


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "dashboard-empty";


  const content =
    document.createElement("div");


  const mark =
    document.createElement("div");

  mark.className =
    "dashboard-empty__mark";

  mark.textContent = "+";


  const title =
    document.createElement("h3");

  title.textContent =
    "No applications yet";


  const description =
    document.createElement("p");

  description.textContent =
    "When you submit an assistance request, it will appear here with its current review status.";


  const link =
    document.createElement("a");

  link.href =
    "apply.html";

  link.className =
    "btn btn--primary";

  link.textContent =
    "Submit Your First Application";


  content.append(
    mark,
    title,
    description,
    link
  );


  wrapper.append(content);

  container.append(wrapper);
}


function renderPortalError(
  container,
  {
    title = "Something went wrong",
    message = "We could not load this information.",
    retry = null,
  } = {}
) {
  if (!container) {
    return;
  }


  container.textContent = "";


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "portal-state portal-state--error";


  const mark =
    document.createElement(
      "div"
    );


  mark.className =
    "portal-state__mark";


  mark.textContent =
    "!";


  const heading =
    document.createElement(
      "h3"
    );


  heading.textContent =
    title;


  const description =
    document.createElement(
      "p"
    );


  description.textContent =
    message;


  wrapper.append(
    mark,
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
      "btn btn--outline";


    button.textContent =
      "Try Again";


    button.addEventListener(
      "click",
      retry
    );


    wrapper.append(
      button
    );
  }


  container.append(
    wrapper
  );
}

/* =========================================================
   DASHBOARD FILTERING
========================================================= */

function getDashboardFilteredApplications() {
  const search =
    appGetElement("dashboard-search")
      ?.value
      .trim()
      .toLowerCase() || "";

  const status =
    appGetElement("dashboard-status-filter")
      ?.value || "";

  const service =
    appGetElement("dashboard-service-filter")
      ?.value || "";

  const branch =
    appGetElement("dashboard-branch-filter")
      ?.value || "";


  return dashboardApplications.filter(
    (application) => {

      const serviceName =
        SERVICE_NAMES[application.type] ||
        application.type ||
        "";


      const searchableText = [
        application.referenceNumber,
        serviceName,
        application.applicantName,
        application.type,
        application.branch,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !search ||
        searchableText.includes(search);


      const matchesStatus =
        !status ||
        application.status === status;


      const matchesService =
        !service ||
        application.type === service;


      const matchesBranch =
        !branch ||
        application.branch === branch;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesService &&
        matchesBranch
      );
    }
  );
}


function updateDashboardFilterCount(
  visible,
  total
) {
  const element =
    appGetElement(
      "dashboard-filter-count"
    );


  if (!element) {
    return;
  }


  if (visible === total) {
    element.textContent =
      `${total} ${total === 1
        ? "application"
        : "applications"
      }`;

    return;
  }


  element.textContent =
    `${visible} of ${total} applications`;
}


function renderDashboardFilteredApplications() {
  const filtered =
    getDashboardFilteredApplications();
  updateDashboardStatSelection();


  updateDashboardFilterCount(
    filtered.length,
    dashboardApplications.length
  );


  if (
    dashboardApplications.length === 0
  ) {
    renderApplicationList([]);

    return;
  }


  if (filtered.length === 0) {
    const container =
      appGetElement(
        "dashboard-applications"
      );


    if (!container) {
      return;
    }


    container.innerHTML = `
      <div class="dashboard-filter-empty">

        <h3>
          No matching applications
        </h3>

        <p>
          Try changing your search or filters.
        </p>

      </div>
    `;


    return;
  }


  renderApplicationList(
    filtered
  );
}


function updateDashboardStatSelection() {
  const status =
    appGetElement(
      "dashboard-status-filter"
    )?.value || "";


  document
    .querySelectorAll(
      "[data-dashboard-status]"
    )
    .forEach(
      (card) => {

        card.classList.toggle(
          "is-active",
          card.dataset.dashboardStatus ===
          status
        );

      }
    );
}


function initializeDashboardFilters() {
  const search =
    appGetElement(
      "dashboard-search"
    );


  const status =
    appGetElement(
      "dashboard-status-filter"
    );


  const service =
    appGetElement(
      "dashboard-service-filter"
    );


  const branch =
    appGetElement(
      "dashboard-branch-filter"
    );


  const clear =
    appGetElement(
      "dashboard-clear-filters"
    );


  const statCards =
    document.querySelectorAll(
      "[data-dashboard-status]"
    );


  search?.addEventListener(
    "input",
    () => {
      renderDashboardFilteredApplications();
    }
  );


  status?.addEventListener(
    "change",
    () => {
      renderDashboardFilteredApplications();
    }
  );


  service?.addEventListener(
    "change",
    () => {
      renderDashboardFilteredApplications();
    }
  );


  branch?.addEventListener(
    "change",
    () => {
      renderDashboardFilteredApplications();
    }
  );


  clear?.addEventListener(
    "click",
    () => {

      if (search) {
        search.value = "";
      }


      if (status) {
        status.value = "";
      }


      if (service) {
        service.value = "";
      }


      if (branch) {
        branch.value = "";
      }


      renderDashboardFilteredApplications();
    }
  );


  statCards.forEach(
    (card) => {

      const applyStatusFilter =
        () => {

          const selectedStatus =
            card.dataset.dashboardStatus ||
            "";


          if (status) {
            status.value =
              selectedStatus;
          }


          renderDashboardFilteredApplications();
        };


      card.addEventListener(
        "click",
        applyStatusFilter
      );


      card.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();

            applyStatusFilter();
          }

        }
      );

    }
  );
}


/* =========================================================
   DASHBOARD LIST
========================================================= */

function renderApplicationList(
  applications
) {
  const container =
    appGetElement(
      "dashboard-applications"
    );


  if (!container) {
    return;
  }


  if (!applications.length) {
    renderDashboardEmpty(
      container
    );

    return;
  }


  container.textContent = "";


  const list =
    document.createElement("div");

  list.className =
    "application-list";


  const header =
    document.createElement("div");

  header.className =
    "application-row application-row--header";


  [
    "Application",
    "Branch",
    "Submitted",
    "Status",
    "",
  ].forEach((label) => {
    const element =
      document.createElement("div");

    element.textContent = label;

    header.append(element);
  });


  list.append(header);


  applications.forEach(
    (application) => {
      const row =
        document.createElement("div");

      row.className =
        "application-row";


      const titleCell =
        document.createElement("div");


      const title =
        document.createElement("div");

      title.className =
        "application-row__title";

      title.textContent =
        SERVICE_NAMES[
        application.type
        ] ||
        application.type ||
        "Application";


      const reference =
        document.createElement("span");

      reference.className =
        "application-row__meta";

      reference.textContent =
        application.referenceNumber ||
        `ID: ${application.id}`;


      titleCell.append(
        title,
        reference
      );


      const branch =
        document.createElement("div");

      branch.className =
        "application-row__value";

      branch.textContent =
        BRANCH_NAMES[
        application.branch
        ] ||
        application.branch ||
        "—";


      const date =
        document.createElement("div");

      date.className =
        "application-row__value";

      date.textContent =
        formatDate(
          application.createdAt
        );


      const statusCell =
        document.createElement("div");

      statusCell.append(
        createStatusBadge(
          application.status
        )
      );


      const action =
        document.createElement("a");

      action.className =
        "application-row__action";

      action.href =
        `application.html?id=${encodeURIComponent(application.id)}`;

      action.textContent =
        "View";


      row.append(
        titleCell,
        branch,
        date,
        statusCell,
        action
      );


      list.append(row);
    }
  );


  container.append(list);
}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateDashboardStats(
  applications = []
) {
  const list =
    Array.isArray(applications)
      ? applications
      : [];


  const counts = {
    total: list.length,
    pending: 0,
    review: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  };


  list.forEach(
    (application) => {

      switch (
      application.status
      ) {

        case "PENDING":
          counts.pending += 1;
          break;


        case "UNDER_REVIEW":
          counts.review += 1;
          break;


        case "APPROVED":
          counts.approved += 1;
          break;


        case "COMPLETED":
          counts.completed += 1;
          break;


        case "REJECTED":
          counts.rejected += 1;
          break;

      }

    }
  );


  const values = {
    "stat-total":
      counts.total,

    "stat-pending":
      counts.pending,

    "stat-review":
      counts.review,

    "stat-approved":
      counts.approved,

    "stat-completed":
      counts.completed,

    "stat-rejected":
      counts.rejected,
  };


  Object.entries(
    values
  ).forEach(
    ([id, value]) => {

      const element =
        appGetElement(id);


      if (element) {
        element.textContent =
          String(value);
      }

    }
  );
}

/* =========================================================
   LOAD DASHBOARD
========================================================= */
async function loadDashboard() {
  const container =
    appGetElement(
      "dashboard-applications"
    );


  if (!container) {
    return;
  }


  try {
    const response =
      await applicationApi(
        "/applications/my"
      );


    const applications =
      Array.isArray(response)
        ? response
        : response?.applications || [];


    dashboardApplications =
      applications;


    updateDashboardStats(
      applications
    );


    renderDashboardFilteredApplications();

  } catch (error) {

    if (
      error instanceof TypeError
    ) {
      dashboardApplications =
        [];


      updateDashboardStats(
        []
      );


      renderPortalError(
        container,
        {
          title:
            "Unable to load applications",

          message:
            "We could not connect to the server. Check your connection and try again.",

          retry:
            loadDashboard,
        }
      );


      return;
    }


    if (
      error.status === 401
    ) {
      window.location.href =
        "login.html?redirect=dashboard.html";


      return;
    }


    renderPortalError(
      container,
      {
        title:
          "Unable to load applications",

        message:
          error.message ||
          "Something went wrong while loading your applications.",

        retry:
          loadDashboard,
      }
    );
  }
}



/* =========================================================
   LOGOUT
========================================================= */

function initializeDashboardLogout() {
  const button =
    appGetElement(
      "dashboard-logout"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    async () => {
      button.disabled = true;


      try {
        await applicationApi(
          "/auth/logout",
          {
            method: "POST",
          }
        );

      } catch {
        // Even if the server session
        // has expired, send the user
        // back to login.
      } finally {
        window.location.href =
          "login.html";
      }
    }
  );
}


/* =========================================================
   APPLICATION DETAIL HELPERS
========================================================= */

function createDetailField(
  label,
  value
) {
  const wrapper =
    document.createElement("div");

  wrapper.className =
    "application-detail-field";


  const term =
    document.createElement("dt");

  term.textContent =
    label;


  const description =
    document.createElement("dd");

  description.textContent =
    escapeText(value);


  wrapper.append(
    term,
    description
  );


  return wrapper;
}


function formatDetailValue(
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
    return formatCurrency(value);
  }


  if (
    key === "travelDate"
  ) {
    return formatDate(value);
  }


  return value;
}


function detailLabel(key) {
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
  );
}


/* =========================================================
   APPLICATION DETAIL RENDER
========================================================= */

function renderApplicationDetail(
  application
) {

  function formatFileSize(bytes) {
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


    if (size < 1024 * 1024) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }


    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }


  function getDocumentFileLabel(
    documentData
  ) {
    const mimeType =
      documentData?.mimeType ||
      "";


    const name =
      documentData
        ?.originalName
        ?.toLowerCase() ||
      "";


    if (
      mimeType.includes("pdf") ||
      name.endsWith(".pdf")
    ) {
      return "PDF";
    }


    if (
      mimeType.includes("png") ||
      name.endsWith(".png")
    ) {
      return "PNG";
    }


    if (
      mimeType.includes("jpeg") ||
      mimeType.includes("jpg") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg")
    ) {
      return "JPG";
    }


    return "FILE";
  }

  function getDocumentTypeLabel(
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
  const root =
    appGetElement(
      "application-detail-root"
    );


  if (!root) {
    return;
  }


  const statusHistory =
    Array.isArray(
      application.statusHistory
    )
      ? [...application.statusHistory]
      : [];


  statusHistory.sort(
    (a, b) =>
      new Date(
        a.createdAt ||
        a.updatedAt ||
        0
      ) -
      new Date(
        b.createdAt ||
        b.updatedAt ||
        0
      )
  );


  root.className =
    "application-detail-layout";

  root.textContent = "";


  document
    .querySelector(
      ".application-detail-back"
    )
    ?.remove();


  const backWrapper =
    document.createElement(
      "div"
    );

  backWrapper.className =
    "application-detail-back";


  const backLink =
    document.createElement(
      "a"
    );

  backLink.href =
    "dashboard.html";

  backLink.className =
    "application-detail-back__link";

  backLink.textContent =
    "← Back to dashboard";


  backWrapper.append(
    backLink
  );


  root.before(
    backWrapper
  );


  const card =
    document.createElement(
      "article"
    );

  card.className =
    "card application-detail-card";


  const header =
    document.createElement(
      "header"
    );

  header.className =
    "application-detail-header";


  const headerInfo =
    document.createElement("div");


  const reference =
    document.createElement("span");

  reference.className =
    "application-detail-header__reference";

  reference.textContent =
    application.referenceNumber ||
    `Application ${application.id}`;


  const title =
    document.createElement("h1");

  title.textContent =
    SERVICE_NAMES[
    application.type
    ] ||
    application.type ||
    "Application";


  headerInfo.append(
    reference,
    title
  );


  const statusWrapper =
    document.createElement("div");

  statusWrapper.append(
    createStatusBadge(
      application.status
    )
  );


  header.append(
    headerInfo,
    statusWrapper
  );


  card.append(header);


  /* Applicant section */

  const applicantSection =
    document.createElement(
      "section"
    );

  applicantSection.className =
    "application-detail-section";


  const applicantHeading =
    document.createElement("h2");

  applicantHeading.textContent =
    "Applicant information";


  const applicantGrid =
    document.createElement("dl");

  applicantGrid.className =
    "application-detail-grid";


  applicantGrid.append(
    createDetailField(
      "Full Name",
      application.applicantName
    ),

    createDetailField(
      "Phone",
      application.phone
    ),

    createDetailField(
      "Email",
      application.email
    ),

    createDetailField(
      "Age",
      application.age
    ),

    createDetailField(
      "Address",
      application.address
    ),

    createDetailField(
      "PIN Code",
      application.pincode
    )
  );


  applicantSection.append(
    applicantHeading,
    applicantGrid
  );


  card.append(
    applicantSection
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
      "application-detail-section";


    const heading =
      document.createElement("h2");

    heading.textContent =
      "Request details";


    const grid =
      document.createElement("dl");

    grid.className =
      "application-detail-grid";


    Object.entries(details)
      .forEach(
        ([key, value]) => {
          grid.append(
            createDetailField(
              detailLabel(key),

              formatDetailValue(
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


    card.append(
      detailSection
    );
  }


  /* Description */

  const descriptionSection =
    document.createElement(
      "section"
    );

  descriptionSection.className =
    "application-detail-section";


  const descriptionHeading =
    document.createElement("h2");

  descriptionHeading.textContent =
    "Application description";


  const description =
    document.createElement("p");

  description.textContent =
    application.description ||
    "No description provided.";


  descriptionSection.append(
    descriptionHeading,
    description
  );


  card.append(
    descriptionSection
  );

  /* Status history */

  if (
    Array.isArray(
      application.statusHistory
    ) &&
    application.statusHistory.length
  ) {

    const historySection =
      document.createElement(
        "section"
      );


    historySection.className =
      "application-detail-section";


    const historyHeading =
      document.createElement(
        "h2"
      );


    historyHeading.textContent =
      "Status history";


    const timeline =
      document.createElement(
        "div"
      );


    timeline.className =
      "status-timeline";


    if (!statusHistory.length) {
      const empty =
        document.createElement(
          "p"
        );


      empty.className =
        "status-timeline__empty";


      empty.textContent =
        "No status updates are available yet.";


      timeline.append(
        empty
      );
    }


    statusHistory.forEach(
      (history, index) => {

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
          STATUS_NAMES[
          history.status
          ] ||
          history.status ||
          "Status update";


        const currentBadge =
          document.createElement(
            "span"
          );


        if (isCurrent) {
          currentBadge.className =
            "status-timeline__current";

          currentBadge.textContent =
            "Current";
        }


        heading.append(
          statusName
        );


        if (isCurrent) {
          heading.append(
            currentBadge
          );
        }


        content.append(
          heading
        );


        /* Optional note */

        if (history.note) {
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


        /* Date */

        const date =
          document.createElement(
            "time"
          );


        date.className =
          "status-timeline__date";


        const historyDate =
          history.createdAt ||
          history.updatedAt;


        date.textContent =
          historyDate
            ? formatDate(
              historyDate
            )
            : "Date unavailable";


        if (historyDate) {
          date.dateTime =
            historyDate;
        }


        content.append(
          date
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


    historySection.append(
      historyHeading,
      timeline
    );


    card.append(
      historySection
    );
  }

  /* =========================================================
   DOCUMENTS
========================================================= */

  const documentsSection =
    document.createElement(
      "section"
    );


  documentsSection.className =
    "application-detail-section";


  const documentsHeader =
    document.createElement(
      "div"
    );


  documentsHeader.className =
    "documents-header";


  const documentsHeadingWrapper =
    document.createElement(
      "div"
    );


  const documentsHeading =
    document.createElement(
      "h2"
    );


  documentsHeading.textContent =
    "Documents";


  const documentsDescription =
    document.createElement(
      "p"
    );


  documentsDescription.className =
    "documents-header__description";


  documentsDescription.textContent =
    "Documents attached to this assistance request.";


  documentsHeadingWrapper.append(
    documentsHeading,
    documentsDescription
  );


  const documents =
    Array.isArray(
      application.documents
    )
      ? application.documents
      : [];


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
    documentsHeadingWrapper,
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
      "No documents were uploaded with this application.";


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


        const fileBadge =
          document.createElement(
            "div"
          );


        fileBadge.className =
          "document-card__type";


        fileBadge.textContent =
          getDocumentFileLabel(
            documentData
          );


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


        const type =
          document.createElement(
            "span"
          );


        type.textContent =
          getDocumentTypeLabel(
            documentData.type
          );


        const separator =
          document.createElement(
            "span"
          );


        separator.setAttribute(
          "aria-hidden",
          "true"
        );


        separator.textContent =
          "•";


        const size =
          document.createElement(
            "span"
          );


        size.textContent =
          formatFileSize(
            documentData.size
          );


        meta.append(
          type,
          separator,
          size
        );


        info.append(
          name,
          meta
        );


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
          `/api/applications/${encodeURIComponent(
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


  card.append(
    documentsSection
  );


  /* Sidebar */

  const sidebar =
    document.createElement(
      "aside"
    );

  sidebar.className =
    "application-detail-sidebar";


  const statusCard =
    document.createElement("div");

  statusCard.className =
    "card application-status-card";


  const statusHeading =
    document.createElement("h2");

  statusHeading.textContent =
    "Application status";


  const statusBadge =
    createStatusBadge(
      application.status
    );


  const statusText =
    document.createElement("p");



  statusText.textContent =
    STATUS_DESCRIPTIONS[
    application.status
    ] ||
    "Status updates will appear here.";


  statusCard.append(
    statusHeading,
    statusBadge,
    statusText
  );


  const latestHistory =
    statusHistory.length
      ? statusHistory[
      statusHistory.length - 1
      ]
      : null;


  const latestNote =
    latestHistory?.note ||
    application.adminNote ||
    null;


  if (latestNote) {
    const noteBox =
      document.createElement(
        "div"
      );


    noteBox.className =
      "application-latest-note";


    const noteLabel =
      document.createElement(
        "span"
      );


    noteLabel.className =
      "application-latest-note__label";


    noteLabel.textContent =
      "Latest update";


    const noteText =
      document.createElement(
        "p"
      );


    noteText.textContent =
      latestNote;


    noteBox.append(
      noteLabel,
      noteText
    );


    statusCard.append(
      noteBox
    );
  }



  const infoCard =
    document.createElement("div");

  infoCard.className =
    "card application-status-card";


  const infoHeading =
    document.createElement("h2");

  infoHeading.textContent =
    "Application information";


  const infoGrid =
    document.createElement("dl");

  infoGrid.className =
    "application-detail-grid";


  infoGrid.append(
    createDetailField(
      "Reference",
      application.referenceNumber
    ),


    createDetailField(
      "Service",
      SERVICE_NAMES[
      application.type
      ] ||
      application.type
    ),


    createDetailField(
      "Branch",
      BRANCH_NAMES[
      application.branch
      ] ||
      application.branch
    ),


    createDetailField(
      "Submitted",
      formatDate(
        application.createdAt
      )
    ),


    createDetailField(
      "Last Updated",
      formatDate(
        application.updatedAt
      )
    )
  );


  infoCard.append(
    infoHeading,
    infoGrid
  );


  sidebar.append(
    statusCard,
    infoCard
  );


  root.append(
    card,
    sidebar
  );
}


/* =========================================================
   LOAD APPLICATION DETAIL
========================================================= */
async function loadApplicationDetail() {
  const root =
    appGetElement(
      "application-detail-root"
    );


  if (!root) {
    return;
  }


  const params =
    new URLSearchParams(
      window.location.search
    );


  const id =
    params.get("id");


  if (!id) {
    renderPortalError(
      root,
      {
        title:
          "No application selected",

        message:
          "Please return to your dashboard and select an application to view.",
      }
    );


    return;
  }


  try {
    const response =
      await applicationApi(
        `/applications/${encodeURIComponent(
          id
        )}`
      );


    const application =
      response?.application ||
      response;


    renderApplicationDetail(
      application
    );

  } catch (error) {

    /* Network / server unavailable */
    if (
      error instanceof TypeError
    ) {
      renderPortalError(
        root,
        {
          title:
            "Unable to load application",

          message:
            "We could not connect to the server. Check your connection and try again.",

          retry:
            loadApplicationDetail,
        }
      );


      return;
    }


    /* User is not logged in */
    if (
      error.status === 401
    ) {
      const currentPage =
        window.location.pathname
          .split("/")
          .pop() ||
        "application.html";


      const redirect =
        currentPage +
        window.location.search;


      window.location.href =
        `login.html?redirect=${encodeURIComponent(
          redirect
        )}`;


      return;
    }


    /* User does not own this application */
    if (
      error.status === 403
    ) {
      window.location.href =
        "dashboard.html";


      return;
    }


    /* Application does not exist */
    if (
      error.status === 404
    ) {
      renderPortalError(
        root,
        {
          title:
            "Application not found",

          message:
            "This application may have been removed or the link may be invalid.",
        }
      );


      return;
    }


    /* Other unexpected API error */
    renderPortalError(
      root,
      {
        title:
          "Unable to load application",

        message:
          error.message ||
          "Something went wrong while loading this application.",

        retry:
          loadApplicationDetail,
      }
    );
  }
}

/* =========================================================
   INITIALIZE
========================================================= */
async function initializeApplicationPortal() {
  const user =
    await requireUserSession();


  if (!user) {
    return;
  }


  updateDashboardUser(
    user
  );


  initializeServiceSelection();

  initializeFileInputs();

  initializeApplicationInputs();

  initializeApplicationForm();

  initializeDashboardLogout();

  initializeDashboardFilters();


  loadDashboard();

  loadApplicationDetail();
}


document.addEventListener(
  "DOMContentLoaded",
  initializeApplicationPortal
);