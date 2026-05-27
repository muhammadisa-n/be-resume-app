import "dotenv/config";
import express from "express";
import AuthRouter from "./routes/auth.router.js";
import ResumeRouter from "./routes/resume.router.js";
import ConnectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import ExpresssMongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import helmet from "helmet";
const app = express();
const port = process.env.PORT;
app.set("trust proxy", 1);
await ConnectDB();
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(ExpresssMongoSanitize());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server its Running  🚀 ",
    author: "Muhammad Isa",
  });
});
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Status OK",
  });
});
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Api Server its Running  🚀 ",
    author: "Muhammad Isa",
  });
});

app.use("/api/auth", AuthRouter);
app.use("/api/resume", ResumeRouter);
app.listen(port, () => {
  console.log(`Server Running Listening on ${port}`);
});
