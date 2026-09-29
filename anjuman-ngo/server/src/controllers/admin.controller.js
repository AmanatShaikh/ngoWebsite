import path from "node:path";

import fs from "node:fs/promises";

import {
  z,
} from "zod";

import {
  prisma,
} from "../lib/prisma.js";

import {
  STORAGE_ROOT,
} from "../middleware/upload.js";


/* =========================================================
   CONSTANTS
========================================================= */

const APPLICATION_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
];


const APPLICATION_TYPES = [
  "MEDICAL",
  "SCHOLARSHIP",
  "LIVELIHOOD",
  "TRAVEL",
];


const BRANCHES = [
  "NAGPADA",
  "DHARAVI",
];


/* =========================================================
   VALIDATION
========================================================= */

const updateApplicationStatusSchema =
  z.object({
    status:
      z.enum([
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
      ]),

    note:
      z
        .string()
        .trim()
        .max(2000)
        .nullable()
        .optional(),
  });


const updateUpiDonationStatusSchema =
  z.object({
    status:
      z.enum([
        "VERIFIED",
        "FAILED",
      ]),
  });


/* =========================================================
   HELPERS
========================================================= */

function parseQueryValue(
  value
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }


  return value.trim();
}


function decimalToNumber(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }


  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : 0;
}


function normalizeApplication(
  application
) {
  return {
    ...application,

    documents:
      application.documents ||
      [],

    statusHistory:
      application.statusHistory ||
      [],
  };
}


/* =========================================================
   ADMIN CURRENT USER
========================================================= */

export function adminMe(
  req,
  res
) {
  return res.json({
    success: true,

    user:
      req.user,
  });
}


/* =========================================================
   OVERVIEW
========================================================= */

export async function getAdminOverview(
  req,
  res,
  next
) {
  try {
    const [
      totalApplications,

      pendingApplications,

      totalUsers,

      verifiedDonationAggregate,

      nagpadaTotal,

      nagpadaPending,

      nagpadaReview,

      nagpadaApproved,

      dharaviTotal,

      dharaviPending,

      dharaviReview,

      dharaviApproved,

      recentApplications,
    ] =
      await Promise.all([

        /* Total applications */

        prisma.application.count(),


        /* Pending applications */

        prisma.application.count({
          where: {
            status:
              "PENDING",
          },
        }),


        /* Users */

        prisma.user.count({
          where: {
            role:
              "USER",
          },
        }),


        /* Verified donation total */

        prisma.donation.aggregate({
          where: {
            status:
              "VERIFIED",
          },

          _sum: {
            amount:
              true,
          },
        }),


        /* Nagpada */

        prisma.application.count({
          where: {
            branch:
              "NAGPADA",
          },
        }),

        prisma.application.count({
          where: {
            branch:
              "NAGPADA",

            status:
              "PENDING",
          },
        }),

        prisma.application.count({
          where: {
            branch:
              "NAGPADA",

            status:
              "UNDER_REVIEW",
          },
        }),

        prisma.application.count({
          where: {
            branch:
              "NAGPADA",

            status:
              "APPROVED",
          },
        }),


        /* Dharavi */

        prisma.application.count({
          where: {
            branch:
              "DHARAVI",
          },
        }),

        prisma.application.count({
          where: {
            branch:
              "DHARAVI",

            status:
              "PENDING",
          },
        }),

        prisma.application.count({
          where: {
            branch:
              "DHARAVI",

            status:
              "UNDER_REVIEW",
          },
        }),

        prisma.application.count({
          where: {
            branch:
              "DHARAVI",

            status:
              "APPROVED",
          },
        }),


        /* Recent */

        prisma.application.findMany({
          orderBy: {
            createdAt:
              "desc",
          },

          take:
            6,

          select: {
            id:
              true,

            referenceNumber:
              true,

            applicantName:
              true,

            type:
              true,

            branch:
              true,

            status:
              true,

            createdAt:
              true,
          },
        }),

      ]);


    const donationTotal =
      decimalToNumber(
        verifiedDonationAggregate
          ._sum
          .amount
      );


    return res.json({
      success:
        true,

      overview: {

        applications: {
          total:
            totalApplications,

          pending:
            pendingApplications,
        },

        totalApplications,

        pendingApplications,

        totalUsers,

        donationTotal,

        donations: {
          totalAmount:
            donationTotal,
        },

        branches: {

          NAGPADA: {
            total:
              nagpadaTotal,

            pending:
              nagpadaPending,

            underReview:
              nagpadaReview,

            approved:
              nagpadaApproved,
          },


          DHARAVI: {
            total:
              dharaviTotal,

            pending:
              dharaviPending,

            underReview:
              dharaviReview,

            approved:
              dharaviApproved,
          },

        },

        recentApplications,
      },
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   ADMIN APPLICATIONS
========================================================= */

export async function getAdminApplications(
  req,
  res,
  next
) {
  try {
    const search =
      parseQueryValue(
        req.query.search
      );


    const branch =
      parseQueryValue(
        req.query.branch
      );


    const type =
      parseQueryValue(
        req.query.type
      );


    const status =
      parseQueryValue(
        req.query.status
      );


    /* Validate filter values */

    if (
      branch &&
      !BRANCHES.includes(
        branch
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Invalid branch filter.",
        });
    }


    if (
      type &&
      !APPLICATION_TYPES.includes(
        type
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Invalid application type filter.",
        });
    }


    if (
      status &&
      !APPLICATION_STATUSES.includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Invalid application status filter.",
        });
    }


    const where = {};


    if (branch) {
      where.branch =
        branch;
    }


    if (type) {
      where.type =
        type;
    }


    if (status) {
      where.status =
        status;
    }


    if (search) {
      where.OR = [
        {
          applicantName: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },

        {
          referenceNumber: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },

        {
          phone: {
            contains:
              search,
          },
        },

        {
          email: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },
      ];
    }


    const applications =
      await prisma.application.findMany({
        where,

        orderBy: {
          createdAt:
            "desc",
        },

        select: {
          id:
            true,

          referenceNumber:
            true,

          applicantName:
            true,

          phone:
            true,

          email:
            true,

          type:
            true,

          branch:
            true,

          status:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          user: {
            select: {
              id:
                true,

              name:
                true,

              username:
                true,

              email:
                true,
            },
          },
        },
      });


    return res.json({
      success:
        true,

      applications,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   SINGLE APPLICATION
========================================================= */

export async function getAdminApplicationById(
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
      await prisma.application.findUnique({
        where: {
          id,
        },

        include: {

          user: {
            select: {
              id:
                true,

              name:
                true,

              username:
                true,

              email:
                true,

              phone:
                true,

              role:
                true,
            },
          },


          documents: {
            orderBy: {
              createdAt:
                "asc",
            },

            select: {
              id:
                true,

              type:
                true,

              originalName:
                true,

              mimeType:
                true,

              size:
                true,

              createdAt:
                true,
            },
          },


          statusHistory: {
            orderBy: {
              createdAt:
                "asc",
            },

            include: {
              changedBy: {
                select: {
                  id:
                    true,

                  name:
                    true,

                  username:
                    true,

                  role:
                    true,
                },
              },
            },
          },

        },
      });


    if (!application) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Application not found.",
        });
    }


    return res.json({
      success:
        true,

      application:
        normalizeApplication(
          application
        ),
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   APPLICATION STATUS UPDATE
========================================================= */

export async function updateApplicationStatus(
  req,
  res,
  next
) {
  try {
    const validation =
      updateApplicationStatusSchema
        .safeParse(
          req.body
        );


    if (
      !validation.success
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            validation.error
              .issues[0]
              ?.message ||
            "Invalid status update.",
        });
    }


    const {
      id,
    } =
      req.params;


    const {
      status,
      note,
    } =
      validation.data;


    const existing =
      await prisma.application.findUnique({
        where: {
          id,
        },

        select: {
          id:
            true,

          status:
            true,
        },
      });


    if (!existing) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Application not found.",
        });
    }


    if (
      existing.status ===
      status
    ) {
      return res.json({
        success:
          true,

        message:
          "Application already has this status.",
      });
    }


    const updatedApplication =
      await prisma.$transaction(
        async (tx) => {

          const updated =
            await tx.application.update({
              where: {
                id,
              },

              data: {
                status,

                adminNote:
                  note ||
                  undefined,
              },
            });


          await tx.applicationStatusHistory.create({
            data: {
              applicationId:
                id,

              fromStatus:
                existing.status,

              toStatus:
                status,

              note:
                note ||
                null,

              changedById:
                req.user.id,
            },
          });


          return updated;
        }
      );


    return res.json({
      success:
        true,

      message:
        "Application status updated successfully.",

      application:
        updatedApplication,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   ADMIN DOCUMENT DOWNLOAD
========================================================= */

export async function downloadAdminApplicationDocument(
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


    const documentRecord =
      await prisma.applicationDocument.findFirst({
        where: {
          id:
            documentId,

          applicationId:
            id,
        },
      });


    if (!documentRecord) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Document not found.",
        });
    }


    const absolutePath =
      path.resolve(
        STORAGE_ROOT,
        documentRecord.storageKey
      );


    const storageRoot =
      `${path.resolve(
        STORAGE_ROOT
      )}${path.sep}`;


    if (
      !absolutePath.startsWith(
        storageRoot
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

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
          success:
            false,

          message:
            "Stored document file was not found.",
        });
    }


    return res.download(
      absolutePath,
      documentRecord.originalName
    );

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   USERS
========================================================= */

export async function getAdminUsers(
  req,
  res,
  next
) {
  try {
    const search =
      parseQueryValue(
        req.query.search
      );


    const where =
      search
        ? {
            OR: [
              {
                name: {
                  contains:
                    search,

                  mode:
                    "insensitive",
                },
              },

              {
                username: {
                  contains:
                    search,

                  mode:
                    "insensitive",
                },
              },

              {
                email: {
                  contains:
                    search,

                  mode:
                    "insensitive",
                },
              },

              {
                phone: {
                  contains:
                    search,
                },
              },
            ],
          }
        : {};


    const users =
      await prisma.user.findMany({
        where,

        orderBy: {
          createdAt:
            "desc",
        },

        select: {
          id:
            true,

          name:
            true,

          username:
            true,

          email:
            true,

          phone:
            true,

          role:
            true,

          isActive:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          _count: {
            select: {
              applications:
                true,

              donations:
                true,
            },
          },
        },
      });


    return res.json({
      success:
        true,

      users,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   DONATIONS
========================================================= */

export async function getAdminDonations(
  req,
  res,
  next
) {
  try {
    const method =
      parseQueryValue(
        req.query.method
      );


    const status =
      parseQueryValue(
        req.query.status
      );


    const where = {};


    if (
      method === "UPI" ||
      method === "RAZORPAY"
    ) {
      where.method =
        method;
    }


    if (
      [
        "PENDING",
        "VERIFIED",
        "FAILED",
        "REFUNDED",
      ].includes(
        status
      )
    ) {
      where.status =
        status;
    }


    const donations =
      await prisma.donation.findMany({
        where,

        orderBy: {
          createdAt:
            "desc",
        },

        select: {
          id:
            true,

          donorName:
            true,

          email:
            true,

          phone:
            true,

          amount:
            true,

          currency:
            true,

          method:
            true,

          status:
            true,

          razorpayOrderId:
            true,

          razorpayPaymentId:
            true,

          upiReference:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          user: {
            select: {
              id:
                true,

              name:
                true,

              username:
                true,
            },
          },
        },
      });


    const response =
      donations.map(
        (donation) => ({
          ...donation,

          amount:
            decimalToNumber(
              donation.amount
            ),
        })
      );


    return res.json({
      success:
        true,

      donations:
        response,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   VERIFY / REJECT DIRECT UPI DONATION
========================================================= */

export async function updateUpiDonationStatus(
  req,
  res,
  next
) {
  try {
    const validation =
      updateUpiDonationStatusSchema
        .safeParse(
          req.body
        );


    if (
      !validation.success
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Status must be VERIFIED or FAILED.",
        });
    }


    const {
      id,
    } =
      req.params;


    const donation =
      await prisma.donation.findUnique({
        where: {
          id,
        },
      });


    if (!donation) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Donation not found.",
        });
    }


    /*
      Razorpay donations must only become
      verified through Razorpay's payment
      verification/webhook process.

      Admin manual verification is only
      permitted for direct UPI donations.
    */

    if (
      donation.method !==
      "UPI"
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Only direct UPI donations can be manually verified.",
        });
    }


    if (
      donation.status !==
        "PENDING" &&
      donation.status !==
        "FAILED"
    ) {
      return res
        .status(409)
        .json({
          success:
            false,

          message:
            "This donation can no longer be manually changed.",
        });
    }


    const updated =
      await prisma.donation.update({
        where: {
          id,
        },

        data: {
          status:
            validation.data.status,
        },
      });


    return res.json({
      success:
        true,

      message:
        updated.status ===
        "VERIFIED"
          ? "UPI donation marked as verified."
          : "UPI donation marked as failed.",

      donation: {
        ...updated,

        amount:
          decimalToNumber(
            updated.amount
          ),
      },
    });

  } catch (error) {
    next(error);
  }
}