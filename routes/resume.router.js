import express from "express";
import {
  create,
  getAll,
  detailResume,
  deleteResume,
  detailResumePublic,
  updateResume,
} from "../controller/resume.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import uploadFile from "../config/multer.js";

const ResumeRouter = express.Router();

ResumeRouter.get("/", AuthMiddleware, getAll);
ResumeRouter.post("/", AuthMiddleware, create);
ResumeRouter.get("/:id", AuthMiddleware, detailResume);
ResumeRouter.get("/public/:id", detailResumePublic);
ResumeRouter.delete("/:id", AuthMiddleware, deleteResume);
ResumeRouter.put(
  "/:id",
  AuthMiddleware,
  uploadFile.single("image"),
  updateResume
);

export default ResumeRouter;
