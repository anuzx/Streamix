import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  //Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId as string);

  // total videos
  const totalVideosPromise = Video.countDocuments({
    owner: channelObjectId,
  });

  // total views
  const totalViewsPromise = Video.aggregate([
    {
      $match: { owner: channelObjectId },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  // total subscribers
  const totalSubscribersPromise = Subscription.countDocuments({
    channel: channelObjectId,
  });

  // total likes (on all videos of this channel)
  const totalLikesPromise = Video.aggregate([
    {
      $match: { owner: channelObjectId },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $project: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likesCount" },
      },
    },
  ]);

  const [
    totalVideos,
    totalViewsResult,
    totalSubscribers,
    totalLikesResult,
  ] = await Promise.all([
    totalVideosPromise,
    totalViewsPromise,
    totalSubscribersPromise,
    totalLikesPromise,
  ]);

  const totalViews = totalViewsResult[0]?.totalViews || 0;
  const totalLikes = totalLikesResult[0]?.totalLikes || 0;

  return res.json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  //Get all the videos uploaded by the channel

  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const videos = await Video.find({
    owner: channelId,
    isPublished: true,
  })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return res.json(
    new ApiResponse(
      200,
      videos,
      "Channel videos fetched successfully"
    )
  );
});

export { getChannelStats, getChannelVideos };
