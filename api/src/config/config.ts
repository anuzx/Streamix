import dotenv from "dotenv";
dotenv.config()

const _config = {
  at_jwt: process.env.ACCESS_TOKEN_SECRET as string,
  rt_jwt: process.env.REFRESH_TOKEN_SECRET as string,
  ex_at_jwt: process.env.ACCESS_TOKEN_EXPIRY,
  ex_rt_jwt: process.env.REFRESH_TOKEN_EXPIRY,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}


export const config = Object.freeze(_config)
