import mongoose, { Schema } from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
      lowecase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      require: true,
      unique: true,
      lowecase: true,
      trim: true,
    },

    Fullname: {
      type: String,
      require: true,
      unique: true,
      lowecase: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String, // coming from cloudinary Url baghu nantar
      required: true,
    },
    coverImage: {
      type: String, // coming from cloudinary Url baghu nantar
      required: true,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
export const User = mongoose.model("user", userSchema);
