"use strict";


/* =========================================================
   DONATION CONFIG
========================================================= */

const DONATION_API_BASE_URL =
    "/api/donations";


const MIN_DONATION_AMOUNT =
    10;


const MAX_DONATION_AMOUNT =
    1000000;


/* =========================================================
   STATE
========================================================= */

const donationState = {

    configLoaded:
        false,

    isSubmitting:
        false,

    paymentConfig: {
        upi: {
            enabled:
                false,

            id:
                null,

            payeeName:
                "Anjuman Bashindgan-E-Bihar",
        },

        razorpay: {
            enabled:
                false,

            keyId:
                null,
        },
    },

};


/* =========================================================
   DOM
========================================================= */

const donationForm =
    document.getElementById(
        "donation-form"
    );


const amountInput =
    document.getElementById(
        "donation-amount"
    );


const presetAmountInputs =
    document.querySelectorAll(
        'input[name="presetAmount"]'
    );


const paymentMethodInputs =
    document.querySelectorAll(
        'input[name="paymentMethod"]'
    );


const upiPaymentInput =
    document.querySelector(
        'input[name="paymentMethod"][value="UPI"]'
    );


const razorpayPaymentInput =
    document.querySelector(
        'input[name="paymentMethod"][value="RAZORPAY"]'
    );


const upiPaymentOption =
    document.getElementById(
        "upi-payment-option"
    );


const razorpayPaymentOption =
    document.getElementById(
        "razorpay-payment-option"
    );


const upiAvailability =
    document.getElementById(
        "upi-availability"
    );


const razorpayAvailability =
    document.getElementById(
        "razorpay-availability"
    );


const configStatus =
    document.getElementById(
        "donation-config-status"
    );


const formMessage =
    document.getElementById(
        "donation-form-message"
    );


const submitButton =
    document.getElementById(
        "donation-submit"
    );


const upiPanel =
    document.getElementById(
        "upi-payment-panel"
    );


const upiIdDisplay =
    document.getElementById(
        "upi-id-display"
    );


const upiPayeeName =
    document.getElementById(
        "upi-payee-name"
    );


const upiSelectedAmount =
    document.getElementById(
        "upi-selected-amount"
    );


const upiPayLink =
    document.getElementById(
        "upi-pay-link"
    );

const upiPayLinkSecondary =
    document.getElementById(
        "upi-pay-link-secondary"
    );

const upiQrCode =
    document.getElementById(
        "upi-qr-code"
    );


const upiQrAmount =
    document.getElementById(
        "upi-qr-amount"
    );

const copyUpiButton =
    document.getElementById(
        "copy-upi-id"
    );


const upiReferenceInput =
    document.getElementById(
        "upi-reference"
    );


const donorNameInput =
    document.getElementById(
        "donor-name"
    );


const donorEmailInput =
    document.getElementById(
        "donor-email"
    );


const donorPhoneInput =
    document.getElementById(
        "donor-phone"
    );

const donationResult =
    document.getElementById(
        "donation-result"
    );


const donationResultIcon =
    document.getElementById(
        "donation-result-icon"
    );


const donationResultEyebrow =
    document.getElementById(
        "donation-result-eyebrow"
    );


const donationResultTitle =
    document.getElementById(
        "donation-result-title"
    );


const donationResultMessage =
    document.getElementById(
        "donation-result-message"
    );


const donationResultAmount =
    document.getElementById(
        "donation-result-amount"
    );


const donationResultMethod =
    document.getElementById(
        "donation-result-method"
    );


const donationResultStatus =
    document.getElementById(
        "donation-result-status"
    );


const donationResultReference =
    document.getElementById(
        "donation-result-reference"
    );


const donationResultReferenceRow =
    document.getElementById(
        "donation-result-reference-row"
    );


const donationResultNote =
    document.getElementById(
        "donation-result-note"
    );


const makeAnotherDonationButton =
    document.getElementById(
        "make-another-donation"
    );
/* =========================================================
   HELPERS
========================================================= */

function formatIndianCurrency(
    amount
) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                "INR",

            maximumFractionDigits:
                2,
        }
    ).format(
        Number(amount) || 0
    );
}


function normalizeString(
    value
) {
    return String(
        value ?? ""
    ).trim();
}


function getDonationAmount() {
    const amount =
        Number(
            amountInput?.value
        );


    if (
        !Number.isFinite(amount)
    ) {
        return null;
    }


    return amount;
}


function getSelectedPaymentMethod() {
    const selected =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    return selected?.value ||
        null;
}


function isValidDonationAmount(
    amount
) {
    return (
        Number.isFinite(amount) &&
        amount >=
        MIN_DONATION_AMOUNT &&
        amount <=
        MAX_DONATION_AMOUNT
    );
}


function showMessage(
    message,
    type = "info"
) {
    if (!formMessage) {
        return;
    }


    formMessage.hidden =
        false;


    formMessage.textContent =
        message;


    formMessage.dataset.type =
        type;
}


function clearMessage() {
    if (!formMessage) {
        return;
    }


    formMessage.hidden =
        true;


    formMessage.textContent =
        "";


    delete formMessage.dataset.type;
}


function setSubmitting(
    isSubmitting
) {
    donationState.isSubmitting =
        isSubmitting;


    if (!submitButton) {
        return;
    }


    if (isSubmitting) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Submitting...";

        return;
    }


    updateSubmitButton();
}


/* =========================================================
   API
========================================================= */

async function donationApiRequest(
    endpoint,
    options = {}
) {
    const response =
        await fetch(
            `${DONATION_API_BASE_URL}${endpoint}`,
            {
                credentials:
                    "include",

                headers: {
                    "Content-Type":
                        "application/json",

                    ...options.headers,
                },

                ...options,
            }
        );


    let payload =
        null;


    try {
        payload =
            await response.json();

    } catch {
        payload =
            null;
    }


    if (!response.ok) {

        const error =
            new Error(
                payload?.message ||
                "Unable to complete the donation request."
            );


        error.status =
            response.status;


        error.payload =
            payload;


        throw error;
    }


    return payload;
}


/* =========================================================
   PAYMENT CONFIG
========================================================= */

async function loadDonationConfig() {
    if (!configStatus) {
        return;
    }


    configStatus.textContent =
        "Checking available payment methods...";


    try {
        const response =
            await donationApiRequest(
                "/config",
                {
                    method:
                        "GET",

                    headers: {},
                }
            );


        donationState.paymentConfig =
        {
            upi: {
                enabled:
                    Boolean(
                        response
                            ?.payment
                            ?.upi
                            ?.enabled
                    ),

                id:
                    response
                        ?.payment
                        ?.upi
                        ?.id ||
                    null,

                payeeName:
                    response
                        ?.payment
                        ?.upi
                        ?.payeeName ||
                    "Anjuman Bashindgan-E-Bihar",
            },

            razorpay: {
                enabled:
                    Boolean(
                        response
                            ?.payment
                            ?.razorpay
                            ?.enabled
                    ),

                keyId:
                    response
                        ?.payment
                        ?.razorpay
                        ?.keyId ||
                    null,
            },
        };


        donationState.configLoaded =
            true;


        applyPaymentAvailability();

    } catch (error) {

        donationState.configLoaded =
            false;


        disablePaymentMethods();


        configStatus.textContent =
            "Payment methods could not be loaded. Please try again later.";


        showMessage(
            error.message ||
            "Unable to load payment configuration.",
            "error"
        );
    }
}


function applyPaymentAvailability() {
    const upi =
        donationState
            .paymentConfig
            .upi;


    const razorpay =
        donationState
            .paymentConfig
            .razorpay;


    /*
      UPI is fully implemented in Step 3.
    */

    if (
        upi.enabled &&
        upi.id
    ) {

        upiPaymentInput.disabled =
            false;


        upiPaymentOption
            ?.classList
            .remove(
                "is-disabled"
            );


        if (upiAvailability) {
            upiAvailability.textContent =
                "Available";
        }


        if (upiIdDisplay) {
            upiIdDisplay.value =
                upi.id;
        }


        if (upiPayeeName) {
            upiPayeeName.textContent =
                upi.payeeName;
        }

    } else {

        upiPaymentInput.disabled =
            true;


        upiPaymentOption
            ?.classList
            .add(
                "is-disabled"
            );


        if (upiAvailability) {
            upiAvailability.textContent =
                "Unavailable";
        }
    }

    /*
      Razorpay can be selected only when:

      1. server configuration is enabled
      2. a public key ID exists
      3. Razorpay Checkout.js loaded correctly
    */

    const razorpayReady =
        Boolean(
            razorpay.enabled &&
            razorpay.keyId &&
            typeof window.Razorpay ===
            "function"
        );


    if (razorpayPaymentInput) {

        razorpayPaymentInput.disabled =
            !razorpayReady;
    }


    if (razorpayReady) {

        razorpayPaymentOption
            ?.classList
            .remove(
                "is-disabled"
            );


        if (razorpayAvailability) {

            razorpayAvailability.textContent =
                "Available";
        }

    } else {

        razorpayPaymentOption
            ?.classList
            .add(
                "is-disabled"
            );


        if (razorpayAvailability) {

            razorpayAvailability.textContent =
                razorpay.enabled
                    ? "Checkout Unavailable"
                    : "Unavailable";
        }
    }


    const availableMethods =
        [];


    if (
        upi.enabled &&
        upi.id
    ) {
        availableMethods.push(
            "Direct UPI"
        );
    }


    if (razorpayReady) {
        availableMethods.push(
            "Razorpay"
        );
    }


    configStatus.textContent =
        availableMethods.length
            ? `${availableMethods.join(" and ")} ${availableMethods.length > 1
                ? "are"
                : "is"
            } available.`
            : "Online donation methods are currently unavailable.";


    refreshPaymentSummary();
}


function disablePaymentMethods() {
    if (upiPaymentInput) {
        upiPaymentInput.disabled =
            true;
    }


    if (razorpayPaymentInput) {
        razorpayPaymentInput.disabled =
            true;
    }


    upiPaymentOption
        ?.classList
        .add(
            "is-disabled"
        );


    razorpayPaymentOption
        ?.classList
        .add(
            "is-disabled"
        );


    updateSubmitButton();
}


/* =========================================================
   AMOUNT
========================================================= */

function handlePresetAmountChange(
    event
) {
    const amount =
        Number(
            event.target.value
        );


    if (
        !amountInput ||
        !Number.isFinite(amount)
    ) {
        return;
    }


    amountInput.value =
        String(amount);


    clearMessage();


    refreshPaymentSummary();
}


function handleCustomAmountInput() {
    const amount =
        getDonationAmount();


    presetAmountInputs
        .forEach(
            (input) => {

                input.checked =
                    Number(
                        input.value
                    ) === amount;

            }
        );


    clearMessage();


    refreshPaymentSummary();
}


function refreshPaymentSummary() {
    const amount =
        getDonationAmount();


    if (upiSelectedAmount) {

        upiSelectedAmount.textContent =
            isValidDonationAmount(
                amount
            )
                ? formatIndianCurrency(
                    amount
                )
                : "₹0";

    }


    updateUpiDeepLink();


    updateSubmitButton();
}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function handlePaymentMethodChange() {
    clearMessage();


    const method =
        getSelectedPaymentMethod();


    if (
        method ===
        "UPI" &&
        donationState
            .paymentConfig
            .upi
            .enabled
    ) {

        upiPanel.hidden =
            false;


        submitButton.textContent =
            "Submit UPI Reference";

    } else {

        upiPanel.hidden =
            true;
    }


    if (
        method ===
        "RAZORPAY"
    ) {

        submitButton.textContent =
            "Pay Securely with Razorpay";
    }


    updateUpiDeepLink();


    updateSubmitButton();
}

/* =========================================================
   UPI DEEP LINK
========================================================= */

function buildUpiPaymentUri() {
    const config =
        donationState
            .paymentConfig
            .upi;


    const amount =
        getDonationAmount();


    if (
        !config.enabled ||
        !config.id ||
        !isValidDonationAmount(
            amount
        )
    ) {
        return null;
    }


    const params =
        new URLSearchParams({
            pa:
                config.id,

            pn:
                config.payeeName,

            am:
                String(amount),

            cu:
                "INR",

            tn:
                "Donation to Anjuman Bashindgan-E-Bihar",
        });


    return `upi://pay?${params.toString()}`;
}


function renderUpiQr(
    paymentUri
) {
    if (!upiQrCode) {
        return;
    }


    upiQrCode.replaceChildren();


    if (!paymentUri) {
        upiQrCode.textContent =
            "Choose a donation amount to generate the payment QR.";

        return;
    }


    if (
        typeof window.QRCode !==
        "function"
    ) {
        upiQrCode.textContent =
            "QR code could not be loaded. You can still copy the UPI ID.";

        return;
    }


    new window.QRCode(
        upiQrCode,
        {
            text:
                paymentUri,

            width:
                220,

            height:
                220,

            correctLevel:
                window.QRCode
                    .CorrectLevel
                    .M,
        }
    );
}


function updateUpiDeepLink() {
    if (!upiPayLink) {
        return;
    }


    const amount =
        getDonationAmount();


    const paymentUri =
        buildUpiPaymentUri();


    if (upiQrAmount) {

        upiQrAmount.textContent =
            isValidDonationAmount(
                amount
            )
                ? formatIndianCurrency(
                    amount
                )
                : "₹0";
    }


    renderUpiQr(
        paymentUri
    );


    if (!paymentUri) {

        upiPayLink.href =
            "#";


        upiPayLink.setAttribute(
            "aria-disabled",
            "true"
        );


        upiPayLink.classList.add(
            "is-disabled"
        );

        upiPayLinkSecondary?.setAttribute(
            "href",
            "#"
        );


        return;
    }


    upiPayLink.href =
        paymentUri;


    upiPayLink.removeAttribute(
        "aria-disabled"
    );


    upiPayLink.classList.remove(
        "is-disabled"
    );

    if (upiPayLinkSecondary) {
        upiPayLinkSecondary.href = paymentUri;
        upiPayLinkSecondary.removeAttribute("aria-disabled");
        upiPayLinkSecondary.classList.remove("is-disabled");
    }
}
/* =========================================================
   COPY UPI ID
========================================================= */

async function copyUpiId() {
    const upiId =
        donationState
            .paymentConfig
            .upi
            .id;


    if (!upiId) {
        return;
    }


    try {

        await navigator
            .clipboard
            .writeText(
                upiId
            );


        copyUpiButton.textContent =
            "Copied";


        window.setTimeout(
            () => {

                copyUpiButton.textContent =
                    "Copy";

            },
            1800
        );

    } catch {

        if (upiIdDisplay) {

            upiIdDisplay.focus();

            upiIdDisplay.select();
        }


        showMessage(
            "Copy was blocked by the browser. Please copy the UPI ID manually.",
            "info"
        );
    }
}


/* =========================================================
   VALIDATION
========================================================= */

function validateDonorDetails() {
    const amount =
        getDonationAmount();


    if (
        !isValidDonationAmount(
            amount
        )
    ) {
        throw new Error(
            "Enter a donation amount between ₹10 and ₹10,00,000."
        );
    }


    const donorName =
        normalizeString(
            donorNameInput?.value
        );


    if (
        donorName.length >
        100
    ) {
        throw new Error(
            "Full name cannot exceed 100 characters."
        );
    }


    const email =
        normalizeString(
            donorEmailInput?.value
        );


    if (
        email &&
        !donorEmailInput
            .validity
            .valid
    ) {
        throw new Error(
            "Enter a valid email address."
        );
    }


    const phone =
        normalizeString(
            donorPhoneInput?.value
        );


    if (
        phone &&
        !/^[6-9]\d{9}$/.test(
            phone
        )
    ) {
        throw new Error(
            "Enter a valid 10-digit Indian mobile number."
        );
    }


    return {
        amount,
        donorName,
        email,
        phone,
    };
}


function validateUpiReference() {
    const upiReference =
        normalizeString(
            upiReferenceInput?.value
        );


    if (
        upiReference.length <
        4
    ) {
        throw new Error(
            "Enter the UPI transaction reference / UTR."
        );
    }


    if (
        upiReference.length >
        100
    ) {
        throw new Error(
            "UPI transaction reference is too long."
        );
    }


    return upiReference;
}


/* =========================================================
   SUBMIT BUTTON
========================================================= */
function updateSubmitButton() {
    if (
        !submitButton ||
        donationState
            .isSubmitting
    ) {
        return;
    }


    const method =
        getSelectedPaymentMethod();


    const amount =
        getDonationAmount();


    const validAmount =
        isValidDonationAmount(
            amount
        );


    const upiReference =
        normalizeString(
            upiReferenceInput?.value
        );


    if (
        method ===
        "UPI"
    ) {

        submitButton.textContent =
            "Submit UPI Reference";


        submitButton.disabled =
            !(
                donationState
                    .paymentConfig
                    .upi
                    .enabled &&
                validAmount &&
                upiReference.length >=
                4
            );


        return;
    }


    if (
        method ===
        "RAZORPAY"
    ) {

        const razorpayReady =
            Boolean(
                donationState
                    .paymentConfig
                    .razorpay
                    .enabled &&
                donationState
                    .paymentConfig
                    .razorpay
                    .keyId &&
                typeof window.Razorpay ===
                "function"
            );


        submitButton.textContent =
            "Pay Securely with Razorpay";


        submitButton.disabled =
            !(
                razorpayReady &&
                validAmount
            );


        return;
    }


    submitButton.textContent =
        "Continue to Payment";


    submitButton.disabled =
        true;
}

/* =========================================================
   UPI SUBMISSION
========================================================= */

async function submitUpiDonation() {
    const donor =
        validateDonorDetails();

    const upiReference =
        validateUpiReference();

    const payload = {
        amount:
            donor.amount,

        donorName:
            donor.donorName,

        email:
            donor.email,

        phone:
            donor.phone,

        upiReference,
    };


    setSubmitting(
        true
    );

    clearMessage();


    try {
        const response =
            await donationApiRequest(
                "/upi/reference",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        ),
                }
            );


        donationState.isSubmitting =
            false;


        renderDonationResult({
            amount:
                donor.amount,

            method:
                "Direct UPI",

            status:
                response
                    ?.donation
                    ?.status ||
                "PENDING",

            donationId:
                response
                    ?.donation
                    ?.id ||
                null,
        });


    } catch (error) {
        showMessage(
            error.message ||
            "Unable to submit the UPI transaction reference.",
            "error"
        );


        setSubmitting(
            false
        );
    }
}

/* =========================================================
   RAZORPAY
========================================================= */

async function createRazorpayOrder(
    donor
) {
    return donationApiRequest(
        "/razorpay/order",
        {
            method:
                "POST",

            body:
                JSON.stringify({
                    amount:
                        donor.amount,

                    donorName:
                        donor.donorName,

                    email:
                        donor.email,

                    phone:
                        donor.phone,
                }),
        }
    );
}


async function verifyRazorpayPayment(
    paymentResponse
) {
    return donationApiRequest(
        "/razorpay/verify",
        {
            method:
                "POST",

            body:
                JSON.stringify({
                    razorpay_order_id:
                        paymentResponse
                            .razorpay_order_id,

                    razorpay_payment_id:
                        paymentResponse
                            .razorpay_payment_id,

                    razorpay_signature:
                        paymentResponse
                            .razorpay_signature,
                }),
        }
    );
}

function lockDonationFormAfterSuccess() {

    presetAmountInputs
        .forEach(
            (input) => {
                input.disabled =
                    true;
            }
        );


    paymentMethodInputs
        .forEach(
            (input) => {
                input.disabled =
                    true;
            }
        );


    if (amountInput) {
        amountInput.disabled =
            true;
    }


    if (donorNameInput) {
        donorNameInput.disabled =
            true;
    }


    if (donorEmailInput) {
        donorEmailInput.disabled =
            true;
    }


    if (donorPhoneInput) {
        donorPhoneInput.disabled =
            true;
    }
}

/* =========================================================
   DONATION RESULT
========================================================= */

function renderDonationResult({
    amount,
    method,
    status,
    donationId,
}) {
    if (
        !donationResult ||
        !donationForm
    ) {
        return;
    }


    const normalizedStatus =
        String(
            status ||
            ""
        ).toUpperCase();


    lockDonationFormAfterSuccess();


    donationForm.hidden =
        true;


    donationResult.hidden =
        false;


    donationResult.classList.remove(
        "is-pending",
        "is-verified",
        "is-error"
    );


    if (donationResultAmount) {

        donationResultAmount.textContent =
            formatIndianCurrency(
                amount
            );
    }


    if (donationResultMethod) {

        donationResultMethod.textContent =
            method;
    }


    if (donationResultReferenceRow) {

        donationResultReferenceRow.hidden =
            !donationId;
    }


    if (
        donationResultReference &&
        donationId
    ) {

        donationResultReference.textContent =
            donationId;
    }


    if (
        normalizedStatus ===
        "PENDING"
    ) {

        donationResult.classList.add(
            "is-pending"
        );


        if (donationResultIcon) {

            donationResultIcon.textContent =
                "…";
        }


        if (donationResultEyebrow) {

            donationResultEyebrow.textContent =
                "Reference Submitted";
        }


        if (donationResultTitle) {

            donationResultTitle.textContent =
                "Pending payment verification";
        }


        if (donationResultMessage) {

            donationResultMessage.textContent =
                "Your UPI transaction reference has been submitted successfully. The donation has not yet been marked as verified.";
        }


        if (donationResultStatus) {

            donationResultStatus.textContent =
                "Pending Verification";
        }


        if (donationResultNote) {

            donationResultNote.textContent =
                "Anjuman will verify the transaction against the payment record. Please do not submit the same UPI transaction reference again.";
        }


        return;
    }


    if (
        normalizedStatus ===
        "VERIFIED"
    ) {

        donationResult.classList.add(
            "is-verified"
        );


        if (donationResultIcon) {

            donationResultIcon.textContent =
                "✓";
        }


        if (donationResultEyebrow) {

            donationResultEyebrow.textContent =
                "Donation Confirmed";
        }


        if (donationResultTitle) {

            donationResultTitle.textContent =
                "Thank you for your support";
        }


        if (donationResultMessage) {

            donationResultMessage.textContent =
                "Your payment has been verified successfully and the donation has been recorded.";
        }


        if (donationResultStatus) {

            donationResultStatus.textContent =
                "Verified";
        }


        if (donationResultNote) {

            donationResultNote.textContent =
                "This payment was verified by the server before being marked as a confirmed donation.";
        }


        return;
    }


    donationResult.classList.add(
        "is-error"
    );


    if (donationResultIcon) {

        donationResultIcon.textContent =
            "!";
    }


    if (donationResultTitle) {

        donationResultTitle.textContent =
            "Donation status unavailable";
    }


    if (donationResultStatus) {

        donationResultStatus.textContent =
            normalizedStatus ||
            "Unknown";
    }


    if (donationResultMessage) {

        donationResultMessage.textContent =
            "We could not confirm the current donation status.";
    }


    if (donationResultNote) {

        donationResultNote.textContent =
            "Please contact Anjuman if you believe payment has already been completed.";
    }
}

async function submitRazorpayDonation() {
    const donor =
        validateDonorDetails();


    const razorpayConfig =
        donationState
            .paymentConfig
            .razorpay;


    if (
        !razorpayConfig.enabled ||
        !razorpayConfig.keyId
    ) {
        throw new Error(
            "Razorpay donations are currently unavailable."
        );
    }


    if (
        typeof window.Razorpay !==
        "function"
    ) {
        throw new Error(
            "Secure payment checkout could not be loaded. Please refresh the page and try again."
        );
    }


    setSubmitting(
        true
    );

    clearMessage();


    let orderResponse;


    try {
        orderResponse =
            await createRazorpayOrder(
                donor
            );

    } catch (error) {
        setSubmitting(
            false
        );

        throw error;
    }


    const order =
        orderResponse?.order;


    const keyId =
        orderResponse?.keyId ||
        razorpayConfig.keyId;


    if (
        !order?.id ||
        !order?.amount ||
        !order?.currency ||
        !keyId
    ) {
        setSubmitting(
            false
        );

        throw new Error(
            "The payment order could not be prepared."
        );
    }


    const options = {
        key:
            keyId,

        amount:
            order.amount,

        currency:
            order.currency,

        name:
            "Anjuman Bashindgan-E-Bihar",

        description:
            "Community Donation",

        order_id:
            order.id,


        prefill: {
            name:
                donor.donorName ||
                "",

            email:
                donor.email ||
                "",

            contact:
                donor.phone ||
                "",
        },


        notes: {
            purpose:
                "Community Donation",
        },


        theme: {
            color:
                "#256dae",
        },


        handler:
            async function (
                paymentResponse
            ) {
                if (submitButton) {
                    submitButton.textContent =
                        "Verifying Payment...";

                    submitButton.disabled =
                        true;
                }


                try {
                    const verification =
                        await verifyRazorpayPayment(
                            paymentResponse
                        );


                    if (
                        !verification?.success
                    ) {
                        throw new Error(
                            "Payment verification failed."
                        );
                    }


                    donationState.isSubmitting =
                        false;


                    renderDonationResult({
                        amount:
                            donor.amount,

                        method:
                            "Razorpay",

                        status:
                            verification
                                ?.donation
                                ?.status ||
                            "VERIFIED",

                        donationId:
                            verification
                                ?.donation
                                ?.id ||
                            null,
                    });


                } catch (error) {
                    donationState.isSubmitting =
                        false;


                    showMessage(
                        error.message ||
                        "Payment was received by the checkout but could not be verified. Please contact Anjuman before attempting another payment.",
                        "error"
                    );


                    updateSubmitButton();
                }
            },


        modal: {
            ondismiss:
                function () {
                    if (
                        !donationState
                            .isSubmitting
                    ) {
                        return;
                    }


                    donationState.isSubmitting =
                        false;


                    showMessage(
                        "Payment was not completed. You can try again when ready.",
                        "info"
                    );


                    updateSubmitButton();
                },
        },
    };


    const checkout =
        new window.Razorpay(
            options
        );


    checkout.on(
        "payment.failed",
        function (
            response
        ) {
            donationState.isSubmitting =
                false;


            const description =
                response
                    ?.error
                    ?.description;


            showMessage(
                description ||
                "The payment could not be completed. Please try again.",
                "error"
            );


            updateSubmitButton();
        }
    );


    try {
        checkout.open();

    } catch {
        donationState.isSubmitting =
            false;


        updateSubmitButton();


        throw new Error(
            "Unable to open Razorpay Checkout."
        );
    }
}


/* =========================================================
   FORM SUBMIT
========================================================= */

async function handleDonationSubmit(
    event
) {
    event.preventDefault();


    if (
        donationState.isSubmitting
    ) {
        return;
    }


    const method =
        getSelectedPaymentMethod();


    if (!method) {

        showMessage(
            "Choose a payment method.",
            "error"
        );

        return;
    }


    if (
        method ===
        "UPI"
    ) {

        try {

            await submitUpiDonation();

        } catch (error) {

            showMessage(
                error.message ||
                "Please check your donation details.",
                "error"
            );
        }


        return;
    }

    if (
        method ===
        "RAZORPAY"
    ) {

        try {

            await submitRazorpayDonation();

        } catch (error) {

            donationState.isSubmitting =
                false;


            showMessage(
                error.message ||
                "Unable to start the secure payment.",
                "error"
            );


            updateSubmitButton();
        }


        return;
    }

}


/* =========================================================
   PHONE INPUT
========================================================= */

function handlePhoneInput() {
    if (!donorPhoneInput) {
        return;
    }


    donorPhoneInput.value =
        donorPhoneInput
            .value
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                10
            );
}


/* =========================================================
   EVENTS
========================================================= */

function attachDonationEvents() {

    presetAmountInputs
        .forEach(
            (input) => {

                input.addEventListener(
                    "change",
                    handlePresetAmountChange
                );

            }
        );


    paymentMethodInputs
        .forEach(
            (input) => {

                input.addEventListener(
                    "change",
                    handlePaymentMethodChange
                );

            }
        );


    amountInput
        ?.addEventListener(
            "input",
            handleCustomAmountInput
        );


    upiReferenceInput
        ?.addEventListener(
            "input",
            () => {

                clearMessage();

                updateSubmitButton();

            }
        );


    donorPhoneInput
        ?.addEventListener(
            "input",
            handlePhoneInput
        );


    copyUpiButton
        ?.addEventListener(
            "click",
            copyUpiId
        );


    upiPayLink
        ?.addEventListener(
            "click",
            (event) => {

                if (
                    upiPayLink.getAttribute(
                        "aria-disabled"
                    ) ===
                    "true"
                ) {
                    event.preventDefault();


                    showMessage(
                        "Enter a valid donation amount before opening your UPI app.",
                        "error"
                    );
                }

            }
        );


    donationForm
        ?.addEventListener(
            "submit",
            handleDonationSubmit
        );

    makeAnotherDonationButton
        ?.addEventListener(
            "click",
            () => {
                window.location.reload();
            }
        );


    /*
      The Step 2 button was type="button".
      It now behaves as the form submit control.
    */

    if (submitButton) {

        submitButton.type =
            "submit";
    }
}


/* =========================================================
   INIT
========================================================= */

async function initDonationPage() {

    if (!donationForm) {
        return;
    }


    attachDonationEvents();


    refreshPaymentSummary();


    await loadDonationConfig();
}


document.addEventListener(
    "DOMContentLoaded",
    initDonationPage
);
