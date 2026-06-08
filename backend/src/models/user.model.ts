import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";
import { Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  fullName: string;
  password: string;
  avatar: string;
  coverImage?: string;
  watchHistory: mongoose.Types.ObjectId[];
  refreshToken?: string;

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function() {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);

});

userSchema.methods.isPasswordCorrect = async function(password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function(this: IUser) {

  return jwt.sign(
    {
      _id: this._id.toString(),
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    config.at_jwt as string,
    { expiresIn: config.ex_at_jwt as any }
  );
};

userSchema.methods.generateRefreshToken = function(this: IUser) {
  return jwt.sign(
    {
      _id: this._id.toString(),
    },
    config.rt_jwt as string,
    { expiresIn: config.ex_rt_jwt as any }
  );
};


export const User = mongoose.model<IUser>("User", userSchema);
