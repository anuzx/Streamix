import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlaylistSchema } from "../validator/schema.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const parsedData = PlaylistSchema.safeParse(req.body)

  if (!parsedData.success) {
    throw new ApiError(400, "invalid input")
  }

  const { name, description } = parsedData.data

  const playlist = await Playlist.create({
    name,
    description,
    videos: [],
    owner: req.user
  })

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlists = await Playlist.find({ owner: userId })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, playlists, "User playlists fetched successfully")
  );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId)
    .populate("owner", "username avatar")
    .populate({
      path: "videos",
      populate: {
        path: "owner",
        select: "username avatar",
      },
    });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.json(
    new ApiResponse(200, playlist, "Playlist fetched successfully")
  );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid IDs");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // ownership check
  if (playlist.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  // check video exists
  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  // avoid duplicates
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already in playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res.json(
    new ApiResponse(200, playlist, "Video added to playlist")
  );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid IDs");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  playlist.videos = playlist.videos.filter(
    (id: string) => id.toString() !== videoId
  );

  await playlist.save();

  return res.json(
    new ApiResponse(200, playlist, "Video removed from playlist")
  );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  await playlist.deleteOne();

  return res.json(
    new ApiResponse(200, {}, "Playlist deleted successfully")
  );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user) {
    throw new ApiError(403, "Not authorized");
  }

  playlist.name = name || playlist.name;
  playlist.description = description || playlist.description;

  await playlist.save();

  return res.json(
    new ApiResponse(200, playlist, "Playlist updated successfully")
  );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
