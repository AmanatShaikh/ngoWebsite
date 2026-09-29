import "dotenv/config";

import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  PrismaClient,
} from "../generated/prisma/client.ts";


const connectionString =
  process.env.DATABASE_URL;


if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured."
  );
}


function createPrismaClient() {
  const adapter =
    new PrismaPg({
      connectionString,
    });


  return new PrismaClient({
    adapter,
  });
}


const globalForPrisma =
  globalThis;


export const prisma =
  globalForPrisma
    .__anjumanPrisma ||
  createPrismaClient();


if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForPrisma.__anjumanPrisma =
    prisma;
}