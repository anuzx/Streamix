//promises method:

import type { NextFunction, Request, RequestHandler, Response } from "express";

const asyncHandler = (reqHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
  };
};

//it is made to handel req,res and next with promises , its a wrapper so that we dont need to keep everything in try catch and use async await

export { asyncHandler };

//try catch method :

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//       await fn(req,res,next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       meassage: error.message,
//     });
//   }
// };


//higher order function : it takes another fn as an argument or returns a fn or both

//const asyncHandler = (func)  => { ()=>{ }}
