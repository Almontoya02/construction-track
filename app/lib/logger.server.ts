import pino from "pino";

// In development, Remix purges the require cache on every request,
// so we need to cache our logger instance on the global object.
declare global {
  var logger: pino.Logger;
}

const logLevel = process.env.LOG_LEVEL || "debug";

const logger =
  process.env.NODE_ENV === "production"
    ? pino({
        level: logLevel,
      })
    : pino({
        level: logLevel,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      });

// Cache the logger instance in development
if (process.env.NODE_ENV !== "production") {
  if (!global.logger) {
    global.logger = logger;
  }
}

export default global.logger || logger;
