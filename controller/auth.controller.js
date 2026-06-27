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

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    if (process.env.AUTH_WITH_SSO === "true") {
      try {
        await fetch(`${process.env.SSO_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Cookie: req.headers.cookie,
          },
        });
        res.clearCookie("sso_auth_muhammadisa", {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          domain: isProd ? ".muhammad-isa.my.id" : undefined,
          path: "/",
        });
      } catch (error) {
        console.error("[SSO] Error:", ssoErr.message);
      }
    }

    return res.status(200).json({
      message: "Logout Berhasil",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
export const SyncProfile = async (req, res) => {
  try {
    const response = await fetch(`${process.env.SSO_URL}/api/auth/verify-app`, {
      headers: { "x-app-key": process.env.SSO_KEY, Cookie: req.headers.cookie },
    });

    if (!response.ok) {
      return res.status(401).json({ message: "SSO Session tidak valid." });
    }

    const data = await response.json();

    if (!data.valid || !data.user) {
      return res.status(401).json({ message: "SSO Session tidak valid." });
    }

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
        const hashPassword = await bcrypt.hash("123456", 10);
        user = await User.create({
          sso_id: ssoId,
          name,
          email,
          password: hashPassword,
          image_url: imageUrl || null,
        });
      }
    }

    return res.status(200).json({
      message: "Sync Profile Success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const UpdateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Update Profile Success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const ChangePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    return res.status(200).json({
      message: "Change Password Success",
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
