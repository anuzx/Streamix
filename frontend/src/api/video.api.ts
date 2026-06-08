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

  const { data } = await axios.post(`${BACKEND_URL}/api/v1/videos`, body, {
    withCredentials: true,
  });

  return data;
}
