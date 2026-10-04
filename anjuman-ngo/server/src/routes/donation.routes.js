import {
  Router,
} from "express";

import {
  rateLimit,
} from "express-rate-limit";

import {
  createRazorpayOrder,
  getDonationConfig,
  submitUpiDonationReference,
  verifyRazorpayPayment,
} from "../controllers/donation.controller.js";


const router =
  Router();


/* =========================================================
   DONATION RATE LIMITING
========================================================= */

const donationCreateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      30,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many donation attempts. Please try again later.",
    },
  });


const donationVerifyLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      60,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many payment verification attempts. Please try again later.",
    },
  });


/* =========================================================
   PUBLIC PAYMENT CONFIG
========================================================= */

router.get(
  "/config",
  getDonationConfig
);


/* =========================================================
   RAZORPAY
========================================================= */

router.post(
  "/razorpay/order",
  donationCreateLimiter,
  createRazorpayOrder
);


router.post(
  "/razorpay/verify",
  donationVerifyLimiter,
  verifyRazorpayPayment
);


/* =========================================================
   DIRECT UPI
========================================================= */

router.post(
  "/upi/reference",
  donationCreateLimiter,
  submitUpiDonationReference
);


export default router;