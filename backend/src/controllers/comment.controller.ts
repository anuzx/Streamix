import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.model.js";
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const aggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId as string),
      },
    },
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
        content: 1,
        createdAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const options = {
    page: Number(page),
    limit: Number(limit),
  };

  const comments = await Comment.aggregatePaginate(aggregate, options);

  return res.json(
    new ApiResponse(200, comments, "Comments fetched successfully")
  );
});

const addComment = asyncHandler(async (req, res) => {
  // add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  // check video exists
  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  //update a comment

  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content cannot be empty");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // ownership check
  if (comment.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  comment.content = content;
  await comment.save();

  return res.json(
    new ApiResponse(200, comment, "Comment updated successfully")
  );
});

const deleteComment = asyncHandler(async (req, res) => {
  // delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // ownership check
  if (comment.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  await comment.deleteOne();

  return res.json(
    new ApiResponse(200, {}, "Comment deleted successfully")
  );
});

export { getVideoComments, addComment, updateComment, deleteComment };
