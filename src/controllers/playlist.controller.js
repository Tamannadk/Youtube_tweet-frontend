import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    const playlist=await Playlist.create(
        {
            name,
            description,
            owner:req.user._id
        }
    )
    if(!playlist)
    {
        throw new ApiError(404,"Error while creating playlist")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"Playlist created successfully!"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Get user playlists
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            },
        },
        {
            $project: {
                _id: 1, // Include the playlist ID
                title: 1, // Assuming you want to include the title of the playlist
                videoDetails: {
                    title: 1,
                    description: 1,
                    duration: 1,
                    thumbnail: 1,
                    videoFile: 1,
                    views: 1,
                },
                ownerDetails: {
                    username: { $arrayElemAt: ["$ownerDetails.username", 0] }, // Accessing the first element
                    avatar: { $arrayElemAt: ["$ownerDetails.avatar", 0] },
                    fullName: { $arrayElemAt: ["$ownerDetails.fullName", 0] },
                },
            },
        },
    ]);

    if (playlists.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No playlists available!"));
    }

    return res.status(200).json(new ApiResponse(200, playlists, "All playlists fetched!"));
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist=await Playlist.aggregate(
        [
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    foreignField:"_id",
                    localField:"videos",
                    as:"videos",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                foreignField:"_id",
                                localField:"owner",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullName:1,
                                            createdAt:1,
                                            avatar:1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            },
            {
                $project:{
                    title:1,
                    description:1,
                    duration:1,
                    views:1,
                    createdAt:1,
                    _id:1,
                    videoFile:1,
                    thumbnail:1,
                    owner:1
                }
            }
        ]
    )
    if(!playlist)
    {
        throw new ApiError(400,"Invalid playlist Id");
    }
    return res.status(200).json(new ApiResponse(200,playlist,"get playlist by id!"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{videos:videoId}
        },
        {
            new:true
        }
    )
    if(!playlist)
    {
        throw new ApiError(404,"Something went wrong while adding videos")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"added video successfully!"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId)
    {
        throw new ApiError(400,"videoId and playlistId is missing!")
    }
    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new:true
        }
    )
    if(!playlist)
    {
        throw new ApiError(404,"Something went wrong while removing video from the playlist!")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"video removed from the playlist successfully!"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId)
    {
        throw new ApiError(404,"playlistId is required!")
    }
    // TODO: delete playlist
    const deletePlaylist=await Playlist.findByIdAndDelete(playlistId);
    if(!deletePlaylist)
    {
        throw new ApiError(400,"Error while deleting the playlist!");
    }
    return res.status(200).json(new ApiResponse(200,{},"playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!name.trim() || !description.trim())
    {
        throw new ApiError(400,"name and description is required!");
    }
    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name:name,
                description:description,
                owner:req.user._id
            }
        },
        {
            new:true
        }
    )
    if(!playlist)
    {
        throw new ApiError(404,"wrong playList id");
    }
    return res.status(200).json(new ApiResponse(200,playList,"playlist updated successfully!"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
