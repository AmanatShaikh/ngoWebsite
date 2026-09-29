import express from "express";

import cors from "cors";

import helmet from "helmet";

import morgan from "morgan";

import cookieParser from "cookie-parser";

import multer from "multer";

import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import authRoutes
  from "./routes/auth.routes.js";

import applicationRoutes
  from "./routes/application.routes.js";

import donationRoutes
  from "./routes/donation.routes.js";

import {
  razorpayWebhook,
} from "./controllers/donation.controller.js";

import {
  prisma,
} from "./lib/prisma.js";

import adminRoutes
  from "./routes/admin.routes.js";

const app =
  express();


/* =========================================================
   PATHS
========================================================= */

const __filename =
  fileURLToPath(
    import.meta.url
  );


const __dirname =
  path.dirname(
    __filename
  );


const clientPath =
  path.resolve(
    __dirname,
    "../../client"
  );


/* =========================================================
   APP CONFIGURATION
========================================================= */

app.disable(
  "x-powered-by"
);


/* =========================================================
   SECURITY
========================================================= */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy:
        "cross-origin",
    },
  })
);


/* =========================================================
   CORS
========================================================= */

const allowedOrigins =
  (
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5500,http://127.0.0.1:5500"
  )
    .split(",")
    .map(
      (origin) =>
        origin.trim()
    )
    .filter(Boolean);


app.use(
  cors({
    credentials:
      true,

    origin(
      origin,
      callback
    ) {
      /*
        Requests without an Origin header
        include curl, Postman, server-to-server,
        and some same-origin requests.
      */

      if (!origin) {
        return callback(
          null,
          true
        );
      }


      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }


      const error =
        new Error(
          "Origin not allowed by CORS."
        );


      error.status =
        403;


      return callback(
        error
      );
    },
  })
);


/* =========================================================
   LOGGING
========================================================= */

if (
  process.env.NODE_ENV !==
  "test"
) {
  app.use(
    morgan("dev")
  );
}


/* =========================================================
   RAZORPAY WEBHOOK
   IMPORTANT:
   Must be registered BEFORE express.json()
========================================================= */

app.post(
  "/api/donations/webhook",

  express.raw({
    type:
      "application/json",

    limit:
      "1mb",
  }),

  razorpayWebhook
);


/* =========================================================
   REQUEST PARSING
========================================================= */

app.use(
  express.json({
    limit:
      "1mb",
  })
);


app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      "1mb",
  })
);


app.use(
  cookieParser()
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",

  async (
    req,
    res
  ) => {
    try {
      await prisma.$queryRaw`
        SELECT 1
      `;


      return res
        .status(200)
        .json({
          success:
            true,

          service:
            "anjuman-ngo-api",

          database:
            "connected",

          timestamp:
            new Date()
              .toISOString(),
        });

    } catch (error) {
      console.error(
        "DATABASE_HEALTH_ERROR:",
        error
      );


      return res
        .status(503)
        .json({
          success:
            false,

          service:
            "anjuman-ngo-api",

          database:
            "unavailable",
        });
    }
  }
);


/* =========================================================
   API ROOT
========================================================= */

app.get(
  "/api",

  (
    req,
    res
  ) => {
    return res.json({
      success:
        true,

      message:
        "Anjuman Bashindgan-E-Bihar API",

      version:
        "1.0.0",
    });
  }
);


/* =========================================================
   API ROUTES
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);


app.use(
  "/api/applications",
  applicationRoutes
);


app.use(
  "/api/donations",
  donationRoutes
);




/* =========================================================
   API ROUTES
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);


app.use(
  "/api/applications",
  applicationRoutes
);


app.use(
  "/api/donations",
  donationRoutes
);


app.use(
  "/api/admin",
  adminRoutes
);


/* =========================================================
   API 404
========================================================= */

app.use(
  "/api",

  (
    req,
    res
  ) => {
    return res
      .status(404)
      .json({
        success:
          false,

        message:
          "API endpoint not found.",
      });
  }
);


/* =========================================================
   FRONTEND STATIC FILES
========================================================= */

app.use(
  express.static(
    clientPath
  )
);


/* =========================================================
   HOME
========================================================= */

app.get(
  "/",

  (
    req,
    res
  ) => {
    return res.sendFile(
      path.join(
        clientPath,
        "index.html"
      )
    );
  }
);


/* =========================================================
   GLOBAL ERROR HANDLER
   IMPORTANT:
   Keep this LAST.
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER_ERROR:",
      error
    );


    /* =====================================================
       MULTER ERRORS
    ===================================================== */

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Each document must be 5 MB or smaller.",
          });
      }


      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Too many documents were uploaded.",
          });
      }


      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "An unexpected document field was uploaded.",
          });
      }


      return res
        .status(400)
        .json({
          success:
            false,

          message:
            error.message ||
            "Document upload failed.",
        });
    }


    /* =====================================================
       NORMAL APPLICATION ERRORS
    ===================================================== */

    const status =
      error.status ||
      error.statusCode ||
      500;


    const response = {
      success:
        false,

      message:
        status === 500
          ? "Internal server error."
          : error.message ||
            "The request could not be completed.",
    };


    /*
      Validation details are useful
      during local development only.
    */

    if (
      process.env.NODE_ENV ===
        "development" &&
      error.validation
    ) {
      response.validation =
        error.validation;
    }


    return res
      .status(status)
      .json(response);
  }
);


export default app;

