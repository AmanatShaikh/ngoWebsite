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


/* =========================================================
   BASIC HELPERS
========================================================= */

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
  applications
) {
  const total =
    applications.length;


  const pending =
    applications.filter(
      (item) =>
        item.status === "PENDING"
    ).length;


  const review =
    applications.filter(
      (item) =>
        item.status ===
        "UNDER_REVIEW"
    ).length;


  const approved =
    applications.filter(
      (item) =>
        item.status ===
        "APPROVED"
    ).length;


  if (appGetElement("stat-total")) {
    appGetElement(
      "stat-total"
    ).textContent =
      String(total);
  }


  if (appGetElement("stat-pending")) {
    appGetElement(
      "stat-pending"
    ).textContent =
      String(pending);
  }


  if (appGetElement("stat-review")) {
    appGetElement(
      "stat-review"
    ).textContent =
      String(review);
  }


  if (appGetElement("stat-approved")) {
    appGetElement(
      "stat-approved"
    ).textContent =
      String(approved);
  }
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


    updateDashboardStats(
      applications
    );


    renderApplicationList(
      applications
    );

  } catch (error) {

    if (
      error instanceof TypeError
    ) {
      updateDashboardStats([]);


      renderDashboardEmpty(
        container
      );


      showApplicationAlert(
        "The backend is not running yet. When it is connected, your real applications will load here automatically.",
        "info"
      );

      return;
    }


    if (error.status === 401) {
      window.location.href =
        "login.html?redirect=dashboard.html";

      return;
    }


    container.textContent = "";


    showApplicationAlert(
      error.message ||
      "Unable to load your applications.",
      "error"
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
  const root =
    appGetElement(
      "application-detail-root"
    );


  if (!root) {
    return;
  }


  root.className =
    "application-detail-layout";

  root.textContent = "";


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


    application.statusHistory
      .forEach(
        (
          history,
          index
        ) => {

          const item =
            document.createElement(
              "div"
            );


          item.className =
            "status-timeline__item";


          const marker =
            document.createElement(
              "div"
            );


          marker.className =
            "status-timeline__marker";


          marker.textContent =
            String(
              index + 1
            );


          const content =
            document.createElement(
              "div"
            );


          content.className =
            "status-timeline__content";


          const status =
            document.createElement(
              "strong"
            );


          status.textContent =
            STATUS_NAMES[
            history.toStatus
            ] ||
            history.toStatus;


          const note =
            document.createElement(
              "p"
            );


          note.textContent =
            history.note ||
            "Application status updated.";


          const date =
            document.createElement(
              "span"
            );


          date.className =
            "status-timeline__date";


          date.textContent =
            formatDate(
              history.createdAt
            );


          content.append(
            status,
            note,
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

  if (
    Array.isArray(
      application.documents
    ) &&
    application.documents.length
  ) {

    const documentsSection =
      document.createElement(
        "section"
      );


    documentsSection.className =
      "application-detail-section";


    const documentsHeading =
      document.createElement(
        "h2"
      );


    documentsHeading.textContent =
      "Documents";


    const documentList =
      document.createElement(
        "div"
      );


    documentList.className =
      "document-list";


    application.documents.forEach(
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
          `/api/applications/${encodeURIComponent(
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


        documentList.append(
          item
        );
      }
    );


    documentsSection.append(
      documentsHeading,
      documentList
    );


    card.append(
      documentsSection
    );
  }

  
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
    "Status updates will appear here as the selected branch reviews your application.";


  statusCard.append(
    statusHeading,
    statusBadge,
    statusText
  );


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
    root.className =
      "dashboard-empty";

    root.textContent =
      "No application was selected.";

    return;
  }


  try {
    const response =
      await applicationApi(
        `/applications/${encodeURIComponent(id)}`
      );


    const application =
      response?.application ||
      response;


    renderApplicationDetail(
      application
    );

  } catch (error) {

    if (
      error instanceof TypeError
    ) {
      root.className =
        "dashboard-empty";


      root.textContent =
        "The backend is not running yet. Application details will appear here after the API is connected.";


      showApplicationAlert(
        "Frontend application detail view is ready. Backend connection will be added in the backend phase.",
        "info"
      );

      return;
    }


    if (error.status === 401) {
      window.location.href =
        "login.html";

      return;
    }


    if (error.status === 404) {
      root.className =
        "dashboard-empty";

      root.textContent =
        "This application could not be found.";

      return;
    }


    showApplicationAlert(
      error.message ||
      "Unable to load this application.",
      "error"
    );
  }
}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeApplicationPortal() {
  initializeServiceSelection();

  initializeFileInputs();

  initializeApplicationInputs();

  initializeApplicationForm();

  initializeDashboardLogout();

  loadDashboard();

  loadApplicationDetail();
}


document.addEventListener(
  "DOMContentLoaded",
  initializeApplicationPortal
);