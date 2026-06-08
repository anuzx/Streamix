import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // toggle subscription

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "inavlid channelId")
  }

  const existingSubscriber = await Subscription.findOne({
    subsciber: req.user,
    channel: channelId
  })

  if (existingSubscriber) {
    await Subscription.findByIdAndDelete(existingSubscriber._id)
    return res.status(200).json(new ApiResponse(200, { subscribed: false }, "unsubscribed"))
  }

  await Subscription.create({
    subsciber: req.user,
    channel: channelId
  })

  return res.status(201).json(new ApiResponse(201, { subscribed: true }, "subscribed"))
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId as string) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber"
      }
    },
    { $unwind: "subscriber" },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: "$subscriber._id",
          username: "$subscriber.username",
          avatar: "$subscriber.avatar"
        }
      }
    }
  ])

  return res.json(new ApiResponse(200, subscribers, "subscribers fetched"))
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "inavlid subscriberId")
  }

  const subscribedChannels = await Subscription.aggregate(
    [
      {
        $match: { subscriber: new mongoose.Types.ObjectId(subscriberId as string) }
      }, {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel"
        }
      },
      { $unwind: "$channel" },
      {
        $project: {
          _id: 0,
          channel: {
            _id: "$channel._id",
            username: "$channel.username",
            avatar: "$channel.avatar",
          },
        },
      },
    ]
  )

  return res.json(
    new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
  );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
