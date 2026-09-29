import "dotenv/config";

import bcrypt
  from "bcryptjs";

import {
  prisma,
} from "../src/lib/prisma.js";


const HASH_ROUNDS = 12;


async function main() {
  const name =
    process.env.ADMIN_NAME;

  const username =
    process.env.ADMIN_USERNAME
      ?.trim()
      .toLowerCase();

  const email =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

  const password =
    process.env.ADMIN_PASSWORD;


  if (
    !name ||
    !username ||
    !email ||
    !password
  ) {
    throw new Error(
      "ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured before seeding."
    );
  }


  if (
    password.length < 12
  ) {
    throw new Error(
      "ADMIN_PASSWORD must contain at least 12 characters."
    );
  }


  const passwordHash =
    await bcrypt.hash(
      password,
      HASH_ROUNDS
    );


  const existingByEmail =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });


  const existingByUsername =
    await prisma.user.findUnique({
      where: {
        username,
      },
    });


  if (
    existingByEmail &&
    existingByUsername &&
    existingByEmail.id !==
      existingByUsername.id
  ) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_USERNAME belong to different existing users."
    );
  }


  const existing =
    existingByEmail ||
    existingByUsername;


  if (existing) {
    const admin =
      await prisma.user.update({
        where: {
          id:
            existing.id,
        },

        data: {
          name,

          username,

          email,

          passwordHash,

          role:
            "ADMIN",

          isActive:
            true,
        },
      });


    console.log(
      `Updated admin account: ${admin.email}`
    );

    return;
  }


  const admin =
    await prisma.user.create({
      data: {
        name,

        username,

        email,

        passwordHash,

        role:
          "ADMIN",

        isActive:
          true,
      },
    });


  console.log(
    `Created admin account: ${admin.email}`
  );
}


main()
  .catch((error) => {
    console.error(
      "Seed failed:",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });