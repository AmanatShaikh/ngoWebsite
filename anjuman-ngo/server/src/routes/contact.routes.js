import {
  Router,
} from "express";

import {
  rateLimit,
} from "express-rate-limit";

import {
  createContactMessage,
} from "../controllers/contact.controller.js";


const router =
  Router();


const contactLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      10,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success:
        false,

      message:
        "Too many enquiries were submitted. Please try again later.",
    },
  });


router.post(
  "/",
  contactLimiter,
  createContactMessage
);


export default router;