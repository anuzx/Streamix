import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * GET ALL VIDEOS
 */
const getAllVideos = asyncHandler(async (req, res) => {
  const userId = req.user
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const matchStage: any = {
    isPublished: true,
  };

  // search
  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // filter by user
  if (userId && isValidObjectId(User)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortOrder = sortType === "asc" ? 1 : -1;

  const aggregate = Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        "owner.username": 1,
        "owner.avatar": 1,
      },
    },
    { $sort: { [sortBy]: sortOrder } },
  ]);

  const options = {
    page: Number(page),
    limit: Number(limit),
  };

  const videos = await Video.aggregatePaginate(aggregate, options);

  return res.json(new ApiResponse(200, videos, "Videos fetched successfully"));
});


/**
 * PUBLISH VIDEO
 */
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  const videoUpload = await uploadOnCloudinary(videoLocalPath);
  const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoUpload || !thumbnailUpload) {
    throw new ApiError(500, "Failed to upload files");
  }

  const video = await Video.create({
    videoFile: videoUpload.url,
    thumbnail: thumbnailUpload.url,
    owner: req.user,
    title,
    description,
    duration: videoUpload.duration || "0",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});


/**
 * GET VIDEO BY ID
 */
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username avatar"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // increment views
  video.views += 1;
  await video.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, video, "Video fetched successfully"));
});


/**
 * UPDATE VIDEO
 */
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // ownership check
  if (video.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  let thumbnailUrl = video.thumbnail;

  // update thumbnail if provided
  if (req.file?.path) {
    const upload = await uploadOnCloudinary(req.file.path);
    thumbnailUrl = upload.url;
  }

  video.title = title || video.title;
  video.description = description || video.description;
  video.thumbnail = thumbnailUrl;

  await video.save();

  return res.json(new ApiResponse(200, video, "Video updated successfully"));
});


/**
 * DELETE VIDEO
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // ownership check
  if (video.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  await video.deleteOne();

  return res.json(new ApiResponse(200, {}, "Video deleted successfully"));
});


/**
 * TOGGLE PUBLISH STATUS
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res.json(
    new ApiResponse(
      200,
      video,
      `Video is now ${video.isPublished ? "published" : "unpublished"}`
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
