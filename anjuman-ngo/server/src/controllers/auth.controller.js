import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import {
  z,
} from "zod";

import {
  prisma,
} from "../lib/prisma.js";


const COOKIE_NAME =
  process.env.JWT_COOKIE_NAME ||
  "anjuman_session";


const PASSWORD_HASH_ROUNDS = 12;


/* =========================================================
   VALIDATION
========================================================= */

const registerSchema =
  z.object({
    name:
      z
        .string()
        .trim()
        .min(2)
        .max(100),

    username:
      z
        .string()
        .trim()
        .min(3)
        .max(30)
        .regex(
          /^[a-zA-Z0-9._-]+$/,
          "Username contains invalid characters."
        ),

    email:
      z
        .string()
        .trim()
        .email()
        .max(150),

    phone:
      z
        .string()
        .trim()
        .regex(
          /^[6-9]\d{9}$/,
          "Invalid Indian mobile number."
        )
        .nullable()
        .optional(),

    password:
      z
        .string()
        .min(8)
        .max(128),
  });


const loginSchema =
  z.object({
    identifier:
      z
        .string()
        .trim()
        .min(1)
        .max(150),

    password:
      z
        .string()
        .min(1)
        .max(128),

    remember:
      z
        .boolean()
        .optional()
        .default(false),
  });


/* =========================================================
   HELPERS
========================================================= */

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


function normalizeEmail(email) {
  return email
    .trim()
    .toLowerCase();
}


function normalizeUsername(
  username
) {
  return username
    .trim()
    .toLowerCase();
}


function publicUser(user) {
  return {
    id:
      user.id,

    name:
      user.name,

    username:
      user.username,

    email:
      user.email,

    phone:
      user.phone,

    role:
      user.role,

    createdAt:
      user.createdAt,
  };
}


function createSessionToken(
  user,
  remember
) {
  return jwt.sign(
    {
      role:
        user.role,
    },

    getJwtSecret(),

    {
      subject:
        user.id,

      expiresIn:
        remember
          ? "30d"
          : "1d",

      issuer:
        "anjuman-ngo-api",

      audience:
        "anjuman-ngo-web",
    }
  );
}


function setSessionCookie(
  res,
  token,
  remember
) {
  const maxAge =
    remember
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;


  res.cookie(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path:
        "/",

      maxAge,
    }
  );
}


function clearSessionCookie(
  res
) {
  res.clearCookie(
    COOKIE_NAME,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path:
        "/",
    }
  );
}


/* =========================================================
   REGISTER
========================================================= */

export async function register(
  req,
  res,
  next
) {
  try {
    const validation =
      registerSchema.safeParse(
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
            "Invalid registration information.",

          errors:
            validation.error.flatten(),
        });
    }


    const {
      name,
      password,
    } =
      validation.data;


    const username =
      normalizeUsername(
        validation.data.username
      );


    const email =
      normalizeEmail(
        validation.data.email
      );


    const phone =
      validation.data.phone ||
      null;


    const existing =
      await prisma.user.findFirst({
        where: {
          OR: [
            {
              username,
            },

            {
              email,
            },
          ],
        },

        select: {
          username: true,
          email: true,
        },
      });


    if (existing) {
      let message =
        "An account already exists with those details.";


      if (
        existing.email ===
        email
      ) {
        message =
          "That email address is already registered.";
      } else if (
        existing.username ===
        username
      ) {
        message =
          "That username is already taken.";
      }


      return res
        .status(409)
        .json({
          success: false,
          message,
        });
    }


    const passwordHash =
      await bcrypt.hash(
        password,
        PASSWORD_HASH_ROUNDS
      );


    const user =
      await prisma.user.create({
        data: {
          name:
            name.trim(),

          username,

          email,

          phone,

          passwordHash,

          role:
            "USER",
        },
      });


    return res
      .status(201)
      .json({
        success: true,

        message:
          "Account created successfully.",

        user:
          publicUser(user),
      });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   LOGIN
========================================================= */

export async function login(
  req,
  res,
  next
) {
  try {
    const validation =
      loginSchema.safeParse(
        req.body
      );


    if (!validation.success) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Enter your username/email and password.",
        });
    }


    const {
      password,
      remember,
    } =
      validation.data;


    const identifier =
      validation.data
        .identifier
        .trim()
        .toLowerCase();


    const user =
      await prisma.user.findFirst({
        where: {
          OR: [
            {
              username:
                identifier,
            },

            {
              email:
                identifier,
            },
          ],
        },
      });


    /*
      Use the same generic message
      regardless of which part was wrong.
    */

    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid username/email or password.",
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


    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );


    if (!passwordMatches) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid username/email or password.",
        });
    }


    const token =
      createSessionToken(
        user,
        remember
      );


    setSessionCookie(
      res,
      token,
      remember
    );


    return res.json({
      success: true,

      message:
        "Login successful.",

      user:
        publicUser(user),
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   LOGOUT
========================================================= */

export function logout(
  req,
  res
) {
  clearSessionCookie(
    res
  );


  return res.json({
    success: true,

    message:
      "Logged out successfully.",
  });
}


/* =========================================================
   CURRENT USER
========================================================= */

export function me(
  req,
  res
) {
  return res.json({
    success: true,

    user:
      req.user,
  });
}