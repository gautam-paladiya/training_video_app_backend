import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { createMyLogger } from "./logger.js";

const logger = createMyLogger("util hasing");
dotenv.config();

export const encryptPassword = (password) => {
  return new Promise((resolve, reject) => {
    logger.debug("password");
    logger.debug(typeof password);
    if (password) {
      bcrypt.hash(
        password.toString(),
        parseInt(process.env.PASSWORD_SALT),
        function (err, hash) {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        }
      );
    } else {
      reject("emty password value");
    }
  });
};

export const verifyPassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    if (password != "" && hash != "") {
      bcrypt.compare(hash, password, function (err, result) {
        console.log("verify", result, err, password, hash);
        if (result) {
          resolve(true);
        } else {
          reject(err);
        }
      });
    } else {
      reject("emty password and hash value");
    }
  });
};
