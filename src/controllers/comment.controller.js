import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const getVideoComments = asyncHandler(async (req, res) => {
  // Get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const allCommentPipeline = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $unwind: "$owner"
    },
    {
      $project: {
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
        "owner.fullName": 1,
        content: 1,
        createdAt: 1
      }
    }
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const paginatedComments = await Comment.aggregatePaginate(allCommentPipeline, options);

  const response = {
    totalComments: paginatedComments.totalDocs,
    comments: paginatedComments.docs,
    totalPages: paginatedComments.totalPages,
    currentPage: paginatedComments.page
  };

  return res.status(200).json(new ApiResponse(200, response, "Comments fetched successfully!"));
});


const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!videoId) {
    throw new ApiError(404, "Video Id is missing!");
  }
  const createdComment = await Comment.create({
    content: content,
    owner: req.user._id,
  });
  if (!createdComment) {
    throw new ApiError(400, "Error while creating comment!!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, createdComment, "Comment created successfully!")
    );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(404, "commentId is missing");
  }
  const { content } = req.body;
  if (!content.trim()) {
    throw new ApiError(404, "content is required!!");
  }
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "comment updated successfully!")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw new ApiError(404, "Error while deleting comments");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
