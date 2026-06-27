import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name Is Required"],
    },
    email: {
      type: String,
      required: [true, "Email Is Required"],
      unique: true,
      trim: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email address",
      ],
    },
    sso_id: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Password Is Required"],
      minlength: [6, "Password Must be at least 6 character"],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

export default User;
