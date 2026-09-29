import {
  Router,
} from "express";

import {
  adminMe,
  downloadAdminApplicationDocument,
  getAdminApplicationById,
  getAdminApplications,
  getAdminDonations,
  getAdminOverview,
  getAdminUsers,
  updateApplicationStatus,
  updateUpiDonationStatus,
} from "../controllers/admin.controller.js";

import {
  requireAdmin,
  requireAuth,
} from "../middleware/auth.js";


const router =
  Router();


/* =========================================================
   EVERY ADMIN ROUTE IS PROTECTED
========================================================= */

router.use(
  requireAuth
);


router.use(
  requireAdmin
);


/* =========================================================
   CURRENT ADMIN
========================================================= */

router.get(
  "/me",
  adminMe
);


/* =========================================================
   OVERVIEW
========================================================= */

router.get(
  "/overview",
  getAdminOverview
);


/* =========================================================
   APPLICATIONS
========================================================= */

router.get(
  "/applications",
  getAdminApplications
);


router.get(
  "/applications/:id/documents/:documentId/download",
  downloadAdminApplicationDocument
);


router.get(
  "/applications/:id",
  getAdminApplicationById
);


router.patch(
  "/applications/:id/status",
  updateApplicationStatus
);


/* =========================================================
   USERS
========================================================= */

router.get(
  "/users",
  getAdminUsers
);


/* =========================================================
   DONATIONS
========================================================= */

router.get(
  "/donations",
  getAdminDonations
);


router.patch(
  "/donations/:id/status",
  updateUpiDonationStatus
);


export default router;