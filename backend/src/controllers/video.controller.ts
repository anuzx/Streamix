import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { cloudinary } from "../utils/cloudinary.js";
import { VideoSchema } from "../validator/schema.js";
import type { Request, Response } from "express";

function extractPublicId(url: string): string {
  const urlParts = url.split("/");
  const uploadIndex = urlParts.indexOf("upload");
  const withVersion = urlParts.slice(uploadIndex + 1);
  const withoutVersion = withVersion[0]?.match(/^v\d+$/)
    ? withVersion.slice(1)
    : withVersion;
  const joined = withoutVersion.join("/");
  return joined.replace(/\.[^/.]+$/, "");
}

const getSignedUploadUrl = asyncHandler(async (_req: Request, res: Response) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "videos";
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return res.json(
    new ApiResponse(200, {
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    }, "Signed URL generated")
  );
});

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const matchStage: any = {
    isPublished: true,
  };

  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const sortOrder = sortType === "asc" ? 1 : -1;

  const aggregate = Video.aggregate([
    { $match: matchStage },
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
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        duration: 1,
        createdAt: 1,
        "owner.username": 1,
        "owner.avatar": 1,
      },
    },
    {
      $sort: {
        [sortBy as string]: sortOrder,
      },
    },
  ]);

  const videos = await Video.aggregatePaginate(aggregate, {
    page: Number(page),
    limit: Number(limit),
  });

  return res.json(
    new ApiResponse(
      200,
      videos,
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { data, success } = VideoSchema.safeParse(req.body);
  if (!success) throw new ApiError(400, "Title, Description and Video are required");

  const { title, description, videoUrl, duration } = data;

  const thumbnailLocalPath = (req.files as any)?.thumbnail?.[0]?.path;
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");

  const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnailUpload) throw new ApiError(500, "Failed to upload Thumbnail");

  const publicId = extractPublicId(videoUrl);
  console.log("Extracted publicId →", publicId);

  const video = await Video.create({
    videoFile: videoUrl,
    thumbnail: thumbnailUpload.url,
    owner: req.user,
    title,
    description,
    duration: duration || 0,
    isTranscoded: false,
    hlsUrl: null,
    cloudinaryPublicId: publicId,
  });

  // trigger HLS async — non-blocking
  setImmediate(async () => {
    try {
      console.log("Triggering HLS for:", publicId);
      const result = await cloudinary.uploader.explicit(publicId, {
        resource_type: "video",
        type: "upload",
        eager: [{ streaming_profile: "hd", format: "m3u8" }],
        eager_async: true,
      });

      console.log("explicit() result:", result.eager);

      // Cloudinary sometimes returns the URL immediately even with eager_async
      // save it right away if available so polling resolves on first check
      if (result.eager?.[0]?.secure_url) {
        await Video.findByIdAndUpdate(video._id, {
          isTranscoded: true,
          hlsUrl: result.eager[0].secure_url,
        });
        console.log("HLS URL saved immediately →", result.eager[0].secure_url);
      }
    } catch (err) {
      console.error("HLS trigger failed:", err);
    }
  });

  return res.status(201).json(
    new ApiResponse(201, video, "Video published, HLS transcoding started")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId).populate("owner", "username avatar");
  if (!video) throw new ApiError(404, "Video not found");

  video.views += 1;
  await video.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, video, "Video fetched successfully"));
});

const getVideoStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId).select(
    "isTranscoded hlsUrl videoFile cloudinaryPublicId"
  );
  if (!video) throw new ApiError(404, "Video not found");

  // already done — return from DB without hitting Cloudinary
  if (video.isTranscoded && video.hlsUrl) {
    return res.json(new ApiResponse(200, {
      isTranscoded: true,
      hlsUrl: video.hlsUrl,
      videoFile: video.videoFile,
    }, "Video ready"));
  }

  // not done yet — construct master URL and verify via HEAD request
  try {
    const publicId = video.cloudinaryPublicId || extractPublicId(video.videoFile);

    // get version from Cloudinary
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "video",
    });

    // sp_hd master playlist URL is always this pattern
    const masterUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/sp_hd/v${resource.version}/${publicId}.m3u8`;

    console.log("Checking master URL →", masterUrl);

    const response = await fetch(masterUrl, { method: "HEAD" });

    console.log("Master URL HTTP status →", response.status);

    if (response.ok) {
      // HLS is ready — save to DB so future polls return immediately
      await Video.findByIdAndUpdate(videoId, {
        isTranscoded: true,
        hlsUrl: masterUrl,
      });

      return res.json(new ApiResponse(200, {
        isTranscoded: true,
        hlsUrl: masterUrl,
        videoFile: video.videoFile,
      }, "HLS ready"));
    }
  } catch (err) {
    console.error("Status check failed:", err);
  }

  // still processing — return original so frontend plays something
  return res.json(new ApiResponse(200, {
    isTranscoded: false,
    hlsUrl: null,
    videoFile: video.videoFile,
  }, "Still transcoding"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user) throw new ApiError(403, "Not authorized");

  let thumbnailUrl = video.thumbnail;
  if (req.file?.path) {
    const upload = await uploadOnCloudinary(req.file.path);
    thumbnailUrl = upload?.url;
  }

  video.title = title || video.title;
  video.description = description || video.description;
  video.thumbnail = thumbnailUrl;
  await video.save();

  return res.json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user) throw new ApiError(403, "Not authorized");

  await video.deleteOne();
  return res.json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user) throw new ApiError(403, "Not authorized");

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, video,
    `Video is now ${video.isPublished ? "published" : "unpublished"}`
  ));
});

export {
  getSignedUploadUrl,
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideoStatus,
};
