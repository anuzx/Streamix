import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "http-errors";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const globalErrorHandler = (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "File too large. Max size is 4MB."
      : err.message;
    return res.status(400).json({ statusCode: 400, message });
  }

  if (!(err instanceof ApiError)) {
    return res.status(500).json(new ApiResponse(
      500,
      null,
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",

    ));
  }

  return res.status(err.statusCode).json({
    statusCode: err.statusCode,
    message: err.message,
    errorStack: process.env.NODE_ENV === "development" ? err.stack : ""
  });
};

export { globalErrorHandler };
