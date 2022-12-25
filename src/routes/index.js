import express from "express";
import path, { dirname } from "path";
import { createMyLogger } from "../utils/logger.js";
import pool from "../../db.js";
import { encryptPassword, verifyPassword } from "../utils/hasing.js";
import constant from "../utils/constant.js";
import { createToken, ensureToken } from "../utils/jwt-utils.js";
import multer from "multer";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();
const logger = createMyLogger("Route index");
var upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      const { originalname } = file;
      const fileExtension = (originalname.match(/\.+[\S]+$/) || [])[0];
      cb(null, `video_${Date.now()}${fileExtension}`);
    },
  }),
});

router.post("/register", async (req, res) => {
  try {
    logger.debug("register req body :" + JSON.stringify(req.body));
    const { name, email, password, role = "user" } = req.body;
    const canDownload = role === "admin" ? true : false;
    let checkUser = await pool.query("SELECT * from users where email=$1", [
      email,
    ]);
    if (checkUser.rows.length > 0) {
      res.status(200).send({
        status: constant.statusFail,
        message: "Email address already registered",
      });
      return;
    }
    const hashPassword = await encryptPassword(password).then(
      (result) => result,
      (err) => {
        logger.debug("password encryption error" + err);
        res.status(400).send({ status: constant.statusFail });
        return;
      }
    );
    logger.debug("hashPassword " + hashPassword);
    let inserUser = await pool.query(
      "INSERT INTO users (name,email,password,role,can_download) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [name, email, hashPassword, role, canDownload]
    );
    logger.debug("new user" + JSON.stringify(inserUser.rows[0]));
    let user = inserUser.rows[0];
    delete user.password;
    if (parseInt(inserUser.rowCount) > 0) {
      let jwtToken = await createToken({ email: email, id: user.id })
        .then((token) => token)
        .catch((err) => {
          logger.debug("token generation error" + err);
          res.status(200).send({
            status: constant.statusFail,
            message: constant.unexpectedError,
          });
          return;
        });

      logger.debug("token " + jwtToken);
      res.status(200).send({
        status: constant.statusSuccess,
        jwt: jwtToken,
        message: "Sign up succesfull",
        user: user,
      });
    } else {
      res.status(200).send({
        status: constant.statusFail,
        message: constant.unexpectedError,
      });
    }
  } catch (error) {
    logger.debug("error" + error);
    res
      .status(400)
      .send({ status: constant.statusFail, data: constant.unexpectedError });
  }
});

router.post("/login", async (req, res) => {
  try {
    logger.debug("register req body :" + JSON.stringify(req.body));
    const { email, password } = req.body;
    let findUser = await pool.query("SELECT * FROM users where email=$1", [
      email,
    ]);
    logger.debug("findUser " + JSON.stringify(findUser.rows));
    let user = findUser.rows[0];
    if (findUser.rows.length > 0) {
      const isPasswordVerify = await verifyPassword(
        user.password,
        password
      ).then(
        (result) => true,
        (err) => false
      );
      logger.debug("isPasswordVerify" + isPasswordVerify);
      if (!isPasswordVerify) {
        res.status(200).send({
          status: constant.statusFail,
          message: "invalid username password",
        });
        return;
      }
      delete user.password;
      let jwtToken = await createToken({ email: user.email, id: user.id })
        .then((token) => token)
        .catch((err) => {
          logger.debug("token generation error" + err);
          res.status(200).send({ status: constant.statusFail });
          return;
        });

      logger.debug("token " + jwtToken);
      res.status(200).send({
        status: constant.statusSuccess,
        jwt: jwtToken,
        message: "Login successfull",
        user: user,
      });
    } else {
      res.status(200).send({
        status: constant.statusFail,
        message: "Invalid username password",
      });
    }
  } catch (error) {
    logger.debug("error" + error);
    res
      .status(400)
      .send({ status: constant.statusFail, data: constant.unexpectedError });
  }
});

router.post("/video", ensureToken, upload.single("file"), async (req, res) => {
  logger.debug("video upload body" + JSON.stringify(req.file.filename));
  logger.debug("video upload body" + JSON.stringify(req.user));
  const { description } = req.body;
  const { originalname, filename, size } = req.file;
  const userId = req.user.id;
  try {
    let addVideo = await pool.query(
      "INSERT INTO videos (name,description,original_name,user_id,size) VALUES ($1,$2,$3,$4,$5)  RETURNING *",
      [filename, description, originalname, userId, size]
    );
    if (addVideo?.rows?.length > 0) {
      res.status(200).send({
        status: constant.statusSuccess,
        message: "Video added successfully",
        video: addVideo.rows[0],
      });
    } else {
      res.status(200).send({
        status: constant.statusFail,
        message: constant.unexpectedError,
      });
    }
    logger.debug("add video " + JSON.stringify(addVideo.rows));
  } catch (error) {
    logger.error("video upload error", error);
    res
      .status(400)
      .send({ status: constant.statusFail, message: constant.unexpectedError });
  }
});

router.put("/user", ensureToken, async (req, res) => {
  logger.debug("user update body" + JSON.stringify(req.body));
  try {
    const { userId, canDownload } = req.body;
    let updateCanDownload = await pool.query(
      "UPDATE users set can_download=$1 where id=$2  RETURNING *",
      [canDownload, userId]
    );
    logger.debug("update users " + JSON.stringify(updateCanDownload));
    if (updateCanDownload.rowCount > 0) {
      res.status(200).send({
        status: constant.statusSuccess,
        users: updateCanDownload.rows[0],
      });
    } else {
      res.status(200).send({
        status: constant.statusFail,
        message: constant.unexpectedError,
      });
    }
  } catch (error) {
    logger.error("get all users error", error);
    res
      .status(400)
      .send({ status: constant.statusFail, message: constant.unexpectedError });
  }
});

router.get("/user", ensureToken, async (req, res) => {
  try {
    let getAllUsers = await pool.query(
      "SELECT * from users where role!='admin' order by name ASC"
    );
    if (getAllUsers?.rows?.length > 0) {
      res.status(200).send({
        status: constant.statusSuccess,
        users: getAllUsers.rows,
      });
    } else {
      res.status(200).send({
        status: constant.statusSuccess,
        users: [],
      });
    }
    logger.debug("get all users " + JSON.stringify(getAllUsers));
  } catch (error) {
    logger.error("get all users error", error);
    res
      .status(400)
      .send({ status: constant.statusFail, message: constant.unexpectedError });
  }
});

router.get("/video", async (req, res) => {
  logger.debug("all videos" + JSON.stringify(req.query));

  try {
    let { id } = req.query;
    var getAllVideo;
    if (id) {
      getAllVideo = await pool.query("SELECT * from videos where user_id=$1", [
        parseInt(id),
      ]);
    } else {
      getAllVideo = await pool.query("SELECT * from videos");
    }
    if (getAllVideo?.rows?.length > 0) {
      res.status(200).send({
        status: constant.statusSuccess,
        videos: getAllVideo.rows,
      });
    } else {
      res.status(200).send({
        status: constant.statusFail,
        videos: [],
      });
    }
    logger.debug("get all video " + JSON.stringify(getAllVideo));
  } catch (error) {
    logger.error("get all video error", error);
    res
      .status(400)
      .send({ status: constant.statusFail, message: constant.unexpectedError });
  }
});

router.get("/videostream/:filename", async (req, res) => {
  try {
    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }
    const fileName = req.params.filename;
    const videoPath = `uploads/${fileName}`;
    const videoSize = fs.statSync(videoPath).size;
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
  } catch (error) {
    logger.error("video stream error", error);
    res
      .status(400)
      .send({ status: constant.statusFail, message: constant.unexpectedError });
  }
});

router.get("/download/:filename", ensureToken, async (req, res) => {
  const { id } = req.user;
  const filename = req.params.filename;
  logger.debug("download video" + JSON.stringify(req.user) + filename + id);
  try {
    let getUser = await pool.query("SELECT * from users where id=$1", [id]);
    logger.debug("download video" + JSON.stringify(getUser.rows[0]));
    if (getUser.rows.length > 0) {
      const { can_download } = getUser.rows[0];
      console.log(can_download);
      if (!can_download) {
        res.status(200).send({
          status: constant.statusFail,
          message: "You dont have permission to download this video",
        });
        return;
      }
      res.download(`uploads/${filename}`, filename);
    }
  } catch (error) {
    logger.debug("download video error" + error);
    res.status(400).send({
      status: constant.statusFail,
      message: constant.unexpectedError,
    });
  }
});

router.get("/candownload", ensureToken, async (req, res) => {
  const { id } = req.user;
  try {
    let getUser = await pool.query("SELECT * from users where id=$1", [id]);
    logger.debug("candownload video" + JSON.stringify(getUser.rows[0]));
    if (getUser.rows.length > 0) {
      const { can_download } = getUser.rows[0];
      if (can_download) {
        res.status(200).send({
          status: constant.statusSuccess,
          message: "You can download video",
        });
      } else {
        res.status(200).send({
          status: constant.statusFail,
          message: "You can not download video",
        });
      }
    }
  } catch (error) {
    logger.debug("candownload video error" + error);
    res.status(400).send({
      status: constant.statusFail,
      message: constant.unexpectedError,
    });
  }
});

export default router;
