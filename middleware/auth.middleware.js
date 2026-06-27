import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";

const isSsoActive = () => process.env.AUTH_WITH_SSO === "true";

const getCookieName = () =>
  process.env.NODE_ENV === "production" ? "__Host-resbuild_rt" : "resbuild_rt";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  res.cookie(getCookieName(), token, {
    httpOnly: true,
    maxAge: 15 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

const verifyJwt = async (req) => {
  const token = req.cookies[getCookieName()];
  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select("-password");
  return user;
};

const verifySsoAndUpsert = async (req) => {
  const response = await fetch(`${process.env.SSO_URL}/api/auth/verify-app`, {
    headers: { "x-app-key": process.env.SSO_KEY, Cookie: req.headers.cookie },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.valid || !data.user) return null;

  const { id: ssoId, name, email, image_url: imageUrl } = data.user;

  let user = await User.findOne({ sso_id: ssoId });

  if (user) {
    user.name = name;
    user.email = email;
    user.image_url = imageUrl || null;
    await user.save();
  } else {
    user = await User.findOne({ email });

    if (user) {
      user.sso_id = ssoId;
      user.name = name;
      user.image_url = imageUrl || null;
      await user.save();
    } else {
      const hashPassword = await bcrypt.hash("12345678", 10);
      user = await User.create({
        sso_id: ssoId,
        name,
        email,
        password: hashPassword,
        image_url: imageUrl || null,
      });
    }
  }

  return user;
};

export const AuthMiddleware = async (req, res, next) => {
  try {
    // 1. Coba JWT lokal dulu
    try {
      const user = await verifyJwt(req);
      if (user) {
        req.user = { id: user._id, name: user.name, email: user.email };
        return next();
      }
    } catch {
      // JWT invalid/expired — lanjut ke fallback
    }

    // 2. SSO fallback
    if (isSsoActive()) {
      const user = await verifySsoAndUpsert(req);

      if (!user) {
        return res.status(401).json({ message: "SSO Session tidak valid." });
      }

      generateToken(res, user._id);

      req.user = { id: user._id, name: user.name, email: user.email };
      return next();
    }

    // 3. Tidak ada JWT & bukan SSO mode
    return res.status(403).json({
      message: "Authorization Error, Token Not Found",
    });
  } catch (error) {
    return res.status(403).json({
      message: "Authorization Error, Server Down",
    });
  }
};
