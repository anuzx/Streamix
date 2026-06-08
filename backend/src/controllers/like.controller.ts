import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user
  })

  if (existingLike) {
    // Like exists -> remove it (unlike)
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Video unliked successfully"));
  }

  // Like does not exist → create it
  await Like.create({
    video: videoId,
    likedBy: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  // toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user
  })

  //if already liked then unlike 
  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id)
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Comment unliked successfully"));
  }

  //if not liked then like it
  await Like.create({
    comment: commentId,
    likedBy: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  // toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Tweet unliked successfully"));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // get all liked videos
  const userId = req.user

  const likedVideos = await Like.aggregate([

    {
      //filter to only this user likes 
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true, $ne: null } //only video-likes
      }
    },

    //join with the video collection
    {
      $lookup: {
        from: "videos", //mongodb collection name 
        localField: "video", //Like.video
        foreignField: "_id",  //Video._id,
        as: "videoDetails", //result attached here as an array
        // Sub-pipeline: while we are already inside the videos collection,
        // also join the owner (user) so we get their name + avatar in one go.
        pipeline: [{
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",

            pipeline: [{

              //only bring back some fields that we need from the user document 
              $project: {
                fullname: 1,
                username: 1,
                avatar: 1
              }
            }
            ]
          }
        },
        {
          $addFields: {
            owner: { $first: "$owner" }
          }
        }
        ]
      }
    },
    //Flatten videoDetails array → one doc per video
    {
      $unwind: {
        path: "$videoDetails",
        preserveNullAndEmptyArrays: false, // drop likes whose video was deleted
      },
    },

    // Promote videoDetails fields to the top level
    //   After $unwind, each document looks like:
    //   { _id, likedBy, video, videoDetails: { title, thumbnail, ... } }
    //   We use $replaceRoot to make videoDetails the new root document so
    //   the response shape is just the video object (cleaner for the frontend).
    {
      $replaceRoot: {
        newRoot: "$videoDetails",
      },
    },

    // Project only the fields the client needs
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        owner: 1, // already shaped to { fullName, username, avatar }
      },
    },
  ]
  )

  res.status(200).json(new ApiResponse(200, likedVideos, "list of all liked videos"))

});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
