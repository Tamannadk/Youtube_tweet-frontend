import mongoose, { isValidObjectId } from "mongoose";
import { Tweet, Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content.trim()) {
    throw new ApiError(400, "tweet content is required!!");
  }
  const Tweet = await Tweet.create({
    content: content,
    owner: req.user._id,
  });
  if (!Tweet) {
    throw new ApiError(400, "Error while creating tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, Tweet, "Tweet upload successfully!!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User id is missing!!");
  }
  const AllTweetsByUser = await Tweet.findById(userId);
  if (!AllTweetsByUser) {
    return res.status(200).json(200, {}, "No tweet found!!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, AllTweetsByUser, "All tweets fetched successfully!!")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;
  if (!content) {
    throw new ApiError(200, "Tweet content is missing!");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
        owner: req.user._id,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedTweet) {
    throw new ApiError(400, "Error while updating tweet!!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(404, "tweetId is missing!!");
  }
  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) {
    throw new ApiError(400, "Error while deleting tweet!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
