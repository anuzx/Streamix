import { useState } from "react";
import { uploadVideoToCloudinary } from "../utils/uploadVideo";
import { publishVideo } from "../api/video.api";
import { useUploadStore } from "../store/uploadStore";

type Status = "idle" | "uploading" | "publishing" | "done" | "error";

export function useVideoUpload() {
  const { closeUpload } = useUploadStore();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function upload(payload: {
    title: string;
    description: string;
    videoFile: File;
    thumbnail: File;
  }) {
    try {
      setError(null);
      setStatus("uploading");
      setProgress(0);

      const { url: videoUrl, duration } = await uploadVideoToCloudinary(
        payload.videoFile,
        setProgress
      );

      setStatus("publishing");

      await publishVideo({
        title: payload.title,
        description: payload.description,
        videoUrl,
        duration,
        thumbnail: payload.thumbnail,
      });

      setStatus("done");
      setTimeout(() => closeUpload(), 1500); // close modal after showing success
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setStatus("error");
    }
  }

  return { upload, progress, status, error };
}
