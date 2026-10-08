/* =========================================================
   CONTACT ENQUIRY FORM
========================================================= */

const contactForm = document.querySelector("#contact-form");
const contactSubmit = document.querySelector("#contact-submit");
const contactFormMessage = document.querySelector("#contact-form-message");
const contactPhone = document.querySelector("#contact-phone");

function showContactMessage(message, isError = false) {
  contactFormMessage.textContent = message;
  contactFormMessage.hidden = false;
  contactFormMessage.classList.toggle("form-help--error", isError);
}

contactPhone?.addEventListener("input", () => {
  contactPhone.value = contactPhone.value.replace(/\D/g, "").slice(0, 10);
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(
    ["name", "phone", "email", "subject", "message"].map((field) => [
      field,
      String(formData.get(field) || "").trim(),
    ])
  );

  if (!payload.phone && !payload.email) {
    showContactMessage("Please provide an email address or phone number.", true);
    return;
  }

  contactSubmit.disabled = true;
  contactSubmit.textContent = "Sending...";
  contactFormMessage.hidden = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "We could not send your enquiry. Please try again.");
    }

    contactForm.reset();
    showContactMessage("Thank you. Your enquiry has been received successfully.");
  } catch (error) {
    showContactMessage(error.message, true);
  } finally {
    contactSubmit.disabled = false;
    contactSubmit.textContent = "Send Enquiry";
  }
});
