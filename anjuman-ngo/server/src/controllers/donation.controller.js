import crypto from "node:crypto";

import Razorpay from "razorpay";

import {
  z,
} from "zod";

import {
  prisma,
} from "../lib/prisma.js";


/* =========================================================
   CONFIG
========================================================= */

function getRazorpayConfig() {
  const keyId =
    process.env.RAZORPAY_KEY_ID;

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;


  if (
    !keyId ||
    !keySecret
  ) {
    throw new Error(
      "Razorpay credentials are not configured."
    );
  }


  return {
    keyId,
    keySecret,
  };
}


function getRazorpayClient() {
  const {
    keyId,
    keySecret,
  } =
    getRazorpayConfig();


  return new Razorpay({
    key_id:
      keyId,

    key_secret:
      keySecret,
  });
}


/* =========================================================
   VALIDATION
========================================================= */

const createOrderSchema =
  z.object({

    amount:
      z
        .coerce
        .number()
        .positive()
        .min(
          10,
          "Minimum donation is ₹10."
        )
        .max(
          1000000,
          "Donation amount is too large."
        ),

    donorName:
      z
        .string()
        .trim()
        .max(100)
        .optional(),

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

    phone:
      z
        .string()
        .trim()
        .regex(
          /^[6-9]\d{9}$/
        )
        .optional()
        .or(
          z.literal("")
        ),

  });


const verifyPaymentSchema =
  z.object({

    razorpay_order_id:
      z
        .string()
        .min(1),

    razorpay_payment_id:
      z
        .string()
        .min(1),

    razorpay_signature:
      z
        .string()
        .min(1),

  });


const upiReferenceSchema =
  z.object({

    amount:
      z
        .coerce
        .number()
        .positive()
        .min(10)
        .max(1000000),

    donorName:
      z
        .string()
        .trim()
        .max(100)
        .optional(),

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

    phone:
      z
        .string()
        .trim()
        .regex(
          /^[6-9]\d{9}$/
        )
        .optional()
        .or(
          z.literal("")
        ),

    upiReference:
      z
        .string()
        .trim()
        .min(
          4,
          "UPI transaction reference is required."
        )
        .max(100),

  });


/* =========================================================
   HELPERS
========================================================= */

function optionalString(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }


  const string =
    String(value).trim();


  return string || null;
}


function amountToPaise(
  amount
) {
  return Math.round(
    Number(amount) * 100
  );
}


function amountFromPaise(
  amount
) {
  return (
    Number(amount) /
    100
  );
}


function timingSafeHexCompare(
  expected,
  received
) {
  try {
    const expectedBuffer =
      Buffer.from(
        expected,
        "hex"
      );


    const receivedBuffer =
      Buffer.from(
        received,
        "hex"
      );


    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }


    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );

  } catch {
    return false;
  }
}


/* =========================================================
   PUBLIC PAYMENT CONFIG
========================================================= */

export function getDonationConfig(
  req,
  res
) {
  const {
    keyId,
  } =
    getRazorpayConfig();


  return res.json({
    success: true,

    payment: {

      razorpayKeyId:
        keyId,

      upi: {
        id:
          process.env.UPI_ID ||
          null,

        payeeName:
          process.env
            .UPI_PAYEE_NAME ||
          "Anjuman Bashindgan-E-Bihar",
      },

    },
  });
}


/* =========================================================
   CREATE RAZORPAY ORDER
========================================================= */

export async function createRazorpayOrder(
  req,
  res,
  next
) {
  try {
    const validation =
      createOrderSchema.safeParse(
        req.body
      );


    if (!validation.success) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            validation.error
              .issues[0]
              ?.message ||
            "Invalid donation information.",
        });
    }


    const input =
      validation.data;


    const razorpay =
      getRazorpayClient();


    const receipt =
      `don_${Date.now()}_${crypto
        .randomBytes(4)
        .toString("hex")}`;


    const amountInPaise =
      amountToPaise(
        input.amount
      );


    const order =
      await razorpay.orders.create({

        amount:
          amountInPaise,

        currency:
          "INR",

        receipt,

      });


    const donation =
      await prisma.donation.create({

        data: {

          userId:
            req.user?.id ||
            null,

          donorName:
            optionalString(
              input.donorName
            ),

          email:
            optionalString(
              input.email
            )?.toLowerCase() ||
            null,

          phone:
            optionalString(
              input.phone
            ),

          amount:
            input.amount,

          currency:
            "INR",

          method:
            "RAZORPAY",

          status:
            "PENDING",

          razorpayOrderId:
            order.id,

        },

      });


    return res
      .status(201)
      .json({

        success: true,

        order: {
          id:
            order.id,

          amount:
            order.amount,

          currency:
            order.currency,
        },

        donation: {
          id:
            donation.id,
        },

        keyId:
          process.env
            .RAZORPAY_KEY_ID,

      });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   VERIFY RAZORPAY PAYMENT
========================================================= */

export async function verifyRazorpayPayment(
  req,
  res,
  next
) {
  try {
    const validation =
      verifyPaymentSchema.safeParse(
        req.body
      );


    if (!validation.success) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid payment verification data.",
        });
    }


    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } =
      validation.data;


    /*
      IMPORTANT:

      Never trust an order ID sent by
      the browser without checking it
      against our own database.
    */

    const donation =
      await prisma.donation.findUnique({

        where: {
          razorpayOrderId:
            razorpay_order_id,
        },

      });


    if (!donation) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Donation order was not found.",
        });
    }


    if (
      donation.status ===
      "VERIFIED"
    ) {
      return res.json({
        success: true,

        message:
          "Payment was already verified.",

        donation,
      });
    }


    const {
      keySecret,
    } =
      getRazorpayConfig();


    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret
        )
        .update(
          `${donation.razorpayOrderId}|${razorpay_payment_id}`
        )
        .digest("hex");


    const signatureValid =
      timingSafeHexCompare(
        expectedSignature,
        razorpay_signature
      );


    if (!signatureValid) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Payment signature verification failed.",
        });
    }


    /*
      Do not stop at signature validation.

      Fetch actual payment from Razorpay
      and verify:
      - payment belongs to our order
      - currency is INR
      - amount matches
      - payment is captured
    */

    const razorpay =
      getRazorpayClient();


    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );


    const expectedAmount =
      amountToPaise(
        donation.amount
      );


    if (
      payment.order_id !==
      donation.razorpayOrderId
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Payment does not belong to this donation order.",
        });
    }


    if (
      payment.currency !==
      "INR"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Unexpected payment currency.",
        });
    }


    if (
      Number(payment.amount) !==
      expectedAmount
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Payment amount does not match the donation amount.",
        });
    }


    if (
      payment.status !==
      "captured"
    ) {
      return res
        .status(409)
        .json({
          success: false,

          message:
            "Payment has not been captured yet.",
        });
    }


    const verifiedDonation =
      await prisma.donation.update({

        where: {
          id:
            donation.id,
        },

        data: {

          status:
            "VERIFIED",

          razorpayPaymentId:
            razorpay_payment_id,

          razorpaySignature:
            razorpay_signature,

        },

      });


    return res.json({

      success: true,

      message:
        "Donation payment verified successfully.",

      donation:
        verifiedDonation,

    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   DIRECT UPI REFERENCE
========================================================= */

export async function submitUpiDonationReference(
  req,
  res,
  next
) {
  try {
    const validation =
      upiReferenceSchema.safeParse(
        req.body
      );


    if (!validation.success) {
      return res
        .status(400)
        .json({

          success: false,

          message:
            validation.error
              .issues[0]
              ?.message ||
            "Invalid UPI donation information.",

        });
    }


    const input =
      validation.data;


    /*
      Important:
      A typed UPI reference is NOT proof
      that money was actually received.

      Therefore it stays PENDING until
      an administrator/bank reconciliation
      confirms it.
    */

    const donation =
      await prisma.donation.create({

        data: {

          userId:
            req.user?.id ||
            null,

          donorName:
            optionalString(
              input.donorName
            ),

          email:
            optionalString(
              input.email
            )?.toLowerCase() ||
            null,

          phone:
            optionalString(
              input.phone
            ),

          amount:
            input.amount,

          currency:
            "INR",

          method:
            "UPI",

          status:
            "PENDING",

          upiReference:
            input.upiReference,

        },

      });


    return res
      .status(201)
      .json({

        success: true,

        message:
          "UPI transaction reference submitted. It will remain pending until payment is confirmed.",

        donation: {
          id:
            donation.id,

          status:
            donation.status,
        },

      });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   RAZORPAY WEBHOOK
========================================================= */

export async function razorpayWebhook(
  req,
  res,
  next
) {
  try {
    const webhookSecret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;


    if (!webhookSecret) {
      throw new Error(
        "RAZORPAY_WEBHOOK_SECRET is not configured."
      );
    }


    const signature =
      req.headers[
        "x-razorpay-signature"
      ];


    if (
      !signature ||
      typeof signature !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Webhook signature is missing.",
        });
    }


    /*
      Webhook signature must be generated
      from the exact RAW body bytes.
    */

    const rawBody =
      req.body;


    if (
      !Buffer.isBuffer(
        rawBody
      )
    ) {
      throw new Error(
        "Webhook raw body is unavailable."
      );
    }


    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(
          rawBody
        )
        .digest(
          "hex"
        );


    if (
      !timingSafeHexCompare(
        expectedSignature,
        signature
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid webhook signature.",
        });
    }


    const event =
      JSON.parse(
        rawBody.toString(
          "utf8"
        )
      );


    const eventType =
      event.event;


    const payment =
      event.payload
        ?.payment
        ?.entity;


    /*
      payment.captured is the important
      successful-payment event here.
    */

    if (
      eventType ===
        "payment.captured" &&
      payment
    ) {

      const donation =
        await prisma.donation.findUnique({

          where: {
            razorpayOrderId:
              payment.order_id,
          },

        });


      if (donation) {

        const expectedAmount =
          amountToPaise(
            donation.amount
          );


        if (
          payment.currency ===
            "INR" &&
          Number(payment.amount) ===
            expectedAmount
        ) {

          await prisma.donation.update({

            where: {
              id:
                donation.id,
            },

            data: {

              status:
                "VERIFIED",

              razorpayPaymentId:
                payment.id,

            },

          });

        }

      }

    }


    if (
      eventType ===
        "payment.failed" &&
      payment
    ) {

      const donation =
        await prisma.donation.findUnique({

          where: {
            razorpayOrderId:
              payment.order_id,
          },

        });


      if (
        donation &&
        donation.status ===
          "PENDING"
      ) {

        await prisma.donation.update({

          where: {
            id:
              donation.id,
          },

          data: {
            status:
              "FAILED",
          },

        });

      }

    }


    /*
      Always acknowledge valid webhook.
    */

    return res.status(
      200
    ).json({
      success: true,
    });

  } catch (error) {
    next(error);
  }
}