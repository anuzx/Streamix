import axios from "axios";
import { BACKEND_URL } from "./constants";

export async function uploadVideoToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; publicId: string; duration: number }> {
  const { data: { data } } = await axios.get(`${BACKEND_URL}/videos/signed-url`, {
    withCredentials: true,
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", data.api_key);
  formData.append("signature", data.signature);
  formData.append("timestamp", String(data.timestamp));
  formData.append("folder", data.folder);
  formData.append("eager", data.eager);
  formData.append("eager_async", data.eager_async);

  const { data: result } = await axios.post(
    `https://api.cloudinary.com/v1_1/${data.cloud_name}/video/upload`,
    formData,
    {
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }
  );

  return {
    url: result.secure_url,       // original mp4 URL
    publicId: result.public_id,   // e.g. "videos/abc123"
    duration: result.duration,
  };
}
