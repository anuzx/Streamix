import { Worker } from "bullmq";
import { connectDB, redisConnection } from "shared";
import { cloudinary } from "shared";
import { Video } from "../backend/src/models/video.model.js";

await connectDB();
console.log("Transcoder connected to MongoDB");

const worker = new Worker(
  "video-transcoding",
  async (job) => {
    const { videoId, publicId } = job.data;
    console.log(`Polling HLS status for video: ${videoId}, publicId: ${publicId}`);

    await job.updateProgress(10);

    let hlsUrl: string | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 36; // 6 minutes max (some videos take longer)

    while (!hlsUrl && attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: "video",
          eager: true,           // tells the API to include eager[] in response
        });

        console.log(`Attempt ${attempts} — eager array:`, JSON.stringify(resource.eager));

        // eager[] is populated only after the job completes.
        // The correct check is secure_url ending in .m3u8, not e.format
        const eagerEntry = resource.eager?.find(
          (e: any) => e.secure_url?.endsWith(".m3u8")
        );

        if (eagerEntry?.secure_url) {
          hlsUrl = eagerEntry.secure_url;
          console.log(`HLS ready for ${videoId}: ${hlsUrl}`);
        } else {
          console.log(`Attempt ${attempts}: HLS not ready yet for ${videoId}, waiting 10s...`);
          await new Promise(r => setTimeout(r, 10_000));
        }
      } catch (err) {
        console.error(`Cloudinary API error on attempt ${attempts}:`, err);
        await new Promise(r => setTimeout(r, 10_000));
      }

      await job.updateProgress(10 + Math.floor((attempts / MAX_ATTEMPTS) * 85));
    }

    if (!hlsUrl) throw new Error(`HLS transcoding timed out for ${videoId}`);

    // Use the URL Cloudinary gave us, not our own reconstruction
    await Video.findByIdAndUpdate(videoId, {
      hlsUrl,
      isTranscoded: true,
    });

    await job.updateProgress(100);
    console.log(`Done: ${videoId} → ${hlsUrl}`);
  },
  { connection: redisConnection, concurrency: 3 }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));
