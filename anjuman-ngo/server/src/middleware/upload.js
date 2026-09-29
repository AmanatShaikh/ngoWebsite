import multer from "multer";

import path from "node:path";

import fs from "node:fs";

import crypto from "node:crypto";

import {
  fileURLToPath,
} from "node:url";


const __filename =
  fileURLToPath(
    import.meta.url
  );


const __dirname =
  path.dirname(
    __filename
  );


export const STORAGE_ROOT =
  path.resolve(
    __dirname,
    "../../storage"
  );


const applicationStoragePath =
  path.join(
    STORAGE_ROOT,
    "applications"
  );


fs.mkdirSync(
  applicationStoragePath,
  {
    recursive: true,
  }
);


/* =========================================================
   ALLOWED DOCUMENT TYPES
========================================================= */

const allowedMimeTypes =
  new Set([
    "application/pdf",

    "image/jpeg",

    "image/png",
  ]);


const allowedExtensions =
  new Set([
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
  ]);


/* =========================================================
   STORAGE
========================================================= */

const storage =
  multer.diskStorage({

    destination(
      req,
      file,
      callback
    ) {
      callback(
        null,
        applicationStoragePath
      );
    },


    filename(
      req,
      file,
      callback
    ) {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();


      const randomName =
        crypto.randomUUID();


      callback(
        null,
        `${randomName}${extension}`
      );
    },

  });


/* =========================================================
   FILE FILTER
========================================================= */

function fileFilter(
  req,
  file,
  callback
) {
  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();


  const validMime =
    allowedMimeTypes.has(
      file.mimetype
    );


  const validExtension =
    allowedExtensions.has(
      extension
    );


  if (
    !validMime ||
    !validExtension
  ) {
    const error =
      new Error(
        "Only PDF, JPG, JPEG and PNG documents are allowed."
      );


    error.status = 400;


    return callback(
      error
    );
  }


  callback(
    null,
    true
  );
}


/* =========================================================
   APPLICATION UPLOAD
========================================================= */

export const applicationUpload =
  multer({

    storage,

    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,

      files:
        2,
    },

  }).fields([
    {
      name:
        "identityDocument",

      maxCount:
        1,
    },

    {
      name:
        "supportingDocument",

      maxCount:
        1,
    },
  ]);