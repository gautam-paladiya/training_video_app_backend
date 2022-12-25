import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createMyLogger } from "./src/utils/logger.js";
import routes from "./src/routes/index.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logger = createMyLogger(path.parse(__filename).base);
const morgerLogger = morgan("combined");
const app = express();
app.use(morgerLogger);
app.use("/storage/", express.static(path.join(__dirname, "/uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api", routes);

app.listen(process.env.PORT | 5000, () => {
  logger.debug("server started running " + process.env.PORT);
});
