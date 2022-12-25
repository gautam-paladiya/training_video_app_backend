import winston, { format, transports } from "winston";
const { combine, timestamp, label, printf, json, colorize, splat } = format;

export const createMyLogger = (moduleName) => {
  let customFormat = printf(({ level, message, label, timestamp }) => {
    if (typeof message === "object") {
      message = JSON.stringify(message);
    }
    return `[${timestamp}] [${label}] [${level}] : ${message}`;
  });

  let timezoneFormat = () => {
    let date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    return date.replaceAll("/", "-");
  };
  let logger = winston.createLogger({
    transports: [
      //   new winston.transports.Console()
      new transports.Console({
        level: "debug",
        format: format.combine(
          timestamp({ format: timezoneFormat }),
          label({ label: moduleName }),
          colorize({ all: true }),
          splat(),
          json(),
          customFormat
        ),
      }),
    ],
  });
  return logger;
};
