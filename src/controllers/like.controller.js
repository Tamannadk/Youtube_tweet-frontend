import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const likedVideo = await Like.aggregate([
    {
      $match: {
        $and: [{ video: videoId }, { likedBy: req.user._id }],
      },
    },
  ]);
  if (likedVideo.length > 0) {
    // Video is already liked, so we proceed to "unlike" it
    console.log(likedVideo);
    const deleteVideo = await Like.findByIdAndDelete(likedVideo[0]._id);
    if (!deleteVideo) {
      throw new ApiError(400, "Error while unliking video!!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLikedVideo: false },
          "Video disliked successfully!"
        )
      );
  } else {
    // Video is not yet liked, so we proceed to "like" it
    const likeVideo = await Like.create({
      likedBy: req.user._id,
      video: videoId,
    });
    if (!likeVideo) {
      throw new ApiError(400, "Error while liking video!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLikedVideo: true },
          "Video liked successfully!"
        )
      );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const likedComment = await Like.aggregate([
    {
      $match: {
        $and: [{ likedBy: req.user._id }, { comment: commentId }],
      },
    },
  ]);
  if (likedComment.length > 0) {
    // Comment is already liked, so we proceed to "unlike" it\
    const deleteCommentLike = await Like.findByIdAndDelete(likedComment[0]._id);
    if (!deleteCommentLike) {
      throw new ApiError(400, "Error while unliking the comment!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isCommentLiked: false },
          "Comment disliked successfully!"
        )
      );
  } else {
    // Comment is not liked, so we proceed to "like" it
    const likeComment = await Like.create({
      likedBy: req.user._id,
      comment: commentId,
    });
    if (!likeComment) {
      throw new ApiError(400, "Error while liking video!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isCommentLiked: true },
          "Comment liked successfully!"
        )
      );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const likedTweets = await Like.aggregate([
    {
      $match: {
        $and: [{ likedBy: req.user._id }, { tweet: tweetId }],
      },
    },
  ]);
  if (likedTweets.length > 0) {
    const deleteLikedTweet = await Like.findByIdAndDelete(likedTweets[0]._id);
    if (!deleteLikedTweet) {
      throw new ApiError(400, "Error while unliking video!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isTweetLiked: false },
          "Tweet unliked successfully!"
        )
      );
  } else {
    const likeTweet = await Like.create({
      likedBy: req.user._id,
      tweet: tweetId,
    });
    if (!likeTweet) {
      throw new ApiError(404, "Error while liking video");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isTweetLiked: true },
          "Tweet liked successfully!"
        )
      );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const allLikedVideo = await Like.aggregate([
    {
      $match: {
        likedBy: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "video",
        as: "VideoDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "UserDetails",
            },
          },
          {
            $unwind: "$VideoDetails.UserDetails",
          },
        ],
      },
    },
    ,
    {
      $unwind: "$VideoDetails", // Unwind VideoDetails here
    },
    {
      $project: {
        "$VideoDetails.videoFile": 1,
        "$VideoDetails.thumbnail": 1,
        "$VideoDetails.title": 1,
        "$VideoDetails.description": 1,
        "$VideoDetails.duration": 1,
        "$VideoDetails.views": 1,
        "$VideoDetails.isPublished": 1,
        "$UserDetails.username": 1,
        "$UserDetails.fullName": 1,
        "$UserDetails.avatar": 1,
        "$UserDetails.email": 1,
      },
    },
  ]);
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
