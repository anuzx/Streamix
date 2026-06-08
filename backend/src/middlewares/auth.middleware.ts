import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import type { NextFunction, Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: string
    }
  }
}

//when res is not in use we can replace it by _
export const verifyJWT = asyncHandler(async (req: Request, _, next: NextFunction) => {
  //accessToken can be optional as for mobile application a custom header is send
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorised Error");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { _id: string };

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "invalid access token");
    }

    req.user = user._id.toString(); //adding new object in req
    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "invalid access token")
  }
});
