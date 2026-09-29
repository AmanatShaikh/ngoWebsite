import {
  z,
} from "zod";

import path from "node:path";

import fs from "node:fs/promises";

import crypto from "node:crypto";

import {
  prisma,
} from "../lib/prisma.js";

import {
  STORAGE_ROOT,
} from "../middleware/upload.js";


/* =========================================================
   COMMON VALIDATION
========================================================= */

const applicationSchema =
  z.object({

    type:
      z.enum([
        "MEDICAL",
        "SCHOLARSHIP",
        "LIVELIHOOD",
        "TRAVEL",
      ]),

    branch:
      z.enum([
        "NAGPADA",
        "DHARAVI",
      ]),

    applicantName:
      z
        .string()
        .trim()
        .min(
          2,
          "Applicant name is required."
        )
        .max(100),

    phone:
      z
        .string()
        .trim()
        .regex(
          /^[6-9]\d{9}$/,
          "Enter a valid 10-digit Indian mobile number."
        ),

    email:
      z
        .string()
        .trim()
        .email()
        .max(150)
        .optional()
        .or(
          z.literal("")
        ),

    age:
      z
        .union([
          z.string(),
          z.number(),
        ])
        .optional(),

    address:
      z
        .string()
        .trim()
        .min(
          5,
          "Residential address is required."
        )
        .max(1000),

    city:
      z
        .string()
        .trim()
        .max(100)
        .optional(),

    pincode:
      z
        .string()
        .trim()
        .regex(
          /^\d{6}$/,
          "PIN code must contain 6 digits."
        )
        .optional()
        .or(
          z.literal("")
        ),

    description:
      z
        .string()
        .trim()
        .min(
          10,
          "Please explain your request."
        )
        .max(3000),

    details:
      z.string(),

  });


/* =========================================================
   SERVICE-SPECIFIC VALIDATION
========================================================= */

const medicalDetailsSchema =
  z.object({

    hospitalName:
      z
        .string()
        .trim()
        .max(200)
        .optional(),

    estimatedCost:
      z
        .coerce
        .number()
        .min(0)
        .optional(),

    medicalCondition:
      z
        .string()
        .trim()
        .min(
          2,
          "Medical condition or treatment information is required."
        )
        .max(2000),

    urgency:
      z
        .enum([
          "ROUTINE",
          "URGENT",
          "EMERGENCY",
        ])
        .optional(),

  });


const scholarshipDetailsSchema =
  z.object({

    institution:
      z
        .string()
        .trim()
        .min(
          2,
          "Institution is required."
        )
        .max(250),

    course:
      z
        .string()
        .trim()
        .min(
          1,
          "Course or class is required."
        )
        .max(200),

    academicYear:
      z
        .string()
        .trim()
        .max(30)
        .optional(),

    fees:
      z
        .coerce
        .number()
        .min(0)
        .optional(),

  });


const livelihoodDetailsSchema =
  z.object({

    employmentStatus:
      z
        .enum([
          "UNEMPLOYED",
          "EMPLOYED",
          "SELF_EMPLOYED",
          "DAILY_WAGE",
        ])
        .optional(),

    monthlyIncome:
      z
        .coerce
        .number()
        .min(0)
        .optional(),

    skills:
      z
        .string()
        .trim()
        .max(2000)
        .optional(),

    supportNeeded:
      z
        .string()
        .trim()
        .min(
          2,
          "Describe the livelihood support required."
        )
        .max(2000),

  });


const travelDetailsSchema =
  z.object({

    origin:
      z
        .string()
        .trim()
        .min(
          2,
          "Travel origin is required."
        )
        .max(200),

    destination:
      z
        .string()
        .trim()
        .min(
          2,
          "Destination is required."
        )
        .max(200),

    travelDate:
      z
        .string()
        .trim()
        .max(30)
        .optional(),

    passengers:
      z
        .coerce
        .number()
        .int()
        .min(1)
        .max(20)
        .optional(),

    travelReason:
      z
        .string()
        .trim()
        .min(
          2,
          "Travel reason is required."
        )
        .max(2000),

  });


/* =========================================================
   UTILITIES
========================================================= */

function cleanOptionalString(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }


  const cleaned =
    String(value).trim();


  return cleaned || undefined;
}


function parseAge(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }


  const age =
    Number(value);


  if (
    !Number.isInteger(age) ||
    age < 1 ||
    age > 120
  ) {
    const error =
      new Error(
        "Age must be between 1 and 120."
      );


    error.status = 400;


    throw error;
  }


  return age;
}


function parseDetails(
  rawDetails
) {
  try {
    return JSON.parse(
      rawDetails
    );
  } catch {
    const error =
      new Error(
        "Application service details are invalid."
      );


    error.status = 400;


    throw error;
  }
}


function validateServiceDetails(
  type,
  details
) {
  const schemas = {

    MEDICAL:
      medicalDetailsSchema,

    SCHOLARSHIP:
      scholarshipDetailsSchema,

    LIVELIHOOD:
      livelihoodDetailsSchema,

    TRAVEL:
      travelDetailsSchema,

  };


  const schema =
    schemas[type];


  const result =
    schema.safeParse(
      details
    );


  if (!result.success) {
    const error =
      new Error(
        result.error
          .issues[0]
          ?.message ||
        "Invalid service information."
      );


    error.status = 400;

    error.validation =
      result.error.flatten();


    throw error;
  }


  return result.data;
}


/* =========================================================
   REFERENCE NUMBER
========================================================= */

async function generateReferenceNumber() {
  const year =
    new Date()
      .getFullYear();


  for (
    let attempt = 0;
    attempt < 10;
    attempt += 1
  ) {
    const code =
      crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();


    const referenceNumber =
      `ABE-${year}-${code}`;


    const existing =
      await prisma.application.findUnique({
        where: {
          referenceNumber,
        },

        select: {
          id: true,
        },
      });


    if (!existing) {
      return referenceNumber;
    }
  }


  throw new Error(
    "Unable to generate an application reference number."
  );
}


/* =========================================================
   FILE HELPERS
========================================================= */

function getUploadedFiles(
  req
) {
  const files = [];


  const identity =
    req.files
      ?.identityDocument
      ?.[0];


  const supporting =
    req.files
      ?.supportingDocument
      ?.[0];


  if (identity) {
    files.push({
      file:
        identity,

      type:
        "IDENTITY",
    });
  }


  if (supporting) {
    files.push({
      file:
        supporting,

      type:
        "SUPPORTING",
    });
  }


  return files;
}


function getStorageKey(
  file
) {
  return path
    .join(
      "applications",
      file.filename
    )
    .replaceAll(
      "\\",
      "/"
    );
}


async function deleteUploadedFiles(
  req
) {
  const uploadedFiles =
    getUploadedFiles(req);


  await Promise.allSettled(
    uploadedFiles.map(
      ({ file }) =>
        fs.unlink(
          file.path
        )
    )
  );
}


/* =========================================================
   CREATE APPLICATION
========================================================= */

export async function createApplication(
  req,
  res,
  next
) {
  try {
    const validation =
      applicationSchema.safeParse(
        req.body
      );


    if (!validation.success) {
      await deleteUploadedFiles(
        req
      );


      return res
        .status(400)
        .json({
          success: false,

          message:
            validation.error
              .issues[0]
              ?.message ||
            "Invalid application information.",

          errors:
            validation.error.flatten(),
        });
    }


    const input =
      validation.data;


    const rawDetails =
      parseDetails(
        input.details
      );


    const details =
      validateServiceDetails(
        input.type,
        rawDetails
      );


    const age =
      parseAge(
        input.age
      );


    const referenceNumber =
      await generateReferenceNumber();


    const uploadedFiles =
      getUploadedFiles(
        req
      );


    const application =
      await prisma.$transaction(
        async (tx) => {

          const created =
            await tx.application.create({

              data: {

                referenceNumber,

                userId:
                  req.user.id,

                type:
                  input.type,

                branch:
                  input.branch,

                status:
                  "PENDING",

                applicantName:
                  input.applicantName.trim(),

                phone:
                  input.phone.trim(),

                email:
                  cleanOptionalString(
                    input.email
                  )
                    ?.toLowerCase() ||
                  null,

                age,

                address:
                  input.address.trim(),

                city:
                  cleanOptionalString(
                    input.city
                  ) ||
                  null,

                pincode:
                  cleanOptionalString(
                    input.pincode
                  ) ||
                  null,

                description:
                  input.description.trim(),

                details,

              },

            });


          if (
            uploadedFiles.length
          ) {
            await tx.applicationDocument.createMany({

              data:
                uploadedFiles.map(
                  ({
                    file,
                    type,
                  }) => ({

                    applicationId:
                      created.id,

                    type,

                    originalName:
                      file.originalname,

                    storageKey:
                      getStorageKey(
                        file
                      ),

                    mimeType:
                      file.mimetype,

                    size:
                      file.size,

                  })
                ),

            });
          }


          await tx.applicationStatusHistory.create({

            data: {

              applicationId:
                created.id,

              fromStatus:
                null,

              toStatus:
                "PENDING",

              note:
                "Application submitted.",

              changedById:
                req.user.id,

            },

          });


          return tx.application.findUnique({

            where: {
              id:
                created.id,
            },

            include: {

              documents: {
                select: {
                  id: true,
                  type: true,
                  originalName: true,
                  mimeType: true,
                  size: true,
                  createdAt: true,
                },
              },

              statusHistory: {
                orderBy: {
                  createdAt:
                    "asc",
                },

                select: {
                  id: true,
                  fromStatus: true,
                  toStatus: true,
                  note: true,
                  createdAt: true,
                },
              },

            },

          });

        }
      );


    return res
      .status(201)
      .json({
        success: true,

        message:
          "Application submitted successfully.",

        application,
      });

  } catch (error) {

    /*
      Multer saves files before the
      database transaction occurs.

      If anything after upload fails,
      clean those files up.
    */

    await deleteUploadedFiles(
      req
    );


    next(error);
  }
}


/* =========================================================
   CURRENT USER APPLICATIONS
========================================================= */

export async function getMyApplications(
  req,
  res,
  next
) {
  try {
    const applications =
      await prisma.application.findMany({

        where: {
          userId:
            req.user.id,
        },

        orderBy: {
          createdAt:
            "desc",
        },

        select: {

          id: true,

          referenceNumber: true,

          type: true,

          branch: true,

          status: true,

          applicantName: true,

          createdAt: true,

          updatedAt: true,

        },

      });


    return res.json({
      success: true,

      applications,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   APPLICATION DETAIL
========================================================= */

export async function getMyApplicationById(
  req,
  res,
  next
) {
  try {
    const {
      id,
    } =
      req.params;


    const application =
      await prisma.application.findFirst({

        where: {

          id,

          userId:
            req.user.id,

        },

        include: {

          documents: {

            select: {
              id: true,
              type: true,
              originalName: true,
              mimeType: true,
              size: true,
              createdAt: true,
            },

          },

          statusHistory: {

            orderBy: {
              createdAt:
                "asc",
            },

            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              note: true,
              createdAt: true,
            },

          },

        },

      });


    if (!application) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Application not found.",
        });
    }


    return res.json({
      success: true,

      application,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   DOWNLOAD OWN DOCUMENT
========================================================= */

export async function downloadApplicationDocument(
  req,
  res,
  next
) {
  try {
    const {
      id,
      documentId,
    } =
      req.params;


    const document =
      await prisma.applicationDocument.findFirst({

        where: {

          id:
            documentId,

          applicationId:
            id,

          application: {
            userId:
              req.user.id,
          },

        },

      });


    if (!document) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Document not found.",
        });
    }


    const absolutePath =
      path.resolve(
        STORAGE_ROOT,
        document.storageKey
      );


    const safeStorageRoot =
      `${path.resolve(
        STORAGE_ROOT
      )}${path.sep}`;


    if (
      !absolutePath.startsWith(
        safeStorageRoot
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid document path.",
        });
    }


    try {
      await fs.access(
        absolutePath
      );
    } catch {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Stored document file was not found.",
        });
    }


    return res.download(
      absolutePath,
      document.originalName
    );

  } catch (error) {
    next(error);
  }
}