import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!channelId) {
    throw new ApiError(404, "channelId is missing!");
  }
  const subscribedChannel = await Subscription.aggregate([
    {
      $match: {
        $and: [
          { channel: new mongoose.Types.ObjectId(channelId) },
          { subscriber: new mongoose.Types.ObjectId(req.user._id) },
        ],
      },
    },
  ]);
  if (subscribedChannel.length > 0) {
    // already subscribed so proceed to unsubscribed
    const deleteSubscribedChannel = await Subscription.findByIdAndDelete(
      subscribedChannel[0]._id
    );
    if (!deleteSubscribedChannel) {
      throw new ApiError(404, "Error while unsubscribing!!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Channel unsubscribed successfully!!"
        )
      );
  } else {
    const subscribeChannel = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    if (!subscribeChannel) {
      throw new ApiError(404, "Error while subscribing channel!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: true },
          "Channel subscribed successfully!"
        )
      );
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
      throw new ApiError(404, "Channel ID is missing!");
    }
  
    const AllSubscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId)
        }
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "subscriber",
          as: "subscriberDetails"
        }
      },
      {
        $unwind: "$subscriberDetails"
      },
      {
        $project: {
          "subscriberDetails.username": 1,
          "subscriberDetails.fullName": 1,
          "subscriberDetails.avatar": 1,
          "subscriberDetails.email": 1
        }
      },
      {
        $group: {
          _id: null,  // Setting _id to null to get a single document
          subscribers: { $push: "$subscriberDetails" },
          subscriberCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,  // Remove _id from the output
          subscribers: 1,
          subscriberCount: 1
        }
      }
    ]);
  
    if (!AllSubscribers || AllSubscribers.length === 0) {
      throw new ApiError(404, "No subscribers found!");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, AllSubscribers[0], "All subscribers fetched!"));
  });
  

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const allSubscribedChannels=await Subscription.aggregate(
    [
      {
        $match:{
          subscriber:new mongoose.Types.ObjectId(subscriberId)
        }
      },
      {
        $lookup:{
          from:"users",
          foreignField:"_id",
          localField:"channel",
          as:"channelDetails"
        }
      },
      {
        $unwind:"$channelDetails"
      },
      {
        $project:{
          "channelDetails.username":1,
          "channelDetails.fullName":1,
          "channelDetails.avatar":1,
          "channelDetails.coverImage":1,
          "channelDetails.email":1
        }
      },
      {
        $group:{
          _id:null,
          channels:{$push:"$channelDetails"},
          channelCount:{$sum:1}
        }
      },
      {
        $project:{
          _id:0,
          channelCount:1,
          channels:1
        }
      }
    ]
  )
  if(!allSubscribedChannels || allSubscribedChannels.length==0)
  {
    return res.status(200).json(new ApiResponse(200,{},"You haven't subscribed to any channel yet!"))
  }
  return res.status(200).json(new ApiResponse(200,allSubscribedChannels[0],"All the subscribed channels fetched!"))

});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
