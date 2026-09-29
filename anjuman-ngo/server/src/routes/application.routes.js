import {
  Router,
} from "express";

import {
  createApplication,
  downloadApplicationDocument,
  getMyApplicationById,
  getMyApplications,
} from "../controllers/application.controller.js";

import {
  requireAuth,
} from "../middleware/auth.js";

import {
  applicationUpload,
} from "../middleware/upload.js";


const router =
  Router();


/* =========================================================
   ALL APPLICATION ROUTES REQUIRE LOGIN
========================================================= */

router.use(
  requireAuth
);


/* =========================================================
   CREATE APPLICATION
========================================================= */

router.post(
  "/",
  applicationUpload,
  createApplication
);


/* =========================================================
   CURRENT USER APPLICATIONS
========================================================= */

router.get(
  "/my",
  getMyApplications
);


/* =========================================================
   SECURE DOCUMENT DOWNLOAD
========================================================= */

router.get(
  "/:id/documents/:documentId/download",
  downloadApplicationDocument
);


/* =========================================================
   APPLICATION DETAIL
========================================================= */

router.get(
  "/:id",
  getMyApplicationById
);


export default router;