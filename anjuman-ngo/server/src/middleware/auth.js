import jwt from "jsonwebtoken";

import {
  prisma,
} from "../lib/prisma.js";


const COOKIE_NAME =
  process.env.JWT_COOKIE_NAME ||
  "anjuman_session";


function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return secret;
}


export async function requireAuth(
  req,
  res,
  next
) {
  try {
    const token =
      req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required.",
        });
    }


    let payload;

    try {
      payload = jwt.verify(
        token,
        getJwtSecret()
      );
    } catch {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Your session is invalid or has expired.",
        });
    }


    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.sub
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid authentication session.",
        });
    }


    const user =
      await prisma.user.findUnique({
        where: {
          id: String(payload.sub),
        },

        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });


    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "User account was not found.",
        });
    }


    if (!user.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "This account has been disabled.",
        });
    }


    req.user = user;

    next();

  } catch (error) {
    next(error);
  }
}


export function requireAdmin(
  req,
  res,
  next
) {
  if (!req.user) {
    return res
      .status(401)
      .json({
        success: false,
        message:
          "Authentication required.",
      });
  }


  if (
    req.user.role !== "ADMIN"
  ) {
    return res
      .status(403)
      .json({
        success: false,
        message:
          "Administrator access required.",
      });
  }


  next();
}