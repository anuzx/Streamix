import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//here we dont need asyncHandler becuz we are not handleing any web req it is our internal usecase method
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //refresh token is also kept in db

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //validateBeforeSave:false is used so that we can save only one field 

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "soemthing went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //steps to register a user:
  //1) get user details from frontend (using postman)
  //2) validation -> inputs are not empty
  //3) check if user already exists (email , username)
  //4) check for images and avatar(user -> multer -> cloudinary)
  //5) upload them to cloudinary
  //6) create user object -> create entry in db
  //7) remove passwrd and refresh token field from response as db will give everything in response
  //8) check for user creation (if res is null or not)
  //9) return res

  const { fullName, email, username, password } = req.body;
  //validation if any field is empty or not
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required"); //status code , message
  }

  //find user in db which matches this username and email
  const existedUser = await User.findOne({
    //or parameter
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    //throw statement is used to raise or generate an error
    throw new ApiError(409, "User with email or username already exist");
  }

  //Handeling images

  const avatarLocalPath = req.files?.avatar[0]?.path; //multer gives req.files
  //const coverImageLocalPath = req.filer?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //now upload them to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //databse entry
  const user = await User.create({
    fullName,
    avatar: avatar.url, //here this is 100% validated 
    coverImage: coverImage?.url || "", //check if cover img is there or not ,it is done this way becuz it is not "required:true" in model
    email,
    password,
    username: username.toLowerCase(),
  });

//to check if user is empty or not
  const createdUser = await User.findById(user._id).select(
    //write what all you dont want
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200,createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //steps to login a user :
  //take data from req.body
  //access based on username or email
  //find the user
  //password check
  //if password crct -> generate access and refresh token and send it to user
  //send in cookies

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  //if user found then check password

  //here we are using user not User (it is a mongoose object,so only mongoose methods will work with it)

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is not correct");
  }
  //now if user passwrd is crct then make access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id //userId argument used in the method
  );

  //now send tokens in cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    //cookie should be modified by server only and not frontend
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

//logout
//clear cookie,accesstoken,refreshtoken

const logoutUser = asyncHandler(async (req, res) => {
  //for logginout a user we will have to find that user now for that it would be silly to do User.fingById(user._id) becuz for that we would require user variable for which  we will have to find User using email or username , and it would be a vulnerability if someone can just use email of anyone to log them out whereas req.user that we made in auth.middleware.js contains the user info currently loged in 
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,//this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //for mobile users req.body
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  //verify incoming token
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }
    //match the incomingrefreshtoken and user?.refreshToken (encoded one)

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    //now generate new token
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  //we want user so that we can verify the pass, if he is able to change pass that means he is logged in and that is due to middleware req.user

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password");
  }
  //this means old pass is crct now we have to set new password and save it

  user.password = newpassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "all fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});

//files update : 1st middleware will be multer , 2nd only the user who are logged in will be able to update

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing");
  }
  //TODO: delete old image -> assignment

  //upload on cloudinary after update
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }
  //update avatar
  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        avatar: avatar.url, //change avatar with avatar.url
      },
    },
    { new: true }//tells mongoose to return the updated document , not the old one
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImagePath = req.file?.path;

  if (!coverImagePath) {
    throw new ApiError(400, "cover image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImagePath);
  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading cover image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params; //get username from url that is channel name

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      //how to match
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        //model becomes lowercase and prural
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", //channel select to get subscribers
        as: "subscribers",
      },
    },
    {
      //how many i have subscribed
      $lookup: {
        //model becomes lowercase and prural
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        //to add aditional fields
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      //used for projection of selected things
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

//aggregation pipeline code goes directly to mongodb without mongoose
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id ),
      },
    },
    {
      //nested lookup becuz 1st will give the id of video next one will give video owner
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
