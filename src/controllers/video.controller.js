import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // Convert sortType to -1 (desc) or 1 (asc) for MongoDB
  const sortDirection = sortType === "desc" ? -1 : 1;

  const allVideosPipeline = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        ...(query && { title: { $regex: query, $options: "i" } }), // Filters by title if query exists
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoOwnerDetails",
      },
    },
    {
      $unwind: "$videoOwnerDetails",
    },
    {
      $project: {
        title: 1,
        description: 1,
        duration: 1,
        thumbnail: 1,
        videoFile: 1,
        views: 1,
        "videoOwnerDetails.username": 1,
        "videoOwnerDetails.fullName": 1,
        "videoOwnerDetails.avatar": 1,
        "videoOwnerDetails.email": 1,
      },
    },
    {
      $sort: { [sortBy]: sortDirection },
    },
  ]);

  // Pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  // Use mongooseAggregatePaginate for paginated response
  const allVideos = await Video.aggregatePaginate(allVideosPipeline, options);

  const response = {
    videoCount: allVideos.totalDocs,
    videos: allVideos.docs,
    totalPages: allVideos.totalPages,
    currentPage: allVideos.page,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Fetched videos successfully!"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoFilePath = req.files.videoFile?.path;
  if (!videoFilePath) {
    throw new ApiError(404, "Video file path is required!");
  }
  //create video
  const video = await uploadOnCloudinary(videoFilePath);
  if (!video) {
    throw new ApiError(404, "Video file is required");
  }
  const publishVideo = await Video.create({
    title,
    description,
    videoFile: video?.url,
    owner: req.user._id,
    isPublished: true,
  });
  if (!publishVideo) {
    throw new ApiError(400, "Error while publishing the video!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, publishVideo, "Video publised successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is missing!");
  }
  //TODO: get video by id
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoOwnerDetails",
      },
    },
    {
      $unwind: "$videoOwnerDetails",
    },
    {
      $project: {
        title: 1,
        duration: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        views: 1,
        "videoOwnerDetails.username": 1,
        "videoOwnerDetails.fullName": 1,
        "videoOwnerDetails.avatar": 1,
        "videoOwnerDetails.email": 1,
      },
    },
  ]);
  if (!video) {
    throw new ApiError(404, "Video is not available!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video is fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(404, "video id is not available!");
  }
  const thumbnailUrl = await uploadOnCloudinary(thumbnail);
  console.log("thumbnailUrl: ", thumbnailUrl);
  if (!thumbnailUrl) {
    throw new ApiError(404, "thumbnail is required!");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail?.url,
      },
    },
    { new: true }
  );
  if (!video) {
    throw new ApiError(404, "Error while updating video!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video details are updated successfully!!")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(404, "video id is missing!");
  }
  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) {
    throw new ApiError(404, "Something went wrong while deleting the video");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(404, "Video Id is missing!");
  }

  // Check if the video already exists
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  // Toggle the publish status
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } }, // Toggles the isPublished field
    { new: true }
  );

  const statusMessage = updatedVideo.isPublished
    ? "Video published"
    : "Video unpublished";

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, statusMessage));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
