import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Host-resbuild_rt"
      : "resbuild_rt";
  res.cookie(cookieName, token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};
export const Register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exitsUser = await User.findOne({ email });

    if (exitsUser) {
      return res.status(400).json({ message: "Account Already Registered" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashPassword,
    });

    generateToken(res, newUser._id);

    return res.status(201).json({
      message: "Register Berhasil",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({
      message: `Internal Server Error : ${err.message}`,
    });
  }
};
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: `Email And Password Required` });
    }

    const exitsUser = await User.findOne({ email });
    if (!exitsUser) {
      return res.status(400).json({ message: `Invalid Email Or Password` });
    }
    const comparePassword = await bcrypt.compare(password, exitsUser.password);
    if (!comparePassword) {
      return res.status(400).json({ message: `Invalid Email Or Password` });
    }
    generateToken(res, exitsUser._id);
    return res.status(200).json({
      message: "Login Berhasil",
      user: {
        id: exitsUser._id,
        name: exitsUser.name,
        email: exitsUser.email,
      },
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
export const Logout = async (req, res) => {
  try {
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Host-resbuild_rt"
        : "resbuild_rt";
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.status(200).json({
      message: "Logout Berhasil",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
export const Me = async (req, res) => {
  try {
    res.status(200).json({
      message: "Get User Detail Berhasil",
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
