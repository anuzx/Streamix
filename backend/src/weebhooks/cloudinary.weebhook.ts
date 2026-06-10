import { Router } from "express";
import { videoQueue } from "../queues/videoQueue.js";
import { Video } from "../models/video.model.js";

const router = Router();

router.post("/cloudinary", async (req, res) => {
  const { public_id, secure_url, resource_type, notification_type } = req.body;

  if (resource_type !== "video" || notification_type !== "upload") {
    return res.sendStatus(200);
  }

  // find the video in DB by its cloudinary public_id
  const video = await Video.findOne({ videoFile: secure_url });

  if (!video) {
    return res.sendStatus(200); // not our video, ignore
  }

  await videoQueue.add("transcode", {
    videoId: video._id.toString(),
    publicId: public_id,
    originalUrl: secure_url,
  });

  console.log(`Queued transcoding job for video: ${video._id}`);
  return res.sendStatus(200);
});

export default router;
