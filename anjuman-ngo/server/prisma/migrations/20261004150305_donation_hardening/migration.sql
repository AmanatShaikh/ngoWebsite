/*
  Warnings:

  - A unique constraint covering the columns `[upiReference]` on the table `Donation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Donation_upiReference_key" ON "Donation"("upiReference");
