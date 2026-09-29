import "dotenv/config";

import app from "./src/app.js";

import {
  prisma,
} from "./src/lib/prisma.js";


const PORT =
  Number(
    process.env.PORT
  ) || 5500;


const server =
  app.listen(
    PORT,
    () => {
      console.log("");
      console.log(
        "========================================="
      );

      console.log(
        " Anjuman Bashindgan-E-Bihar"
      );

      console.log(
        " Backend server started"
      );

      console.log(
        "========================================="
      );

      console.log(
        `Website: http://localhost:${PORT}`
      );

      console.log(
        `API:     http://localhost:${PORT}/api`
      );

      console.log(
        `Health:  http://localhost:${PORT}/api/health`
      );

      console.log(
        "========================================="
      );

      console.log("");
    }
  );


/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

async function shutdown(
  signal
) {
  console.log(
    `\n${signal} received. Shutting down...`
  );


  server.close(
    async () => {
      try {
        await prisma.$disconnect();

        console.log(
          "Database disconnected."
        );

        process.exit(0);

      } catch (error) {
        console.error(
          "Shutdown error:",
          error
        );

        process.exit(1);
      }
    }
  );


  /*
    Prevent hanging forever if
    a connection refuses to close.
  */

  setTimeout(
    () => {
      console.error(
        "Forced shutdown."
      );

      process.exit(1);
    },
    10000
  ).unref();
}


process.on(
  "SIGINT",
  () =>
    shutdown("SIGINT")
);


process.on(
  "SIGTERM",
  () =>
    shutdown("SIGTERM")
);