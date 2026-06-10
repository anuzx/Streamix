import "dotenv/config";
import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
import { transcodeToHLS } from "./processor.js";
import { uploadHLSToCloudinary, deleteOriginalFromCloudinary } from "./uploader.js";
import { connectDB, redisConnection } from "shared";
import { Video } from "../backend/src/models/video.model.js";

await connectDB();
console.log("Transcoder connected to MongoDB");

const worker = new Worker(
  "video-transcoding",
  async (job) => {
    const { videoId, publicId, originalUrl } = job.data;
    const tmpDir = path.join("/tmp", videoId);

    console.log(`Processing job for video: ${videoId}`);

    try {
      await job.updateProgress(10);
      await transcodeToHLS(originalUrl, tmpDir);

      await job.updateProgress(70);
      const masterUrl = await uploadHLSToCloudinary(tmpDir, videoId);

      await job.updateProgress(90);
      await Video.findByIdAndUpdate(videoId, {
        hlsUrl: masterUrl,
        isTranscoded: true,
      });

      await deleteOriginalFromCloudinary(publicId);

      fs.rmSync(tmpDir, { recursive: true, force: true });

      await job.updateProgress(100);
      console.log(`Done: ${videoId} → ${masterUrl}`);
    } catch (err) {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));
