import { useRef, useState } from "react";
import { useVideoUpload } from "../hooks/useVideoUpload";
import UploadProgressBar from "../components/upload/UploadPrograssBar";

export default function UploadPage() {
  const { upload, progress, status, error } = useVideoUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoFile || !thumbnail) return;

    await upload({ title, description, videoFile, thumbnail });
  }

  const isLoading = status === "uploading" || status === "publishing";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="border rounded px-3 py-2 h-24 resize-none"
        />

        {/* Video picker */}
        <div
          onClick={() => videoInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
        >
          {videoFile ? (
            <p className="text-green-600">{videoFile.name}</p>
          ) : (
            <p className="text-gray-500">Click to select video</p>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Thumbnail picker */}
        <div
          onClick={() => thumbnailInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
        >
          {thumbnail ? (
            <img
              src={URL.createObjectURL(thumbnail)}
              className="h-32 mx-auto object-cover rounded"
              alt="thumbnail preview"
            />
          ) : (
            <p className="text-gray-500">Click to select thumbnail</p>
          )}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
          />
        </div>

        {status === "uploading" && <UploadProgressBar progress={progress} />}
        {status === "publishing" && <p className="text-sm text-gray-500">Saving video...</p>}
        {status === "done" && <p className="text-green-600 font-medium">Video published!</p>}
        {status === "error" && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isLoading || !videoFile || !thumbnail}
          className="bg-blue-600 text-white rounded py-2 px-4 disabled:opacity-50"
        >
          {isLoading ? "Uploading..." : "Publish Video"}
        </button>
      </form>
    </div>
  );
}
