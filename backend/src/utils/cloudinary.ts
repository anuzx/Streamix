//our goal :
//file will come from file sys (files are uploaded on server) then we will keep it on cloudinary and del it from our server

import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //file sys (by default comes with node.js)

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //else upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully on cloudinary ,now remove it from server
    //console.log(response.url)
    fs.unlinkSync(localFilePath)
    return response;
    
  } catch (error) {
    fs.unlinkSync(localFilePath)//remove the locally saved temp file as the upload operation got failed or else we will have bunch of corrupted files on server
    
      return null;
  }
};

export {uploadOnCloudinary}