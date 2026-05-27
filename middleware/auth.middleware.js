import "dotenv/config";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
export const AuthMiddleware = async (req, res, next) => {
  try {
    let token;
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Host-resbuild_rt"
        : "resbuild_rt";
    token = req.cookies[`${cookieName}`];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.userId).select(
          "-password"
        );
        req.user = {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
        };
        next();
      } catch (error) {
        return res.status(403).json({
          message: "Authorization Error, Current User Not Found",
        });
      }
    } else {
      return res.status(403).json({
        message: "Authorization Error, Token Not Found",
      });
    }
  } catch (error) {
    return res.status(403).json({
      message: "Authorization Error, Server Down",
    });
  }
};
