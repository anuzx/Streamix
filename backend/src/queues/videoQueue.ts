import { Queue } from "bullmq";
import { redisConnection } from "shared";



export const videoQueue = new Queue("video-transcoding", {
  connection: redisConnection
});
