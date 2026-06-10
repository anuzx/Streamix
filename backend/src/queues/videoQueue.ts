import { Queue } from "bullmq";

export const connection = {
  host: 'localhost',
  port: 6379,
}

export const videoQueue = new Queue("video-transcoding", { connection });
