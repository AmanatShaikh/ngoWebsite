import {
  z,
} from "zod";

import {
  prisma,
} from "../lib/prisma.js";


const contactSchema =
  z
    .object({
      name:
        z
          .string()
          .trim()
          .min(
            2,
            "Enter your full name."
          )
          .max(
            100,
            "Name is too long."
          ),

      phone:
        z
          .string()
          .trim()
          .max(10, "Phone number is too long.")
          .optional()
          .default(""),

      email:
        z
          .string()
          .trim()
          .max(150)
          .optional()
          .default(""),

      subject:
        z.enum([
          "medical",
          "education",
          "livelihood",
          "travel",
          "donation",
          "general",
        ]),

      message:
        z
          .string()
          .trim()
          .min(
            10,
            "Please provide a little more information."
          )
          .max(
            2000,
            "Message cannot exceed 2000 characters."
          ),
    })
    .superRefine(
      (
        data,
        ctx
      ) => {
        if (
          data.phone &&
          !/^[6-9]\d{9}$/.test(
            data.phone
          )
        ) {
          ctx.addIssue({
            code:
              "custom",

            path:
              ["phone"],

            message:
              "Enter a valid 10-digit Indian mobile number.",
          });
        }


        if (
          data.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            data.email
          )
        ) {
          ctx.addIssue({
            code:
              "custom",

            path:
              ["email"],

            message:
              "Enter a valid email address.",
          });
        }


        if (
          !data.phone &&
          !data.email
        ) {
          ctx.addIssue({
            code:
              "custom",

            path:
              ["email"],

            message:
              "Provide an email address or phone number so we can contact you.",
          });
        }
      }
    );


export async function createContactMessage(
  req,
  res,
  next
) {
  try {
    const validation =
      contactSchema.safeParse(
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
            "Please check your enquiry details.",

          errors:
            validation.error.flatten(),
        });
    }


    const input =
      validation.data;


    const enquiry =
      await prisma
        .contactMessage
        .create({
          data: {
            name:
              input.name,

            phone:
              input.phone ||
              null,

            email:
              input.email
                ? input.email
                    .toLowerCase()
                : null,

            subject:
              input.subject,

            message:
              input.message,
          },

          select: {
            id:
              true,

            createdAt:
              true,
          },
        });


    return res
      .status(201)
      .json({
        success:
          true,

        message:
          "Your enquiry has been received successfully.",

        enquiry,
      });

  } catch (error) {
    next(error);
  }
}
