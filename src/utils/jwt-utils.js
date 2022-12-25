import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { createMyLogger } from "./logger.js";
dotenv.config();
const logger = createMyLogger("jwt util");

export const createToken = (tokenConfig) => {
  let promise = new Promise((resolve, reject) => {
    if (tokenConfig) {
      let token = jwt.sign(tokenConfig, process.env.TOKEN_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRATION,
      });
      if (token) {
        resolve(token);
      } else {
        reject("toke generation failed ");
      }
    } else {
      reject("token config is null or undefined");
    }
  });
  return promise;
};

export const ensureToken = (req, res, next) => {
  let bearerHeader = req.header("Authorization");
  if (typeof bearerHeader !== "undefined") {
    var bearer = bearerHeader.split(" ");
    var bearerToken = bearer[1];
    logger.debug("bearer header", bearerToken);
    verifyToken(bearerToken, process.env.TOKEN_SECRET)
      .then((decodedToken) => {
        if (decodedToken == false) {
          return res.json({ status: 401, message: "Unauthorized" });
        }
        req.user = decodedToken;
        logger.debug("Decoded token " + decodedToken);
        next();
      })
      .catch((error) => {
        res
          .status(401)
          .json({ status: "failure", message: "Token validation failed" });
      });
  } else {
    res.status(401).json({ status: "failure", message: " Unauthorised user" });
  }
};

var verifyToken = (token, secret) => {
  let promise = new Promise((resolve) => {
    jwt.verify(token, secret, (err, result) => {
      if (err) {
        resolve(false);
      }
      if (result) {
        resolve(result);
      }
    });
  });
  return promise;
};
