import {
  Router,
} from "express";

import {
  createRazorpayOrder,
  getDonationConfig,
  submitUpiDonationReference,
  verifyRazorpayPayment,
} from "../controllers/donation.controller.js";


const router =
  Router();


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
  createRazorpayOrder
);


router.post(
  "/razorpay/verify",
  verifyRazorpayPayment
);


/* =========================================================
   DIRECT UPI
========================================================= */

router.post(
  "/upi/reference",
  submitUpiDonationReference
);


export default router;