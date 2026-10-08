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

const APPLICATION_STATUS_TRANSITIONS = {
  PENDING: [
    "UNDER_REVIEW",
    "REJECTED",
  ],

  UNDER_REVIEW: [
    "APPROVED",
    "REJECTED",
  ],

  APPROVED: [
    "COMPLETED",
  ],

  REJECTED: [],

  COMPLETED: [],
};

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

const CONTACT_SUBJECTS = [
  "medical",
  "education",
  "livelihood",
  "travel",
  "donation",
  "general",
];

const CONTACT_STATUS_TRANSITIONS = {
  NEW: ["READ", "RESOLVED"],
  READ: ["RESOLVED"],
  RESOLVED: [],
};

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

const updateUserStatusSchema =
  z.object({
    isActive:
      z.boolean(),
  });

const updateContactStatusSchema =
  z.object({
    status: z.enum(["NEW", "READ", "RESOLVED"]),
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

function getAllowedApplicationStatuses(
  currentStatus
) {
  return (
    APPLICATION_STATUS_TRANSITIONS[
    currentStatus
    ] ||
    []
  );
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
      applicationStatusGroups,
      totalUsers,
      verifiedDonationAggregate,
      verifiedDonationCount,
      totalEnquiries,
      newEnquiries,
      branchStatusGroups,
      recentApplications,
    ] =
      await Promise.all([

        /* Total applications */

        prisma.application.count(),


        /* Application counts by status */

        prisma.application.groupBy({
          by: [
            "status",
          ],

          _count: {
            _all:
              true,
          },
        }),


        /* Normal users */

        prisma.user.count({
          where: {
            role:
              "USER",
          },
        }),


        /* Verified donation amount */

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


        /* Verified donation count */

        prisma.donation.count({
          where: {
            status:
              "VERIFIED",
          },
        }),

        prisma.contactMessage.count(),

        prisma.contactMessage.count({
          where: { status: "NEW" },
        }),


        /* Branch + status counts */

        prisma.application.groupBy({
          by: [
            "branch",
            "status",
          ],

          _count: {
            _all:
              true,
          },
        }),


        /* Recent applications */

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
          },
        }),

      ]);


    function getStatusCount(
      status
    ) {
      return (
        applicationStatusGroups
          .find(
            (item) =>
              item.status ===
              status
          )
          ?._count
          ?._all ||
        0
      );
    }


    function getBranchStatusCount(
      branch,
      status
    ) {
      return (
        branchStatusGroups
          .find(
            (item) =>
              item.branch ===
              branch &&
              item.status ===
              status
          )
          ?._count
          ?._all ||
        0
      );
    }


    function buildBranchOverview(
      branch
    ) {
      const pending =
        getBranchStatusCount(
          branch,
          "PENDING"
        );


      const underReview =
        getBranchStatusCount(
          branch,
          "UNDER_REVIEW"
        );


      const approved =
        getBranchStatusCount(
          branch,
          "APPROVED"
        );


      const completed =
        getBranchStatusCount(
          branch,
          "COMPLETED"
        );


      const rejected =
        getBranchStatusCount(
          branch,
          "REJECTED"
        );


      return {
        total:
          pending +
          underReview +
          approved +
          completed +
          rejected,

        pending,

        underReview,

        approved,

        completed,

        rejected,
      };
    }


    const donationTotal =
      decimalToNumber(
        verifiedDonationAggregate
          ._sum
          .amount
      );


    const applications = {
      total:
        totalApplications,

      pending:
        getStatusCount(
          "PENDING"
        ),

      underReview:
        getStatusCount(
          "UNDER_REVIEW"
        ),

      approved:
        getStatusCount(
          "APPROVED"
        ),

      completed:
        getStatusCount(
          "COMPLETED"
        ),

      rejected:
        getStatusCount(
          "REJECTED"
        ),
    };


    return res.json({
      success:
        true,

      overview: {

        applications,

        users: {
          total:
            totalUsers,
        },

        donations: {
          verifiedCount:
            verifiedDonationCount,

          totalAmount:
            donationTotal,
        },

        enquiries: {
          total: totalEnquiries,
          new: newEnquiries,
        },

        branches: {
          NAGPADA:
            buildBranchOverview(
              "NAGPADA"
            ),

          DHARAVI:
            buildBranchOverview(
              "DHARAVI"
            ),
        },

        recentApplications,
      },
    });

  } catch (error) {
    next(error);
  }
}

/* =========================================================
   ADMIN ENQUIRIES
========================================================= */

export async function getAdminEnquiries(req, res, next) {
  try {
    const search = parseQueryValue(req.query.search);
    const status = parseQueryValue(req.query.status);
    const subject = parseQueryValue(req.query.subject);

    if (status && !["NEW", "READ", "RESOLVED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid enquiry status." });
    }

    if (subject && !CONTACT_SUBJECTS.includes(subject)) {
      return res.status(400).json({ success: false, message: "Invalid enquiry subject." });
    }

    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const enquiries = await prisma.contactMessage.findMany({
      where: {
        ...searchFilter,
        ...(status ? { status } : {}),
        ...(subject ? { subject } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ success: true, enquiries });
  } catch (error) {
    next(error);
  }
}

export async function getAdminEnquiryById(req, res, next) {
  try {
    const enquiry = await prisma.contactMessage.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found." });
    }

    return res.json({ success: true, enquiry });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminEnquiryStatus(req, res, next) {
  try {
    const validation = updateContactStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ success: false, message: "Status must be NEW, READ or RESOLVED." });
    }

    const enquiry = await prisma.contactMessage.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found." });
    }

    const nextStatus = validation.data.status;
    if (enquiry.status === nextStatus || !CONTACT_STATUS_TRANSITIONS[enquiry.status]?.includes(nextStatus)) {
      return res.status(409).json({ success: false, message: "This enquiry status transition is not allowed." });
    }

    const updated = await prisma.contactMessage.update({
      where: { id: enquiry.id },
      data: { status: nextStatus },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ success: true, enquiry: updated });
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


    /* =====================================================
       SAME STATUS
    ===================================================== */

    if (
      existing.status ===
      status
    ) {
      return res
        .status(409)
        .json({
          success:
            false,

          message:
            "The application already has this status.",
        });
    }


    /* =====================================================
       TRANSITION VALIDATION
    ===================================================== */

    const allowedStatuses =
      getAllowedApplicationStatuses(
        existing.status
      );


    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res
        .status(409)
        .json({
          success:
            false,

          message:
            `Cannot change application status from ${existing.status} to ${status}.`,
        });
    }


    /* =====================================================
       REJECTION NOTE REQUIRED
    ===================================================== */

    if (
      status ===
      "REJECTED" &&
      !note
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "A status note is required when rejecting an application.",
        });
    }


    /* =====================================================
       UPDATE + HISTORY
    ===================================================== */

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

                /*
                 * adminNote represents the latest
                 * applicant-visible status note.
                 *
                 * Clear it when the new update
                 * does not contain a note.
                 */
                adminNote:
                  note ||
                  null,
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


    const role =
      parseQueryValue(
        req.query.role
      ).toUpperCase();


    const status =
      parseQueryValue(
        req.query.status
      ).toUpperCase();


    if (
      role &&
      ![
        "USER",
        "ADMIN",
      ].includes(role)
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Invalid user role filter.",
        });
    }


    if (
      status &&
      ![
        "ACTIVE",
        "DISABLED",
      ].includes(status)
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Invalid account status filter.",
        });
    }


    const filters =
      [];


    if (search) {
      filters.push({
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
      });
    }


    if (role) {
      filters.push({
        role,
      });
    }


    if (status) {
      filters.push({
        isActive:
          status ===
          "ACTIVE",
      });
    }


    const where =
      filters.length
        ? {
          AND:
            filters,
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

export async function updateAdminUserStatus(
  req,
  res,
  next
) {
  try {
    const validation =
      updateUserStatusSchema.safeParse(
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
            "Invalid account status.",
        });
    }


    const user =
      await prisma.user.findUnique({
        where: {
          id:
            req.params.id,
        },

        select: {
          id:
            true,

          role:
            true,

          isActive:
            true,
        },
      });


    if (!user) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "User not found.",
        });
    }


    /*
     * Admin accounts are protected.
     * This screen only manages applicant accounts.
     */
    if (
      user.role ===
      "ADMIN"
    ) {
      return res
        .status(403)
        .json({
          success:
            false,

          message:
            "Administrator accounts cannot be changed from user management.",
        });
    }


    const {
      isActive,
    } =
      validation.data;


    if (
      user.isActive ===
      isActive
    ) {
      return res
        .status(409)
        .json({
          success:
            false,

          message:
            isActive
              ? "This user is already active."
              : "This user is already disabled.",
        });
    }


    const updated =
      await prisma.user.update({
        where: {
          id:
            user.id,
        },

        data: {
          isActive,
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

          updatedAt:
            true,
        },
      });


    return res.json({
      success:
        true,

      message:
        isActive
          ? "User account activated successfully."
          : "User account disabled successfully.",

      user:
        updated,
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
    const search =
      parseQueryValue(
        req.query.search
      );


    const method =
      parseQueryValue(
        req.query.method
      ).toUpperCase();


    const status =
      parseQueryValue(
        req.query.status
      ).toUpperCase();


    if (
      method &&
      ![
        "UPI",
        "RAZORPAY",
      ].includes(method)
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid donation method.",
        });
    }


    if (
      status &&
      ![
        "PENDING",
        "VERIFIED",
        "FAILED",
        "REFUNDED",
      ].includes(status)
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid donation status.",
        });
    }


    const filters = [];


    if (method) {
      filters.push({
        method,
      });
    }


    if (status) {
      filters.push({
        status,
      });
    }


    if (search) {
      filters.push({
        OR: [
          {
            donorName: {
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

          {
            upiReference: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            razorpayOrderId: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            razorpayPaymentId: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },
        ],
      });
    }


    const where =
      filters.length
        ? {
          AND:
            filters,
        }
        : {};


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

    if (
      donation.status ===
      validation.data.status
    ) {
      return res
        .status(409)
        .json({
          success: false,

          message:
            "The donation already has this status.",
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
