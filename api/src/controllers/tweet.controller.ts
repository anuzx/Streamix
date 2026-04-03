import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweets.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { TweetSchema } from "../validator/schema.js";

const createTweet = asyncHandler(async (req, res) => {
  // create tweet
  const parsedData = TweetSchema.safeParse(req.body)

  if (!parsedData.success) {
    throw new ApiError(400, 'invalid input')
  }

  const { content } = parsedData.data

  const tweet = await Tweet.create({
    content,
    owner: req.user
  })

  return res.status(201).json(new ApiResponse(201, tweet, "tweet created"))
});

const getUserTweets = asyncHandler(async (req, res) => {
  // get user tweets

  const tweet = await Tweet.find({ owner: req.user }).populate("owner", "username avatar")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, tweet, "tweets fetched"))
});

const updateTweet = asyncHandler(async (req, res) => {
  //update tweet
  const parsedData = TweetSchema.safeParse(req.body)
  if (!parsedData.success) {
    throw new ApiError(400, "invalid inputs")
  }
  const { tweetId } = req.params
  const { content } = parsedData.data

  const tweet = await Tweet.findById(tweetId)

  tweet.content = content;
  await tweet.save();

  return res.json(
    new ApiResponse(200, tweet, "Tweet updated successfully")
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  // delete tweet 
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // ownership check
  if (tweet.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  await tweet.deleteOne();

  return res.json(
    new ApiResponse(200, {}, "Tweet deleted successfully")
  );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
