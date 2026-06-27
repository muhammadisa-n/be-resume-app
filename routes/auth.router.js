import express from "express";
import {
  Login,
  Register,
  Logout,
  Me,
  SyncProfile,
} from "../controller/auth.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const AuthRouter = express.Router();

AuthRouter.post("/register", Register);
AuthRouter.post("/login", Login);
AuthRouter.post("/logout", AuthMiddleware, Logout);
AuthRouter.get("/me", AuthMiddleware, Me);
AuthRouter.get("/sync-profile", AuthMiddleware, SyncProfile);

export default AuthRouter;
