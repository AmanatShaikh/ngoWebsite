import "dotenv/config";

import {
  prisma,
} from "../src/lib/prisma.js";


const demoApplications = [
  {
    type: "MEDICAL",
    branch: "NAGPADA",
    status: "PENDING",
    applicantName: "Aarif Khan",
    phone: "9876543210",
    email: "aarif.demo@example.com",
    age: 34,
    address: "Demo address, Mumbai",
    city: "Mumbai",
    pincode: "400008",
    description: "Requesting support for medical treatment expenses.",
  },
  {
    type: "SCHOLARSHIP",
    branch: "DHARAVI",
    status: "UNDER_REVIEW",
    applicantName: "Sana Shaikh",
    phone: "9876543211",
    email: "sana.demo@example.com",
    age: 19,
    address: "Demo address, Dharavi",
    city: "Mumbai",
    pincode: "400017",
    description: "Requesting education support for the current academic year.",
  },
  {
    type: "LIVELIHOOD",
    branch: "NAGPADA",
    status: "APPROVED",
    applicantName: "Imran Ansari",
    phone: "9876543212",
    email: "imran.demo@example.com",
    age: 41,
    address: "Demo address, Mumbai",
    city: "Mumbai",
    pincode: "400008",
    description: "Requesting livelihood support to restart home-based work.",
  },
  {
    type: "TRAVEL",
    branch: "DHARAVI",
    status: "COMPLETED",
    applicantName: "Nazia Begum",
    phone: "9876543213",
    email: "nazia.demo@example.com",
    age: 29,
    address: "Demo address, Dharavi",
    city: "Mumbai",
    pincode: "400017",
    description: "Requesting essential travel assistance for a family matter.",
  },
  {
    type: "MEDICAL",
    branch: "DHARAVI",
    status: "REJECTED",
    applicantName: "Yusuf Sheikh",
    phone: "9876543214",
    email: "yusuf.demo@example.com",
    age: 52,
    address: "Demo address, Dharavi",
    city: "Mumbai",
    pincode: "400017",
    description: "Requesting support for a medical consultation.",
  },
  {
    type: "SCHOLARSHIP",
    branch: "NAGPADA",
    status: "PENDING",
    applicantName: "Mariam Ali",
    phone: "9876543215",
    email: "mariam.demo@example.com",
    age: 17,
    address: "Demo address, Mumbai",
    city: "Mumbai",
    pincode: "400008",
    description: "Requesting scholarship support for further studies.",
  },
];


async function findTestUser() {
  const email = process.env.TEST_USER_EMAIL?.trim().toLowerCase();
  const username = process.env.TEST_USER_USERNAME?.trim().toLowerCase();

  if (email) {
    return prisma.user.findUnique({ where: { email } });
  }

  if (username) {
    return prisma.user.findUnique({ where: { username } });
  }

  return prisma.user.findFirst({
    where: { role: "USER" },
    orderBy: { createdAt: "asc" },
  });
}


async function main() {
  const user = await findTestUser();

  if (!user) {
    throw new Error(
      "No USER account found. Set TEST_USER_EMAIL or TEST_USER_USERNAME to an existing applicant account."
    );
  }

  const batch = Date.now().toString(36).toUpperCase();

  for (const [index, application] of demoApplications.entries()) {
    const created = await prisma.application.create({
      data: {
        referenceNumber: `DEMO-${batch}-${String(index + 1).padStart(2, "0")}`,
        userId: user.id,
        type: application.type,
        branch: application.branch,
        status: application.status,
        applicantName: application.applicantName,
        phone: application.phone,
        email: application.email,
        age: application.age,
        address: application.address,
        city: application.city,
        pincode: application.pincode,
        description: application.description,
        details: {
          seededDemo: true,
          note: "Test data only",
        },
      },
    });

    if (application.status !== "PENDING") {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: created.id,
          toStatus: application.status,
          note: "Seeded demo status for testing.",
        },
      });
    }

    console.log(`${created.referenceNumber}: ${created.status}`);
  }

  console.log(`Seeded ${demoApplications.length} demo applications for ${user.email}.`);
}


main()
  .catch((error) => {
    console.error("Test application seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
