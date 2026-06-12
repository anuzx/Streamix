import axios from "axios";
import { BACKEND_URL } from "../utils/constants";

export async function publishVideo(payload: {
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  thumbnail: File;
}) {
  const body = new FormData();
  body.append("title", payload.title);
  body.append("description", payload.description);
  body.append("videoUrl", payload.videoUrl);
  body.append("duration", String(payload.duration));
  body.append("thumbnail", payload.thumbnail);

  const { data } = await axios.post(`${BACKEND_URL}/videos`, body, {
    withCredentials: true,
  });
  return data;
}

export async function getChannelVideos(channelId: string) {
  const { data } = await axios.get(`${BACKEND_URL}/dashboard/videos/${channelId}`, {
    withCredentials: true,
  });
  return data.data;
}

export async function getVideoById(videoId: string) {
  const { data } = await axios.get(`${BACKEND_URL}/videos/${videoId}`, {
    withCredentials: true,
  });
  return data.data;
}

export async function getAllVideos(
  page = 1,
  limit = 12
) {
  const { data } = await axios.get(
    `${BACKEND_URL}/videos?page=${page}&limit=${limit}`,
    {
      withCredentials: true,
    }
  );

  return data.data;
}

export async function getVideoStatus(videoId: string): Promise<{
  isTranscoded: boolean;
  hlsUrl: string | null;
  videoFile: string;
}> {
  const { data } = await axios.get(`${BACKEND_URL}/videos/${videoId}/status`, {
    withCredentials: true,
  });
  return data.data;
}
